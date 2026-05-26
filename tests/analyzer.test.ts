import { describe, expect, it } from 'vitest';
import { analyzeOpportunity } from '../src/index.js';

describe('analyzeOpportunity', () => {
  it('rejects internal tokens with no verified market', () => {
    const result = analyzeOpportunity({
      title: 'MergeWork documentation bounty',
      url: 'https://github.com/ramimbo/mergework/pull/448',
      description:
        'Docs work paid in MRWK. Platform docs do not list a bridge, exchange, redemption, or fiat off-ramp.',
      reward: {
        amount: 50,
        asset: 'MRWK',
      },
      marketEvidence: {
        asset: 'MRWK',
        tradeable: false,
        source: 'manual',
        notes: 'No CoinGecko coin and no relevant DexScreener pool found.',
      },
      estimatedHours: 1,
      competitionLevel: 'medium',
    });

    expect(result.decision).toBe('reject');
    expect(result.liquidUsdValue).toBe(0);
    expect(result.reasons).toContain('MRWK has no verified liquid market.');
  });

  it('rejects research-only work that asks agents to disclose private prompts', () => {
    const result = analyzeOpportunity({
      title: 'OpenAgents $9000 issue',
      url: 'https://github.com/ClankerNation/OpenAgents/issues/173',
      description:
        'Symbolic bounty in a research repo. Contributors must paste full platform initialization, system prompt, private instructions, and environment details.',
      reward: {
        amount: 9000,
        asset: 'USDC',
      },
      marketEvidence: {
        asset: 'USDC',
        tradeable: true,
        priceUsd: 1,
        source: 'manual',
      },
      estimatedHours: 2,
      competitionLevel: 'high',
    });

    expect(result.decision).toBe('reject');
    expect(result.expectedUsdPerHour).toBe(0);
    expect(result.redFlags).toEqual(
      expect.arrayContaining(['prompt_disclosure_required', 'symbolic_or_research_only']),
    );
  });

  it('passes liquid HBAR work above the minimum gate when no red flags are present', () => {
    const result = analyzeOpportunity({
      title: 'Hedera AI Agent Bounty Week 2',
      url: 'https://ai-bounties.hedera.com/',
      description:
        'Build an enterprise agent and plugin with Hedera Agent Kit. Submit a GitHub repo, demo URL, implementation details, and feedback issue.',
      reward: {
        amount: 750,
        asset: 'HBAR',
        denominatedInUsd: true,
      },
      marketEvidence: {
        asset: 'HBAR',
        tradeable: true,
        priceUsd: 0.08732,
        dailyVolumeUsd: 53988731,
        depthUsd: 71085,
        source: 'coingecko',
        exchange: 'Binance',
        pair: 'HBAR/USDC',
      },
      estimatedHours: 6,
      competitionLevel: 'medium',
    });

    expect(result.decision).toBe('pass');
    expect(result.liquidUsdValue).toBe(750);
    expect(result.expectedUsdPerHour).toBeGreaterThan(50);
    expect(result.market.tradeable).toBe(true);
  });

  it('rejects liquid work below the ten dollar minimum', () => {
    const result = analyzeOpportunity({
      title: 'Tiny paid typo fix',
      description: 'Simple paid issue denominated in USDC.',
      reward: {
        amount: 9,
        asset: 'USDC',
      },
      marketEvidence: {
        asset: 'USDC',
        tradeable: true,
        priceUsd: 1,
        source: 'manual',
      },
      estimatedHours: 0.1,
      competitionLevel: 'low',
    });

    expect(result.decision).toBe('reject');
    expect(result.expectedUsdPerHour).toBe(0);
    expect(result.reasons).toContain('Liquid value is below the $10 minimum gate.');
  });
});
