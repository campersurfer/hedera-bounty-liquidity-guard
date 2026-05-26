import { createHash } from 'node:crypto';
import type { AuditPacket, OpportunityDecision, OpportunityInput } from './types.js';

export function buildAuditPacket(
  input: OpportunityInput,
  decision: Omit<OpportunityDecision, 'auditPacket'>,
): AuditPacket {
  const payload = {
    title: input.title,
    ...(input.url ? { url: input.url } : {}),
    reward: input.reward,
    decision: decision.decision,
    liquidUsdValue: decision.liquidUsdValue,
    expectedUsdPerHour: decision.expectedUsdPerHour,
    reasons: decision.reasons,
    redFlags: decision.redFlags,
  };

  return {
    digest: sha256(stableStringify(payload)),
    payload,
  };
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}
