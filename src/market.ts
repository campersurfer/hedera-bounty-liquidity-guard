import { KNOWN_LIQUID_STABLES, KNOWN_MAJOR_ASSETS } from './rules.js';
import type { MarketEvidence, RewardTerms } from './types.js';

export function normalizeAsset(asset: string): string {
  return asset.trim().toUpperCase();
}

export function inferMarketEvidence(reward: RewardTerms, explicit?: MarketEvidence): MarketEvidence {
  if (explicit) {
    return {
      ...explicit,
      asset: normalizeAsset(explicit.asset),
    };
  }

  const asset = normalizeAsset(reward.asset);

  if (KNOWN_LIQUID_STABLES.has(asset)) {
    return {
      asset,
      tradeable: true,
      priceUsd: 1,
      source: 'known_asset',
      notes: 'Known dollar-denominated liquid asset.',
    };
  }

  if (KNOWN_MAJOR_ASSETS.has(asset)) {
    return {
      asset,
      tradeable: true,
      source: 'known_asset',
      notes: 'Known major crypto asset; provide live market evidence for production decisions.',
    };
  }

  return {
    asset,
    tradeable: false,
    source: 'manual',
    notes: 'No verified market evidence was supplied.',
  };
}

export function calculateLiquidUsdValue(reward: RewardTerms, market: MarketEvidence): number {
  if (!market.tradeable) {
    return 0;
  }

  if (reward.denominatedInUsd) {
    return roundMoney(reward.amount);
  }

  const asset = normalizeAsset(reward.asset);
  if (KNOWN_LIQUID_STABLES.has(asset)) {
    return roundMoney(reward.amount);
  }

  if (typeof market.priceUsd === 'number' && market.priceUsd > 0) {
    return roundMoney(reward.amount * market.priceUsd);
  }

  return 0;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
