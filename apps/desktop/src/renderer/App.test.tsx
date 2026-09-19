import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import type { AuthSession, AuthClient } from './lib/auth';
import type { ApiClient, ApiMemory, ApiProactiveMessage, ChatResponse } from './lib/api';

type AuthSurface = Pick<AuthClient, 'getSession' | 'signIn' | 'signUp' | 'signOut'>;
type ApiSurface = Pick<ApiClient, 'sendChat' | 'listMemories' | 'deleteMemory' | 'getInbox' | 'checkProactive' | 'setProactiveEnabled' | 'getProactiveEnabled'> & { dismissProactive?: (id: string) => Promise<void> };

const session: AuthSession = { access_token: 'user-token' };

function makeAuth(current: AuthSession | null): AuthSurface {
  return {
    getSession: async () => current,
    signIn: async () => session,
    signUp: async () => session,
    signOut: async () => undefined
  };
}

function makeApi(overrides: Partial<ApiSurface> = {}): ApiSurface {
  return {
    sendChat: async (): Promise<ChatResponse> => ({ messageId: 'm-1', text: '我在。', savedMemory: false }),
    listMemories: async (): Promise<ApiMemory[]> => [],
    deleteMemory: async () => undefined,
    getInbox: async (): Promise<ApiProactiveMessage[]> => [],
    checkProactive: async () => ({ delivered: false, message: null }),
    setProactiveEnabled: async (enabled) => ({ enabled }),
    getProactiveEnabled: async () => ({ enabled: true }),
    ...overrides
  };
}

describe('App', () => {
  it('shows login before the room when no Supabase session exists', async () => {
    render(<App api={makeApi()} auth={makeAuth(null)} />);

    expect(await screen.findByRole('heading', { name: '让 Max 认出你' })).toBeVisible();
    expect(screen.queryByRole('textbox', { name: '和 Max 说点什么' })).not.toBeInTheDocument();
  });

  it('shows the white-dog room and disables Send while the reply is pending', async () => {
    let resolveReply: ((value: ChatResponse) => void) | undefined;
    const sendChat = vi.fn(() => new Promise<ChatResponse>((resolve) => { resolveReply = resolve; }));
    render(<App api={makeApi({ sendChat })} auth={makeAuth(session)} />);

    expect(await screen.findByRole('img', { name: 'Max，白色小狗' })).toBeVisible();
    const input = screen.getByRole('textbox', { name: '和 Max 说点什么' });
    await userEvent.type(input, '今天很累');
    await userEvent.click(screen.getByRole('button', { name: '发送' }));
    expect(screen.getByRole('button', { name: '发送' })).toBeDisabled();
    resolveReply?.({ messageId: 'm-1', text: '先休息一下。', savedMemory: false });
  });

  it('removes a deleted memory from the visible list after the API confirms', async () => {
    const memory: ApiMemory = { id: 'm-1', userId: 'u-1', content: '考研焦虑时希望被陪伴', kind: 'study', importance: 4, createdAt: '2026-09-19T00:00:00.000Z' };
    render(<App api={makeApi({ listMemories: async () => [memory] })} auth={makeAuth(session)} />);

    expect(await screen.findByText('考研焦虑时希望被陪伴')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: '删除记忆 考研焦虑时希望被陪伴' }));
    expect(await screen.findByText('还没有留下长期记忆。')).toBeVisible();
    expect(screen.queryByText('考研焦虑时希望被陪伴')).not.toBeInTheDocument();
  });
});
