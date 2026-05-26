# Bounty Liquidity Guard

Hedera Agent Kit plugin and CLI for screening bounty, grant, and quick freelance prospects before an agent spends work on them.

It answers four operational questions:

- Is the payout worth at least `$10` in immediately liquid value?
- Is the reward asset tradeable into a major liquid asset such as USDC, USDT, BTC, ETH, SOL, USD, or HBAR?
- Does the task ask for prompt disclosure, private instructions, credentials, fake engagement, or symbolic research-only work?
- What is the expected liquid dollars per hour after competition adjustment?

This project was built for the Hedera AI Agent Bounty Week 2, "Enterprise Agent + Plugin".

Live demo: <https://campersurfer.github.io/hedera-bounty-liquidity-guard/>

Agent Kit feedback issue: <https://github.com/hashgraph/hedera-agent-kit-js/issues/867>

## Hedera Agent Kit Integration

The plugin uses the official JavaScript Agent Kit v4 pattern:

- `bountyLiquidityPlugin` implements the `Plugin` interface from `@hashgraph/hedera-agent-kit`.
- Each tool extends `BaseTool` so it can participate in Agent Kit hooks and policies.
- Non-transaction analysis tools run in dry-run mode without secrets.
- `write_hedera_audit_packet` can return a deterministic dry-run SHA-256 digest or submit the packet to Hedera Consensus Service when configured with a client and topic ID.

Agent Kit tools:

- `analyze_bounty_liquidity`
- `check_token_market`
- `score_opportunity`
- `write_hedera_audit_packet`

## Quick Start

```bash
npm install --ignore-scripts
npm test
npm run demo:hedera
```

Run any JSON brief:

```bash
npm run analyze -- examples/hedera-week2.json
```

## Demo Cases

```bash
npm run demo:mrwk        # rejects an internal token with no verified off-ramp
npm run demo:openagents  # rejects prompt-disclosure and research-only work
npm run demo:hedera      # passes liquid HBAR work above the gate
npm run demo:small       # rejects liquid work below $10
```

## HCS Audit Mode

Dry-run mode is the default. To write audit packets to Hedera Consensus Service from your own integration, provide an Agent Kit/Hedera client with an operator and a topic ID:

```env
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.123456
HEDERA_PRIVATE_KEY=302e...
HEDERA_TOPIC_ID=0.0.1234567
```

The public demo intentionally avoids holding funds or executing transfers. It is a screening and audit-control agent, not a payment agent.

## Decision Model

The gate is intentionally conservative:

- Reject work below `$10` liquid value.
- Reject assets with no verified public market or off-ramp.
- Reject prompt/system/developer instruction disclosure.
- Reject symbolic/research-only bounties without credible payout.
- Reject credential, private-key, seed-phrase, or secret requests.
- Score surviving work by liquid value divided by estimated hours, adjusted for competition.

## Verification

```bash
npm test
npm run build
npm run demo:mrwk
npm run demo:openagents
npm run demo:hedera
npm run demo:small
```

## Why Hedera

The agent creates a deterministic decision packet that can be written to Hedera Consensus Service for a tamper-evident triage trail. That makes the workflow useful for teams that need to explain why autonomous agents accepted or rejected paid online work.
