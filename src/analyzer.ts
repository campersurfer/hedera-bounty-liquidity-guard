import { buildAuditPacket } from './auditPacket.js';
import { calculateLiquidUsdValue, inferMarketEvidence, normalizeAsset } from './market.js';
import { detectRedFlags, MINIMUM_LIQUID_USD } from './rules.js';
import { decide, riskLevel, scoreExpectedUsdPerHour } from './scoring.js';
import type { OpportunityDecision, OpportunityInput, RedFlag } from './types.js';

export function analyzeOpportunity(input: OpportunityInput): OpportunityDecision {
  const market = inferMarketEvidence(input.reward, input.marketEvidence);
  const reward = {
    ...input.reward,
    asset: normalizeAsset(input.reward.asset),
  };
  const text = `${input.title}\n${input.url ?? ''}\n${input.description}`;
  const redFlags = detectRedFlags(text);
  const liquidUsdValue = calculateLiquidUsdValue(reward, market);
  const decision = decide({
    liquidUsdValue,
    redFlags,
    tradeable: market.tradeable && liquidUsdValue > 0,
  });
  const expectedUsdPerHour =
    decision === 'reject'
      ? 0
      : scoreExpectedUsdPerHour(liquidUsdValue, input.estimatedHours, input.competitionLevel);
  const reasons = buildReasons({
    asset: reward.asset,
    liquidUsdValue,
    marketTradeable: market.tradeable && liquidUsdValue > 0,
    redFlags,
  });

  const withoutAudit = {
    decision,
    liquidUsdValue,
    expectedUsdPerHour,
    riskLevel: riskLevel({
      decision,
      redFlags,
      tradeable: market.tradeable && liquidUsdValue > 0,
      competitionLevel: input.competitionLevel,
    }),
    reasons,
    market,
    redFlags,
  };

  return {
    ...withoutAudit,
    auditPacket: buildAuditPacket({ ...input, reward }, withoutAudit),
  };
}

function buildReasons(args: {
  asset: string;
  liquidUsdValue: number;
  marketTradeable: boolean;
  redFlags: RedFlag[];
}): string[] {
  const reasons: string[] = [];

  if (!args.marketTradeable) {
    reasons.push(`${args.asset} has no verified liquid market.`);
  }

  if (args.liquidUsdValue > 0 && args.liquidUsdValue < MINIMUM_LIQUID_USD) {
    reasons.push('Liquid value is below the $10 minimum gate.');
  }

  if (args.redFlags.includes('prompt_disclosure_required')) {
    reasons.push('Task requests prompt, instruction, transcript, or private environment disclosure.');
  }

  if (args.redFlags.includes('symbolic_or_research_only')) {
    reasons.push('Task describes symbolic or research-only work rather than credible paid work.');
  }

  if (args.redFlags.includes('credential_or_secret_request')) {
    reasons.push('Task requests credentials, keys, or secrets.');
  }

  if (args.redFlags.includes('fake_engagement_required')) {
    reasons.push('Task appears to require fake engagement or repo-growth activity.');
  }

  if (reasons.length === 0) {
    reasons.push('Reward clears liquidity, value, and red-flag gates.');
  }

  return reasons;
}
