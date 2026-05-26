export type CompetitionLevel = 'low' | 'medium' | 'high';

export type Decision = 'pass' | 'review' | 'reject';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type MarketSource = 'coingecko' | 'dexscreener' | 'major_exchange' | 'manual' | 'known_asset';

export type RewardTerms = {
  amount: number;
  asset: string;
  denominatedInUsd?: boolean;
};

export type MarketEvidence = {
  asset: string;
  tradeable: boolean;
  priceUsd?: number;
  dailyVolumeUsd?: number;
  depthUsd?: number;
  source: MarketSource;
  exchange?: string;
  pair?: string;
  notes?: string;
};

export type OpportunityInput = {
  title: string;
  url?: string;
  description: string;
  reward: RewardTerms;
  marketEvidence?: MarketEvidence;
  estimatedHours: number;
  competitionLevel: CompetitionLevel;
};

export type RedFlag =
  | 'prompt_disclosure_required'
  | 'symbolic_or_research_only'
  | 'fake_engagement_required'
  | 'credential_or_secret_request'
  | 'unverified_payout_path';

export type AuditPacket = {
  digest: string;
  payload: {
    title: string;
    url?: string;
    reward: RewardTerms;
    decision: Decision;
    liquidUsdValue: number;
    expectedUsdPerHour: number;
    reasons: string[];
    redFlags: RedFlag[];
  };
};

export type OpportunityDecision = {
  decision: Decision;
  liquidUsdValue: number;
  expectedUsdPerHour: number;
  riskLevel: RiskLevel;
  reasons: string[];
  market: MarketEvidence;
  redFlags: RedFlag[];
  auditPacket: AuditPacket;
};
