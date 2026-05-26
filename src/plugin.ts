import { BaseTool, type Context, type Plugin } from '@hashgraph/hedera-agent-kit';
import type { Client } from '@hiero-ledger/sdk';
import { z } from 'zod';
import { analyzeOpportunity } from './analyzer.js';
import { inferMarketEvidence } from './market.js';
import { scoreExpectedUsdPerHour } from './scoring.js';
import { writeAuditPacket } from './hederaAudit.js';
import type { AuditPacket, CompetitionLevel, OpportunityInput, RewardTerms } from './types.js';

const rewardSchema = z.object({
  amount: z.number().positive(),
  asset: z.string().min(1),
  denominatedInUsd: z.boolean().optional(),
});

const marketSchema = z.object({
  asset: z.string().min(1),
  tradeable: z.boolean(),
  priceUsd: z.number().positive().optional(),
  dailyVolumeUsd: z.number().nonnegative().optional(),
  depthUsd: z.number().nonnegative().optional(),
  source: z.enum(['coingecko', 'dexscreener', 'major_exchange', 'manual', 'known_asset']),
  exchange: z.string().optional(),
  pair: z.string().optional(),
  notes: z.string().optional(),
});

const opportunitySchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional(),
  description: z.string().min(1),
  reward: rewardSchema,
  marketEvidence: marketSchema.optional(),
  estimatedHours: z.number().positive(),
  competitionLevel: z.enum(['low', 'medium', 'high']),
});

class AnalyzeBountyLiquidityTool extends BaseTool<OpportunityInput, OpportunityInput> {
  method = 'analyze_bounty_liquidity';
  name = 'Analyze Bounty Liquidity';
  description =
    'Screens a bounty or job brief for liquid payout value, prompt-leak/free-work risk, and expected dollars per hour.';
  parameters = opportunitySchema;

  async normalizeParams(params: OpportunityInput): Promise<OpportunityInput> {
    return opportunitySchema.parse(params);
  }

  async coreAction(params: OpportunityInput) {
    const decision = analyzeOpportunity(params);
    return {
      raw: decision,
      humanMessage: `${decision.decision.toUpperCase()}: ${decision.reasons.join(' ')}`,
    };
  }

  async shouldSecondaryAction(): Promise<boolean> {
    return false;
  }

  async secondaryAction(): Promise<null> {
    return null;
  }
}

class CheckTokenMarketTool extends BaseTool<
  { reward: RewardTerms; marketEvidence?: OpportunityInput['marketEvidence'] },
  { reward: RewardTerms; marketEvidence?: OpportunityInput['marketEvidence'] }
> {
  method = 'check_token_market';
  name = 'Check Token Market';
  description = 'Normalizes explicit or known token-market evidence for a bounty reward asset.';
  parameters = z.object({
    reward: rewardSchema,
    marketEvidence: marketSchema.optional(),
  });

  async normalizeParams(params: {
    reward: RewardTerms;
    marketEvidence?: OpportunityInput['marketEvidence'];
  }) {
    return params;
  }

  async coreAction(params: { reward: RewardTerms; marketEvidence?: OpportunityInput['marketEvidence'] }) {
    const market = inferMarketEvidence(params.reward, params.marketEvidence);
    return {
      raw: market,
      humanMessage: market.tradeable
        ? `${market.asset} has tradeable market evidence.`
        : `${market.asset} has no verified liquid market.`,
    };
  }

  async shouldSecondaryAction(): Promise<boolean> {
    return false;
  }

  async secondaryAction(): Promise<null> {
    return null;
  }
}

class ScoreOpportunityTool extends BaseTool<
  { liquidUsdValue: number; estimatedHours: number; competitionLevel: CompetitionLevel },
  { liquidUsdValue: number; estimatedHours: number; competitionLevel: CompetitionLevel }
> {
  method = 'score_opportunity';
  name = 'Score Opportunity';
  description = 'Scores expected liquid dollars per hour after competition adjustment.';
  parameters = z.object({
    liquidUsdValue: z.number().nonnegative(),
    estimatedHours: z.number().positive(),
    competitionLevel: z.enum(['low', 'medium', 'high']),
  });

  async normalizeParams(params: {
    liquidUsdValue: number;
    estimatedHours: number;
    competitionLevel: CompetitionLevel;
  }) {
    return params;
  }

  async coreAction(params: {
    liquidUsdValue: number;
    estimatedHours: number;
    competitionLevel: CompetitionLevel;
  }) {
    const expectedUsdPerHour = scoreExpectedUsdPerHour(
      params.liquidUsdValue,
      params.estimatedHours,
      params.competitionLevel,
    );
    return {
      raw: { expectedUsdPerHour },
      humanMessage: `Expected adjusted value is $${expectedUsdPerHour}/hour.`,
    };
  }

  async shouldSecondaryAction(): Promise<boolean> {
    return false;
  }

  async secondaryAction(): Promise<null> {
    return null;
  }
}

class WriteHederaAuditPacketTool extends BaseTool<
  { packet: AuditPacket; topicId?: string; dryRun?: boolean },
  { packet: AuditPacket; topicId?: string; dryRun?: boolean }
> {
  method = 'write_hedera_audit_packet';
  name = 'Write Hedera Audit Packet';
  description =
    'Writes a decision packet to Hedera Consensus Service when configured, or returns a dry-run packet hash.';
  parameters = z.object({
    packet: z.object({
      digest: z.string().regex(/^[a-f0-9]{64}$/),
      payload: z.record(z.unknown()),
    }),
    topicId: z.string().optional(),
    dryRun: z.boolean().optional(),
  });

  async normalizeParams(params: { packet: AuditPacket; topicId?: string; dryRun?: boolean }) {
    return params;
  }

  async coreAction(
    params: { packet: AuditPacket; topicId?: string; dryRun?: boolean },
    _context: Context,
    client: Client,
  ) {
    const result = await writeAuditPacket({
      packet: params.packet,
      client,
      topicId: params.topicId,
      dryRun: params.dryRun ?? true,
    });
    return {
      raw: result,
      humanMessage: result.message,
    };
  }

  async shouldSecondaryAction(): Promise<boolean> {
    return false;
  }

  async secondaryAction(): Promise<null> {
    return null;
  }
}

export const bountyLiquidityPlugin: Plugin = {
  name: 'bounty-liquidity-guard',
  version: '0.1.0',
  description:
    'Hedera Agent Kit plugin that screens bounties for liquid payout quality and writes auditable decision packets.',
  tools: () => [
    new AnalyzeBountyLiquidityTool(),
    new CheckTokenMarketTool(),
    new ScoreOpportunityTool(),
    new WriteHederaAuditPacketTool(),
  ],
};
