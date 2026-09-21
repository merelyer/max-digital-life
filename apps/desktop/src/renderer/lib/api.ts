export type ChatResponse = { messageId: string; text: string; savedMemory: boolean };

export type ConversationHistoryMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };
export type ConversationHistory = { messages: ConversationHistoryMessage[] };

export type ApiMemory = {
  id: string;
  userId: string;
  content: string;
  kind: 'profile' | 'study' | 'shared';
  importance: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
};

export type ApiProactiveMessage = {
  id: string;
  userId: string;
  reason: 'random_check_in' | 'evening_check_in' | 'unfinished_topic';
  content: string;
  sourceTimestamp: string;
  deliveredAt: string;
  dismissedAt: string | null;
};

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type ApiClientOptions = {
  baseURL: string;
  getAccessToken: () => Promise<string | null>;
  conversationId?: string;
  timezone?: () => string;
  fetchImpl?: FetchImplementation;
};

export class ApiError extends Error {
  public readonly code: string | undefined;

  public constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

export class ApiClient {
  private readonly baseURL: string;
  private readonly getAccessToken: () => Promise<string | null>;
  private readonly conversationId: string;
  private readonly timezone: () => string;
  private readonly fetchImpl: FetchImplementation;

  public constructor(options: ApiClientOptions) {
    this.baseURL = options.baseURL.replace(/\/+$/u, '');
    this.getAccessToken = options.getAccessToken;
    this.conversationId = options.conversationId ?? createConversationId();
    this.timezone = options.timezone ?? (() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    this.fetchImpl = options.fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  }

  public sendChat(text: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/v1/chat', { method: 'POST', body: { conversationId: this.conversationId, text } });
  }

  public getConversationHistory(): Promise<ConversationHistory> {
    return this.request<ConversationHistory>(`/v1/chat/history?conversationId=${encodeURIComponent(this.conversationId)}`);
  }

  public listMemories(): Promise<ApiMemory[]> {
    return this.request<ApiMemory[]>('/v1/memories');
  }

  public async deleteMemory(id: string): Promise<void> {
    await this.request(`/v1/memories/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  public getInbox(): Promise<ApiProactiveMessage[]> {
    return this.request<ApiProactiveMessage[]>('/v1/proactive/inbox');
  }

  public checkProactive(): Promise<{ delivered: boolean; message: ApiProactiveMessage | null }> {
    return this.request<{ delivered: boolean; message: ApiProactiveMessage | null }>('/v1/proactive/check', { method: 'POST' });
  }

  public async dismissProactive(id: string): Promise<void> {
    await this.request(`/v1/proactive/inbox/${encodeURIComponent(id)}/dismiss`, { method: 'POST' });
  }

  public setProactiveEnabled(enabled: boolean): Promise<{ enabled: boolean }> {
    return this.request<{ enabled: boolean }>('/v1/preferences/proactive', { method: 'POST', body: { enabled } });
  }

  public getProactiveEnabled(): Promise<{ enabled: boolean }> {
    return this.request<{ enabled: boolean }>('/v1/preferences/proactive');
  }

  private async request<T>(path: string, input: { method?: string; body?: unknown } = {}): Promise<T> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'x-user-timezone': this.timezone()
    };
    if (input.body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await this.fetchImpl(`${this.baseURL}${path}`, {
      method: input.method ?? 'GET',
      headers,
      body: input.body === undefined ? undefined : JSON.stringify(input.body)
    });
    const payload: unknown = await readPayload(response);
    if (!response.ok) {
      const errorPayload = asErrorPayload(payload);
      throw new ApiError(errorPayload.message ?? `请求失败（${response.status}）。`, errorPayload.code);
    }
    return payload as T;
  }
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function asErrorPayload(value: unknown): { message?: string; code?: string } {
  if (typeof value !== 'object' || value === null) return {};
  const payload = value as Record<string, unknown>;
  return {
    message: typeof payload.message === 'string' ? payload.message : undefined,
    code: typeof payload.code === 'string' ? payload.code : undefined
  };
}

function createConversationId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `desktop-${Date.now().toString(36)}`;
}
