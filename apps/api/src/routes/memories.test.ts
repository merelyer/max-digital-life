import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { registerMemoryRoutes } from './memories';
import type { MemoryRecord } from '../repositories/memory-repository';

describe('memory routes', () => {
  it('lists and deletes only through the authenticated user repository boundary', async () => {
    const memory: MemoryRecord = { id: 'm-1', userId: 'u-1', content: '考研焦虑时希望被陪伴', kind: 'study', importance: 4, createdAt: '2026-09-19T00:00:00.000Z' };
    const listRelevant = vi.fn(async () => [memory]);
    const remove = vi.fn(async (userId: string, id: string) => userId === 'u-1' && id === 'm-1');
    const app = Fastify();
    registerMemoryRoutes(app, {
      auth: { verify: async (token) => token === 'valid' ? 'u-1' : null },
      memoryRepository: { listRelevant, delete: remove }
    });

    const listed = await app.inject({ method: 'GET', url: '/v1/memories', headers: { authorization: 'Bearer valid' } });
    const deleted = await app.inject({ method: 'DELETE', url: '/v1/memories/m-1', headers: { authorization: 'Bearer valid' } });

    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toEqual([memory]);
    expect(listRelevant).toHaveBeenCalledWith('u-1', '');
    expect(deleted.statusCode).toBe(204);
    expect(remove).toHaveBeenCalledWith('u-1', 'm-1');
    await app.close();
  });
});
