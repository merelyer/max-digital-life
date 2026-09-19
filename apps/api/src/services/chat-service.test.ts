import { describe, expect, it } from 'vitest';
import { ChatService, type ChatModel } from './chat-service';
import type { ConversationRepository } from '../repositories/conversation-repository';
import type { MemoryRecord } from '../repositories/memory-repository';

function makeConversationRepository(): ConversationRepository & { messages: string[] } {
  const messages: string[] = [];
  return {
    messages,
    ensure: async () => undefined,
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
});
