import { describe, expect, it } from 'vitest';
import { MemoryRepository, type MemoryRecord, type MemoryStore } from './memory-repository';

describe('MemoryRepository', () => {
  it('deletes only a memory owned by the requesting user', async () => {
    const rows: MemoryRecord[] = [{ id: 'm-1', userId: 'u-1', content: 'exam date', kind: 'study', importance: 4, createdAt: '2026-09-19T00:00:00.000Z' }];
    const store: MemoryStore = {
      list: async () => rows,
      delete: async (userId, memoryId) => {
        const index = rows.findIndex((row) => row.userId === userId && row.id === memoryId);
        if (index < 0) return false;
        rows.splice(index, 1);
        return true;
      },
      create: async (userId, draft) => {
        const record = { id: `m-${rows.length + 1}`, userId, ...draft, createdAt: '2026-09-19T00:00:00.000Z' };
        rows.push(record);
        return record;
      }
    };
    const repository = new MemoryRepository(store);

    await expect(repository.delete('u-2', 'm-1')).resolves.toBe(false);
    await expect(repository.delete('u-1', 'm-1')).resolves.toBe(true);
  });
});
