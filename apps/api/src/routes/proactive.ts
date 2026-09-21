import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticateRequest, type AuthVerifier } from '../auth.js';
import type { PreferenceRepository } from '../repositories/preference-repository.js';
import type { ProactiveMessageRepository, ProactiveReason } from '../repositories/proactive-repository.js';
import type { ProactiveService } from '../services/proactive-service.js';
import { ModelUnavailableError } from '../services/errors.js';

const preferenceSchema = z.object({ enabled: z.boolean() }).strict();
const runSchema = z.object({
  userId: z.string().trim().min(1),
  timezone: z.string().trim().min(1),
  deliveredToday: z.number().int().min(0),
  enabled: z.boolean(),
  reason: z.enum(['random_check_in', 'evening_check_in', 'unfinished_topic']).optional(),
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

  app.post('/v1/proactive/check', async (request, reply) => {
    const userId = await authenticateRequest(request, reply, dependencies.auth);
    if (!userId) return;
    const timezoneHeader = request.headers['x-user-timezone'];
    const timezone = typeof timezoneHeader === 'string' && timezoneHeader.length > 0 ? timezoneHeader : 'UTC';
    const now = new Date();
    try {
      const preference = await dependencies.preferenceRepository.get(userId);
      const day = localDayBounds(now, timezone);
      const deliveredToday = await dependencies.proactiveRepository.countDeliveredSince(userId, day.start.toISOString(), day.end.toISOString());
      // The desktop client checks at a random interval. The server deliberately
      // does not impose a daily count cap; it only records the local day for
      // observability and future policy changes.
      const reason = 'random_check_in' as const;
      const message = await dependencies.proactiveService.runForUser({ userId, timezone, deliveredToday, enabled: preference.proactiveEnabled, reason, sourceTimestamp: now.toISOString() });
      await reply.code(200).send({ delivered: Boolean(message), message });
    } catch (error) {
      if (error instanceof ModelUnavailableError) {
        await reply.code(503).send({ code: 'MODEL_UNAVAILABLE', message: 'Max 暂时连不上，稍后再试。' });
        return;
      }
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '主动消息暂时无法检查。' });
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

  app.post<{ Params: { id: string } }>('/v1/proactive/inbox/:id/dismiss', async (request, reply) => {
    const userId = await authenticateRequest(request, reply, dependencies.auth);
    if (!userId) return;
    try {
      const dismissed = await dependencies.proactiveRepository.dismiss(userId, request.params.id);
      if (!dismissed) {
        await reply.code(404).send({ code: 'NOT_FOUND', message: '没有找到这条主动消息。' });
        return;
      }
      await reply.code(204).send();
    } catch {
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '主动消息暂时无法标记为已读。' });
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

  app.get('/v1/preferences/proactive', async (request, reply) => {
    const userId = await authenticateRequest(request, reply, dependencies.auth);
    if (!userId) return;
    try {
      const preference = await dependencies.preferenceRepository.get(userId);
      await reply.code(200).send({ enabled: preference.proactiveEnabled });
    } catch {
      await reply.code(503).send({ code: 'MEMORY_UNAVAILABLE', message: '主动消息设置暂时无法读取。' });
    }
  });
}

function localDayBounds(date: Date, timezone: string): { start: Date; end: Date } {
  const values = localDateParts(date, timezone);
  const start = zonedMidnightUtc(values.year, values.month, values.day, timezone);
  const next = new Date(Date.UTC(values.year, values.month - 1, values.day + 1));
  const nextValues = localDateParts(next, timezone);
  return { start, end: zonedMidnightUtc(nextValues.year, nextValues.month, nextValues.day, timezone) };
}

function zonedMidnightUtc(year: number, month: number, day: number, timezone: string): Date {
  const guess = Date.UTC(year, month - 1, day);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(guess));
  const values = numericParts(parts);
  const displayedAsUtc = Date.UTC(requirePart(values, 'year'), requirePart(values, 'month') - 1, requirePart(values, 'day'), requirePart(values, 'hour'), requirePart(values, 'minute'), requirePart(values, 'second'));
  return new Date(guess - (displayedAsUtc - guess));
}

function localDateParts(date: Date, timezone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = numericParts(parts);
  return { year: requirePart(values, 'year'), month: requirePart(values, 'month'), day: requirePart(values, 'day') };
}

function numericParts(parts: Intl.DateTimeFormatPart[]): Record<string, number> {
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  return values;
}

function requirePart(values: Record<string, number>, key: string): number {
  const value = values[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Missing local date field: ${key}`);
  return value;
}
