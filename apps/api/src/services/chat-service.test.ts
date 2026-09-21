import { describe, expect, it } from 'vitest';
import { ChatService, type ChatModel } from './chat-service';
import type { ConversationRepository } from '../repositories/conversation-repository';
import type { MemoryRecord } from '../repositories/memory-repository';

function makeConversationRepository(): ConversationRepository & { messages: string[] } {
  const messages: string[] = [];
  return {
    messages,
    ensure: async () => undefined,
    listMessages: async () => [],
    appendMessage: async (_userId, _conversationId, _role, content) => {
      messages.push(content);
      return `message-${messages.length}`;
    }
  };
}

describe('ChatService', () => {
  it('passes relevant memories to Max and saves an accepted memory draft', async () => {
    const model: ChatModel & { calls: Array<{ messages: Array<{ role: string; content: string }> }> } = {
      calls: [],
      complete: async ({ messages }) => {
        model.calls.push({ messages });
        return model.calls.length === 1
          ? '我听见了你的焦虑。我们先把今天的高数任务拆成一小步。'
          : JSON.stringify({ save: true, content: '用户最近在准备考研，今天复习高数时感到焦虑。', kind: 'study', importance: 4 });
      }
    };
    const memoryRepository = {
      created: [] as unknown[],
      listRelevant: async () => [{ id: 'm-1', userId: 'u-1', content: '用户正在准备考研。', kind: 'study', importance: 4, createdAt: '2026-09-19T00:00:00.000Z' } satisfies MemoryRecord],
      create: async (_userId: string, draft: unknown) => {
        memoryRepository.created.push(draft);
        return { id: 'm-2', userId: 'u-1', ...(draft as object), createdAt: '2026-09-19T00:00:00.000Z' } as MemoryRecord;
      }
    };
    const service = new ChatService({
      model,
      conversationRepository: makeConversationRepository(),
      memoryRepository
    });

    const result = await service.reply({ userId: 'u-1', conversationId: 'c-1', text: '今天高数复习很焦虑。' });

    expect(model.calls[0]?.messages.at(-1)?.content).toContain('今天高数复习很焦虑。');
    expect(model.calls[0]?.messages.some((message) => message.content.includes('考研'))).toBe(true);
    expect(memoryRepository.created).toHaveLength(1);
    expect(result.savedMemory).toBe(true);
    expect(result.text).toContain('焦虑');
  });

  it('does not fail the reply when memory extraction is invalid', async () => {
    const model: ChatModel = {
      complete: async ({ messages }) => messages.some((message) => message.content.includes('严格 JSON')) ? '{not-json' : '先休息五分钟，再继续。'
    };
    const service = new ChatService({
      model,
      conversationRepository: makeConversationRepository(),
      memoryRepository: {
        listRelevant: async () => [],
        create: async () => {
          throw new Error('should not create');
        }
      }
    });

    await expect(service.reply({ userId: 'u-1', conversationId: 'c-1', text: '我有点累。' })).resolves.toMatchObject({ savedMemory: false });
  });

  it('gives Max bounded prior conversation context before the new message', async () => {
    const model: ChatModel & { calls: Array<{ messages: Array<{ role: string; content: string }> }> } = {
      calls: [],
      complete: async ({ messages }) => {
        model.calls.push({ messages });
        return model.calls.length === 1 ? '我记得你刚才提到高数。' : JSON.stringify({ save: false, content: '', kind: 'study', importance: 1 });
      }
    };
    const conversationRepository = makeConversationRepository();
    conversationRepository.listMessages = async () => [
      { id: 'old-user', role: 'user', content: '我刚做完一套高数题。', createdAt: '2026-09-20T10:00:00.000Z' },
      { id: 'old-assistant', role: 'assistant', content: '辛苦了，错题先标出来。', createdAt: '2026-09-20T10:00:01.000Z' }
    ];
    const service = new ChatService({
      model,
      conversationRepository,
      memoryRepository: { listRelevant: async () => [], create: async () => { throw new Error('unused'); } }
    });

    await service.reply({ userId: 'u-1', conversationId: 'c-1', text: '现在有点累。' });

    expect(model.calls[0]?.messages.map((message) => message.content)).toEqual([
      expect.stringContaining('你是 Max'),
      '相关长期记忆：暂无。',
      '我刚做完一套高数题。',
      '辛苦了，错题先标出来。',
      '现在有点累。'
    ]);
  });

  it('keeps the generated reply when saving a memory fails', async () => {
    let completion = 0;
    const model: ChatModel = {
      complete: async () => {
        completion += 1;
        return completion === 1
          ? '先休息五分钟。'
          : JSON.stringify({ save: true, content: '用户正在准备考研。', kind: 'study', importance: 4 });
      }
    };
    const service = new ChatService({
      model,
      conversationRepository: makeConversationRepository(),
      memoryRepository: { listRelevant: async () => [], create: async () => { throw new Error('database temporarily unavailable'); } }
    });

    await expect(service.reply({ userId: 'u-1', conversationId: 'c-1', text: '我今天准备考研。' })).resolves.toMatchObject({ text: '先休息五分钟。', savedMemory: false });
  });
});
