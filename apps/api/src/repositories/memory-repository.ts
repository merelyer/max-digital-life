import type { MemoryDraft, MemoryKind } from '@max/domain';

export type MemoryRecord = {
  id: string;
  userId: string;
  content: string;
  kind: MemoryKind;
  importance: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
};

export type MemoryStore = {
  list(userId: string): Promise<MemoryRecord[]>;
  delete(userId: string, memoryId: string): Promise<boolean>;
  create(userId: string, draft: MemoryDraft): Promise<MemoryRecord>;
};

export class MemoryRepository {
  public constructor(private readonly store: MemoryStore) {}

  public async listRelevant(userId: string, query: string): Promise<MemoryRecord[]> {
    const memories = await this.store.list(userId);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return memories.slice(0, 12);
    const tokens = normalizedQuery.split(/\s+/u).filter(Boolean);
    return memories
      .filter((memory) => {
        const content = memory.content.toLocaleLowerCase();
        return tokens.some((token) => content.includes(token));
      })
      .slice(0, 12);
  }

  public delete(userId: string, memoryId: string): Promise<boolean> {
    return this.store.delete(userId, memoryId);
  }

  public create(userId: string, draft: MemoryDraft): Promise<MemoryRecord> {
    return this.store.create(userId, draft);
  }
}
