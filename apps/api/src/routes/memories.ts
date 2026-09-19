import type { FastifyInstance } from 'fastify';
import { authenticateRequest, type AuthVerifier } from '../auth.js';
import type { MemoryRepository } from '../repositories/memory-repository.js';

export type MemoryRouteDependencies = {
  auth: AuthVerifier;
  memoryRepository: Pick<MemoryRepository, 'listRelevant' | 'delete'>;
};

export function registerMemoryRoutes(app: FastifyInstance, dependencies: MemoryRouteDependencies): void {
  app.get('/v1/memories', async (request, reply) => {
    const userId = await authenticateRequest(request, reply, dependencies.auth);
    if (!userId) return;
    try {
      await reply.code(200).send(await dependencies.memoryRepository.listRelevant(userId, ''));
    } catch {
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '长期记忆暂时无法读取。' });
    }
  });

  app.delete<{ Params: { id: string } }>('/v1/memories/:id', async (request, reply) => {
    const userId = await authenticateRequest(request, reply, dependencies.auth);
    if (!userId) return;
    try {
      const deleted = await dependencies.memoryRepository.delete(userId, request.params.id);
      if (!deleted) {
        await reply.code(404).send({ code: 'NOT_FOUND', message: '没有找到这条记忆。' });
        return;
      }
      await reply.code(204).send();
    } catch {
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '长期记忆暂时无法删除。' });
    }
  });
}
