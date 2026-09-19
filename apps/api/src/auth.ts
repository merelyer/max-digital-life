import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ServiceClient } from './supabase.js';

export type AuthVerifier = {
  verify(token: string): Promise<string | null>;
};

export function createSupabaseAuthVerifier(client: ServiceClient): AuthVerifier {
  return {
    async verify(token) {
      const { data, error } = await client.auth.getUser(token);
      if (error || !data.user) return null;
      return data.user.id;
    }
  };
}

export function readBearerToken(value: string | string[] | undefined): string | null {
  if (typeof value !== 'string') return null;
  const match = /^Bearer ([^\s]+)$/u.exec(value);
  return match?.[1] ?? null;
}

export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  verifier: AuthVerifier
): Promise<string | null> {
  const token = readBearerToken(request.headers.authorization);
  if (!token) {
    await reply.code(401).send({ code: 'UNAUTHORIZED', message: '登录已失效，请重新登录。' });
    return null;
  }

  const userId = await verifier.verify(token);
  if (!userId) {
    await reply.code(401).send({ code: 'UNAUTHORIZED', message: '登录已失效，请重新登录。' });
    return null;
  }
  return userId;
}
