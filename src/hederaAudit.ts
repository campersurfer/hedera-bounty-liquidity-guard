import { TopicMessageSubmitTransaction, type Client } from '@hiero-ledger/sdk';
import type { AuditPacket } from './types.js';

export type AuditWriteResult = {
  mode: 'dry-run' | 'hcs';
  digest: string;
  topicId?: string;
  transactionId?: string;
  message: string;
};

export async function writeAuditPacket(args: {
  packet: AuditPacket;
  client?: Client;
  topicId?: string;
  dryRun?: boolean;
}): Promise<AuditWriteResult> {
  if (args.dryRun !== false || !args.client || !args.topicId) {
    return {
      mode: 'dry-run',
      digest: args.packet.digest,
      message: `Dry-run audit packet ${args.packet.digest}`,
    };
  }

  const response = await new TopicMessageSubmitTransaction()
    .setTopicId(args.topicId)
    .setMessage(JSON.stringify(args.packet))
    .execute(args.client);

  return {
    mode: 'hcs',
    digest: args.packet.digest,
    topicId: args.topicId,
    transactionId: response.transactionId.toString(),
    message: `Wrote audit packet ${args.packet.digest} to Hedera topic ${args.topicId}`,
  };
}
