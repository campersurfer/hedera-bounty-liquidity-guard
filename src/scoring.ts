import { competitionMultiplier, MINIMUM_LIQUID_USD } from './rules.js';
import type { CompetitionLevel, Decision, RedFlag, RiskLevel } from './types.js';
import { roundMoney } from './market.js';

const DISQUALIFYING_FLAGS = new Set<RedFlag>([
  'prompt_disclosure_required',
  'symbolic_or_research_only',
  'credential_or_secret_request',
]);

export function scoreExpectedUsdPerHour(
  liquidUsdValue: number,
  estimatedHours: number,
  competitionLevel: CompetitionLevel,
): number {
  if (liquidUsdValue <= 0 || estimatedHours <= 0) {
    return 0;
  }

  return roundMoney((liquidUsdValue / estimatedHours) * competitionMultiplier(competitionLevel));
}

export function decide(args: {
  liquidUsdValue: number;
  redFlags: RedFlag[];
  tradeable: boolean;
}): Decision {
  if (args.redFlags.some((flag) => DISQUALIFYING_FLAGS.has(flag))) {
    return 'reject';
  }

  if (!args.tradeable || args.liquidUsdValue < MINIMUM_LIQUID_USD) {
    return 'reject';
  }

  return 'pass';
}

export function riskLevel(args: {
  decision: Decision;
  redFlags: RedFlag[];
  tradeable: boolean;
  competitionLevel: CompetitionLevel;
}): RiskLevel {
  if (args.redFlags.some((flag) => DISQUALIFYING_FLAGS.has(flag))) {
    return 'critical';
  }

  if (args.decision === 'reject' || !args.tradeable) {
    return 'high';
  }

  if (args.competitionLevel === 'high' || args.redFlags.length > 0) {
    return 'medium';
  }

  return 'low';
}
