import Fastify from 'fastify';
import { describe, expect, it, vi } from 'vitest';
import { registerProactiveRoutes } from './proactive';
import type { ProactiveMessageRepository } from '../repositories/proactive-repository';

describe('proactive and preference routes', () => {
  it('returns 401 when the cron secret is wrong', async () => {
    const app = Fastify();
    registerProactiveRoutes(app, {
      auth: { verify: async () => 'u-1' },
      cronSecret: 'a'.repeat(24),
      preferenceRepository: { get: async () => ({ proactiveEnabled: true }), setProactiveEnabled: vi.fn(async () => undefined) },
      proactiveRepository: { listUndismissed: async () => [], countDeliveredSince: async () => 0, create: async () => { throw new Error('unused'); } } satisfies ProactiveMessageRepository,
      proactiveService: { runForUser: async () => null }
    });

    const response = await app.inject({ method: 'POST', url: '/internal/proactive/run', headers: { 'x-cron-secret': 'wrong' }, payload: { userId: 'u-1', timezone: 'Asia/Shanghai', deliveredToday: 0, enabled: true } });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('persists the supplied preference before responding', async () => {
    const setProactiveEnabled = vi.fn(async () => undefined);
    const app = Fastify();
    registerProactiveRoutes(app, {
      auth: { verify: async (token) => token === 'valid' ? 'u-1' : null },
      cronSecret: 'a'.repeat(24),
      preferenceRepository: { get: async () => ({ proactiveEnabled: true }), setProactiveEnabled },
      proactiveRepository: { listUndismissed: async () => [], countDeliveredSince: async () => 0, create: async () => { throw new Error('unused'); } } satisfies ProactiveMessageRepository,
      proactiveService: { runForUser: async () => null }
    });

    const response = await app.inject({ method: 'POST', url: '/v1/preferences/proactive', headers: { authorization: 'Bearer valid' }, payload: { enabled: false } });

    expect(response.statusCode).toBe(200);
    expect(setProactiveEnabled).toHaveBeenCalledWith('u-1', false);
    await app.close();
  });

  it('returns only the authenticated user inbox from the repository', async () => {
    const listUndismissed = vi.fn(async (userId: string) => [{ id: 'p-1', userId, reason: 'evening_check_in' as const, content: '喝水', sourceTimestamp: '2026-09-19T10:00:00.000Z', deliveredAt: '2026-09-19T10:01:00.000Z', dismissedAt: null }]);
    const app = Fastify();
    registerProactiveRoutes(app, {
      auth: { verify: async () => 'u-1' },
      cronSecret: 'a'.repeat(24),
      preferenceRepository: { get: async () => ({ proactiveEnabled: true }), setProactiveEnabled: async () => undefined },
      proactiveRepository: { listUndismissed, countDeliveredSince: async () => 0, create: async () => { throw new Error('unused'); } } satisfies ProactiveMessageRepository,
      proactiveService: { runForUser: async () => null }
    });

    const response = await app.inject({ method: 'GET', url: '/v1/proactive/inbox', headers: { authorization: 'Bearer valid' } });

    expect(response.statusCode).toBe(200);
    expect(listUndismissed).toHaveBeenCalledWith('u-1');
    expect(response.json()).toHaveLength(1);
    await app.close();
  });
});
