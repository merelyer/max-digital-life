import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateRequest, type AuthVerifier } from '../auth';
import { ChatService, type ChatResponse } from '../services/chat-service';
import { MemoryUnavailableError, ModelUnavailableError } from '../services/errors';

const chatRequestSchema = z.object({
  conversationId: z.string().trim().min(1).max(100),
  text: z.string().trim().min(1).max(8000)
}).strict();

export function registerChatRoute(app: FastifyInstance, dependencies: { auth: AuthVerifier; chatService: ChatService | { reply(input: { userId: string; conversationId: string; text: string }): Promise<ChatResponse> } }): void {
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
}
