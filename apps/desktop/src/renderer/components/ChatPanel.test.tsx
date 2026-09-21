import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatPanel } from './ChatPanel';
import type { ApiSurface, TimelineMessage } from '../types';

function makeApi(sendChat: ApiSurface['sendChat']): ApiSurface {
  return {
    sendChat,
    listMemories: async () => [],
    deleteMemory: async () => undefined,
    getInbox: async () => [],
    checkProactive: async () => ({ delivered: false, message: null }),
    setProactiveEnabled: async (enabled) => ({ enabled }),
    getProactiveEnabled: async () => ({ enabled: true })
  };
}

describe('ChatPanel', () => {
  it('does not submit Enter while a Chinese IME composition is active', async () => {
    const sendChat = vi.fn(async () => ({ messageId: 'm-1', text: '收到', savedMemory: false }));
    const onMessagesChange = vi.fn();
    render(<ChatPanel api={makeApi(sendChat)} messages={[]} onMessagesChange={onMessagesChange} />);
    const input = screen.getByRole('textbox', { name: '和 Max 说点什么' });

    await userEvent.type(input, 'ni');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }));

    expect(sendChat).not.toHaveBeenCalled();
  });

  it('appends a delayed reply without overwriting a proactive message that arrived meanwhile', async () => {
    let resolveReply: ((value: { messageId: string; text: string; savedMemory: boolean }) => void) | undefined;
    const sendChat = vi.fn(() => new Promise<{ messageId: string; text: string; savedMemory: boolean }>((resolve) => { resolveReply = resolve; }));
    let messages: TimelineMessage[] = [];
    const onMessagesChange = (update: TimelineMessage[] | ((current: TimelineMessage[]) => TimelineMessage[])): void => {
      messages = typeof update === 'function' ? update(messages) : update;
    };
    const { rerender } = render(<ChatPanel api={makeApi(sendChat)} messages={messages} onMessagesChange={onMessagesChange} />);
    const input = screen.getByRole('textbox', { name: '和 Max 说点什么' });
    await userEvent.type(input, '你好');
    await userEvent.click(screen.getByRole('button', { name: '发送' }));
    messages = [...messages, { id: 'p-1', role: 'proactive', text: '今天也来看看你。' }];
    rerender(<ChatPanel api={makeApi(sendChat)} messages={messages} onMessagesChange={onMessagesChange} />);

    resolveReply?.({ messageId: 'm-1', text: '我在。', savedMemory: false });
    await Promise.resolve();
    rerender(<ChatPanel api={makeApi(sendChat)} messages={messages} onMessagesChange={onMessagesChange} />);
    await screen.findByText('我在。');
    expect(screen.getByText('今天也来看看你。')).toBeVisible();
  });
});
