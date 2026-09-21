import { describe, expect, it, vi } from 'vitest';
import { createChatServer } from '../server';

describe('POST /v1/chat', () => {
  it('rejects missing and invalid Supabase access tokens', async () => {
    const app = createChatServer({
      auth: { verify: async (token) => token === 'valid-token' ? 'u-1' : null },
      chatService: { reply: async () => ({ messageId: 'm-1', text: 'ok', savedMemory: false }) }
    });

    const missing = await app.inject({ method: 'POST', url: '/v1/chat', payload: { conversationId: 'c-1', text: 'hi' } });
    const invalid = await app.inject({ method: 'POST', url: '/v1/chat', headers: { authorization: 'Bearer wrong' }, payload: { conversationId: 'c-1', text: 'hi' } });

    expect(missing.statusCode).toBe(401);
    expect(invalid.statusCode).toBe(401);
    await app.close();
  });

  it('sends the Supabase access token to auth but never exposes server secrets', async () => {
    const seenTokens: string[] = [];
    const app = createChatServer({
      auth: { verify: async (token) => { seenTokens.push(token); return 'u-1'; } },
      chatService: { reply: async () => ({ messageId: 'm-1', text: 'Max 在这里。', savedMemory: false }) }
    });

    const response = await app.inject({ method: 'POST', url: '/v1/chat', headers: { authorization: 'Bearer access-token' }, payload: { conversationId: 'c-1', text: 'hi' } });

    expect(response.statusCode).toBe(200);
    expect(seenTokens).toEqual(['access-token']);
    expect(response.body).not.toContain('TOKENDANCE_API_KEY');
    await app.close();
  });

  it('returns a stable error for malformed requests', async () => {
    const app = createChatServer({
      auth: { verify: async () => 'u-1' },
      chatService: { reply: async () => ({ messageId: 'm-1', text: 'unused', savedMemory: false }) }
    });

    const response = await app.inject({ method: 'POST', url: '/v1/chat', headers: { authorization: 'Bearer valid-token' }, payload: { conversationId: '', text: '' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: 'INVALID_REQUEST' });
    await app.close();
  });
});

describe('GET /v1/chat/history', () => {
  it('returns only the authenticated conversation history', async () => {
    const history = vi.fn(async ({ userId, conversationId }: { userId: string; conversationId: string }) => ({
      messages: [
        { id: 'm-1', role: 'user' as const, content: `${userId}:${conversationId}:hello`, createdAt: '2026-09-20T10:00:00.000Z' }
      ]
    }));
    const app = createChatServer({
      auth: { verify: async () => 'u-1' },
      chatService: {
        reply: async () => ({ messageId: 'm-1', text: 'unused', savedMemory: false }),
        history
      }
    });

    const response = await app.inject({ method: 'GET', url: '/v1/chat/history?conversationId=c-1', headers: { authorization: 'Bearer valid-token' } });

    expect(response.statusCode).toBe(200);
    expect(history).toHaveBeenCalledWith({ userId: 'u-1', conversationId: 'c-1' });
    expect(response.json()).toEqual({ messages: [{ id: 'm-1', role: 'user', content: 'u-1:c-1:hello', createdAt: '2026-09-20T10:00:00.000Z' }] });
    await app.close();
  });
});
