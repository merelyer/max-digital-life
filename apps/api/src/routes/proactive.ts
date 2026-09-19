import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateRequest, type AuthVerifier } from '../auth';
import type { PreferenceRepository } from '../repositories/preference-repository';
import type { ProactiveMessageRepository, ProactiveReason } from '../repositories/proactive-repository';
import type { ProactiveService } from '../services/proactive-service';
import { ModelUnavailableError } from '../services/errors';

const preferenceSchema = z.object({ enabled: z.boolean() }).strict();
const runSchema = z.object({
  userId: z.string().trim().min(1),
  timezone: z.string().trim().min(1),
  deliveredToday: z.number().int().min(0),
  enabled: z.boolean(),
  reason: z.enum(['evening_check_in', 'unfinished_topic']).optional(),
  sourceTimestamp: z.string().trim().min(1).optional()
}).strict();

export type ProactiveRouteDependencies = {
  auth: AuthVerifier;
  cronSecret: string;
  preferenceRepository: PreferenceRepository;
  proactiveRepository: ProactiveMessageRepository;
  proactiveService: ProactiveService | { runForUser(input: { userId: string; timezone: string; deliveredToday: number; enabled: boolean; reason?: ProactiveReason; sourceTimestamp?: string }): Promise<unknown> };
};

export function registerProactiveRoutes(app: FastifyInstance, dependencies: ProactiveRouteDependencies): void {
  app.post('/internal/proactive/run', async (request, reply) => {
    const secret = request.headers['x-cron-secret'];
    if (secret !== dependencies.cronSecret) {
      await reply.code(401).send({ code: 'UNAUTHORIZED', message: '定时任务凭证无效。' });
      return;
    }
    const parsed = runSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.code(400).send({ code: 'INVALID_REQUEST', message: '主动消息请求格式不正确。' });
      return;
    }
    const timezoneHeader = request.headers['x-user-timezone'];
    const timezone = typeof timezoneHeader === 'string' ? timezoneHeader : parsed.data.timezone;
    try {
      const message = await dependencies.proactiveService.runForUser({ ...parsed.data, timezone });
      await reply.code(200).send({ delivered: Boolean(message), message });
    } catch (error) {
      if (error instanceof ModelUnavailableError) {
        await reply.code(503).send({ code: 'MODEL_UNAVAILABLE', message: 'Max 暂时连不上，稍后再试。' });
        return;
      }
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '主动消息暂时无法保存。' });
    }
  });

  app.get('/v1/proactive/inbox', async (request, reply) => {
    const userId = await authenticateRequest(request, reply, dependencies.auth);
    if (!userId) return;
    try {
      await reply.code(200).send(await dependencies.proactiveRepository.listUndismissed(userId));
    } catch {
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '主动消息暂时无法读取。' });
    }
  });

  app.post('/v1/preferences/proactive', async (request, reply) => {
    const userId = await authenticateRequest(request, reply, dependencies.auth);
    if (!userId) return;
    const parsed = preferenceSchema.safeParse(request.body);
    if (!parsed.success) {
      await reply.code(400).send({ code: 'INVALID_REQUEST', message: '偏好设置格式不正确。' });
      return;
    }
    try {
      await dependencies.preferenceRepository.setProactiveEnabled(userId, parsed.data.enabled);
      await reply.code(200).send({ enabled: parsed.data.enabled });
    } catch {
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '主动消息设置暂时无法保存。' });
    }
  });
}
