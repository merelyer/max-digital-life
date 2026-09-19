export type ProactiveReason = 'evening_check_in' | 'unfinished_topic';

export type ProactiveMessage = {
  id: string;
  userId: string;
  reason: ProactiveReason;
  content: string;
  sourceTimestamp: string;
  deliveredAt: string;
  dismissedAt: string | null;
};

export type ProactiveMessageDraft = {
  reason: ProactiveReason;
  content: string;
  sourceTimestamp: string;
  deliveredAt: string;
};

export type ProactiveMessageStore = {
  countDeliveredSince(userId: string, since: string, until: string): Promise<number>;
  create(userId: string, draft: ProactiveMessageDraft): Promise<ProactiveMessage>;
  listUndismissed(userId: string): Promise<ProactiveMessage[]>;
  dismiss(userId: string, messageId: string): Promise<boolean>;
};

export type ProactiveMessageRepository = ProactiveMessageStore;

export function createProactiveMessageRepository(store: ProactiveMessageStore): ProactiveMessageRepository {
  return store;
}
