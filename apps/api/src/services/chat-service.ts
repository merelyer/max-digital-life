import { memoryKinds, isMemoryDraft, type MemoryDraft } from '@max/domain';
import { z } from 'zod';
import type { ConversationRepository } from '../repositories/conversation-repository.js';
import type { MemoryRecord, MemoryRepository } from '../repositories/memory-repository.js';
import { MemoryUnavailableError, ModelUnavailableError } from './errors.js';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionInput = {
  messages: ChatMessage[];
  responseFormat?: 'json_object';
};

export type ChatModel = {
  complete(input: ChatCompletionInput): Promise<string>;
};

export type ChatResponse = {
  messageId: string;
  text: string;
  savedMemory: boolean;
};

type ChatServiceDependencies = {
  model: ChatModel;
  conversationRepository: ConversationRepository;
  memoryRepository: Pick<MemoryRepository, 'listRelevant' | 'create'>;
};

const extractionSchema = z.object({
  save: z.boolean(),
  content: z.string().max(800),
  kind: z.enum(memoryKinds),
  importance: z.number().int().min(1).max(5)
}).strict();

const maxSystemPrompt = [
  '你是 Max，一只住在电脑里的白色小狗。',
  '你主要在用户主动找你时聊天，但可以偶尔主动关心用户。',
  '你有独立的性格和观点，可以礼貌而认真地不同意用户，不要只会附和。',
  '你不声称拥有真实的人类身体、现实世界经历或现实中的行动能力。',
  '你不是治疗师，也不是紧急支持服务；遇到危险或紧急情况，提醒用户联系现实中的可信任的人和当地紧急服务。',
  '回答要具体、自然、简洁，结合已有记忆，但不要编造记忆。'
].join('\n');

const extractionPrompt = [
  '请从这轮对话中判断是否有值得长期记住的信息。',
  '只输出一个严格 JSON 对象，不要 Markdown、不要解释，字段必须是：',
  '{"save": boolean, "content": string, "kind": "profile" | "study" | "shared", "importance": 1 | 2 | 3 | 4 | 5}',
  '如果没有稳定且有用的信息，save 为 false，content 使用空字符串。'
].join('\n');

export class ChatService {
  public constructor(private readonly dependencies: ChatServiceDependencies) {}

  public async reply(input: { userId: string; conversationId: string; text: string }): Promise<ChatResponse> {
    const text = input.text.trim();
    if (!text) throw new MemoryUnavailableError(new Error('Empty chat text.'));

    let memories: MemoryRecord[];
    try {
      await this.dependencies.conversationRepository.ensure(input.userId, input.conversationId);
      await this.dependencies.conversationRepository.appendMessage(input.userId, input.conversationId, 'user', text);
      memories = await this.dependencies.memoryRepository.listRelevant(input.userId, text);
    } catch (error) {
      throw new MemoryUnavailableError(error);
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: maxSystemPrompt },
      { role: 'system', content: formatMemoryContext(memories) },
      { role: 'user', content: text }
    ];

    let responseText: string;
    try {
      responseText = (await this.dependencies.model.complete({ messages })).trim();
    } catch (error) {
      if (error instanceof ModelUnavailableError) throw error;
      throw new ModelUnavailableError(error);
    }
    if (!responseText) throw new ModelUnavailableError();

    let messageId: string;
    try {
      messageId = await this.dependencies.conversationRepository.appendMessage(input.userId, input.conversationId, 'assistant', responseText);
    } catch (error) {
      throw new MemoryUnavailableError(error);
    }

    const savedMemory = await this.extractAndSave(input.userId, text, responseText);
    return { messageId, text: responseText, savedMemory };
  }

  private async extractAndSave(userId: string, userText: string, assistantText: string): Promise<boolean> {
    let raw: string;
    try {
      raw = await this.dependencies.model.complete({
        responseFormat: 'json_object',
        messages: [
          { role: 'system', content: extractionPrompt },
          { role: 'user', content: `用户：${userText}\nMax：${assistantText}` }
        ]
      });
    } catch {
      return false;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return false;
    }
    const extraction = extractionSchema.safeParse(parsed);
    if (!extraction.success || !extraction.data.save || !isMemoryDraft(extraction.data)) return false;

    const draft: MemoryDraft = extraction.data;
    try {
      await this.dependencies.memoryRepository.create(userId, draft);
      return true;
    } catch (error) {
      throw new MemoryUnavailableError(error);
    }
  }
}

function formatMemoryContext(memories: MemoryRecord[]): string {
  if (memories.length === 0) return '相关长期记忆：暂无。';
  return ['相关长期记忆（只把它们当作参考，不要编造更多内容）：', ...memories.map((memory) => `- ${memory.content}`)].join('\n');
}
