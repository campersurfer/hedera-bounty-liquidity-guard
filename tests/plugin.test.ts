import { Client } from '@hiero-ledger/sdk';
import { AgentMode } from '@hashgraph/hedera-agent-kit';
import { describe, expect, it } from 'vitest';
import { bountyLiquidityPlugin } from '../src/index.js';

const context = {
  mode: AgentMode.RETURN_BYTES,
  accountId: '0.0.1001',
};

describe('bountyLiquidityPlugin', () => {
  it('exposes the expected Agent Kit tool methods', () => {
    const methods = bountyLiquidityPlugin.tools(context).map((tool) => tool.method);

    expect(methods).toEqual([
      'analyze_bounty_liquidity',
      'check_token_market',
      'score_opportunity',
      'write_hedera_audit_packet',
    ]);
  });

  it('runs a full dry-run analysis through the plugin tool', async () => {
    const client = Client.forTestnet();
    const analyzeTool = bountyLiquidityPlugin
      .tools(context)
      .find((tool) => tool.method === 'analyze_bounty_liquidity');

    expect(analyzeTool).toBeDefined();

    const result = await analyzeTool!.execute(client, context, {
      title: 'Hedera AI Agent Bounty Week 2',
      description: 'Build an enterprise agent and plugin with Hedera Agent Kit.',
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
      },
      estimatedHours: 6,
      competitionLevel: 'medium',
    });

    expect(result.raw.decision).toBe('pass');
    expect(result.humanMessage).toContain('PASS');
    expect(result.raw.auditPacket.digest).toMatch(/^[a-f0-9]{64}$/);
  });
});
