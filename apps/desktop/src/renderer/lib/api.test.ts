import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from './api';

describe('ApiClient', () => {
  it('sends the Supabase access token and local timezone without any model key', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ messageId: 'm-1', text: '晚上好', savedMemory: false }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const client = new ApiClient({
      baseURL: 'https://api.example.test',
      getAccessToken: async () => 'user-token',
      conversationId: 'c-1',
      timezone: () => 'Asia/Shanghai',
      fetchImpl: fetchMock
    });

    await client.sendChat('晚上好');

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/chat', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer user-token', 'x-user-timezone': 'Asia/Shanghai' })
    }));
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('sk-');
  });

  it('surfaces the server error message exactly', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ code: 'MODEL_UNAVAILABLE', message: 'Max 暂时连不上，稍后再试。' }), { status: 503, headers: { 'content-type': 'application/json' } }));
    const client = new ApiClient({ baseURL: 'https://api.example.test', getAccessToken: async () => 'user-token', fetchImpl: fetchMock });

    await expect(client.sendChat('晚上好')).rejects.toThrow('Max 暂时连不上，稍后再试。');
  });
});
