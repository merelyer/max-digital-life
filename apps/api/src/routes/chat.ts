import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateRequest, type AuthVerifier } from '../auth.js';
import { ChatService, type ChatHistoryResponse, type ChatResponse } from '../services/chat-service.js';
import { ConversationAccessError, MemoryUnavailableError, ModelUnavailableError } from '../services/errors.js';

const chatRequestSchema = z.object({
  conversationId: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(8000)
}).strict();
const historyQuerySchema = z.object({ conversationId: z.string().trim().min(1).max(100) }).strict();

type ChatRouteService = {
  reply(input: { userId: string; conversationId: string; text: string }): Promise<ChatResponse>;
  history?: (input: { userId: string; conversationId: string }) => Promise<ChatHistoryResponse>;
};

export function registerChatRoute(app: FastifyInstance, dependencies: { auth: AuthVerifier; chatService: ChatService | ChatRouteService }): void {
  app.post('/v1/chat', async (request, reply) => {
    const userId = await authenticateRequest(request, reply, dependencies.auth);
    if (!userId) return;

    const parsed = chatRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.code(400).send({ code: 'INVALID_REQUEST', message: '请求格式不正确。' });
      return;
    }

    try {
      const response = await dependencies.chatService.reply({ userId, ...parsed.data });
      await reply.code(200).send(response);
    } catch (error) {
      if (error instanceof ConversationAccessError) {
        await reply.code(403).send({ code: 'CONVERSATION_FORBIDDEN', message: '这段对话不属于当前账号。' });
        return;
      }
      if (error instanceof ModelUnavailableError) {
        await reply.code(503).send({ code: 'MODEL_UNAVAILABLE', message: 'Max 暂时连不上，稍后再试。' });
        return;
      }
      if (error instanceof MemoryUnavailableError) {
        await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '本轮对话未保存为长期记忆。' });
        return;
      }
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '本轮对话未保存为长期记忆。' });
    }
  });

  app.get('/v1/chat/history', async (request, reply) => {
    const userId = await authenticateRequest(request, reply, dependencies.auth);
    if (!userId) return;
    const parsed = historyQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      await reply.code(400).send({ code: 'INVALID_REQUEST', message: '请求格式不正确。' });
      return;
    }
    try {
      const history = dependencies.chatService.history;
      await reply.code(200).send(history ? await history.call(dependencies.chatService, { userId, conversationId: parsed.data.conversationId }) : { messages: [] });
    } catch (error) {
      if (error instanceof ConversationAccessError) {
        await reply.code(403).send({ code: 'CONVERSATION_FORBIDDEN', message: '这段对话不属于当前账号。' });
        return;
      }
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '历史对话暂时无法读取。' });
    }
  });
}
