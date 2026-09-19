import { describe, expect, it, vi } from 'vitest';
import { ProactiveService } from './proactive-service';
import type { ProactiveMessage, ProactiveMessageRepository } from '../repositories/proactive-repository';
import type { ChatModel } from './chat-service';

function makeRepository() {
  const create = vi.fn(async (_userId: string, draft: { reason: 'evening_check_in' | 'unfinished_topic'; content: string; sourceTimestamp: string; deliveredAt: string }) => ({
    id: 'p-1', userId: 'u-1', ...draft, dismissedAt: null
  } satisfies ProactiveMessage));
  const repository: ProactiveMessageRepository = {
    countDeliveredSince: async () => 0,
    create,
    listUndismissed: async () => []
  };
  return { repository, create };
}

describe('ProactiveService', () => {
  it('does not create a message after two deliveries today', async () => {
    const { repository, create } = makeRepository();
    const model: ChatModel = { complete: vi.fn(async () => '今天也记得早点休息。') };
    const service = new ProactiveService({ repository, model });

    await service.runForUser({ userId: 'u-1', timezone: 'Asia/Shanghai', deliveredToday: 2, enabled: true });

    expect(create).not.toHaveBeenCalled();
    expect(model.complete).not.toHaveBeenCalled();
  });

  it('does not call the model or create a message when proactive messages are disabled', async () => {
    const { repository, create } = makeRepository();
    const model: ChatModel = { complete: vi.fn(async () => '不应发送') };
    const service = new ProactiveService({ repository, model });

    await service.runForUser({ userId: 'u-1', timezone: 'Asia/Shanghai', deliveredToday: 0, enabled: false });

    expect(create).not.toHaveBeenCalled();
    expect(model.complete).not.toHaveBeenCalled();
  });

  it('stores the reason and source timestamp for an eligible message', async () => {
    const { repository, create } = makeRepository();
    const model: ChatModel = { complete: vi.fn(async () => '今天复习到这里就很好了，去喝口水吧。') };
    const service = new ProactiveService({ repository, model, now: () => new Date('2026-09-19T12:00:00.000Z') });

    const result = await service.runForUser({ userId: 'u-1', timezone: 'Asia/Shanghai', deliveredToday: 0, enabled: true, reason: 'unfinished_topic', sourceTimestamp: '2026-09-19T11:30:00.000Z' });

    expect(create).toHaveBeenCalledWith('u-1', expect.objectContaining({ reason: 'unfinished_topic', sourceTimestamp: '2026-09-19T11:30:00.000Z', deliveredAt: '2026-09-19T12:00:00.000Z' }));
    expect(result?.content).toContain('喝口水');
  });
});
