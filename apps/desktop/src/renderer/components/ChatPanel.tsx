import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { ApiSurface, RoomActivity, TimelineMessage } from '../types';

type MessageUpdate = TimelineMessage[] | ((current: TimelineMessage[]) => TimelineMessage[]);

export function ChatPanel(props: { api: ApiSurface; messages: TimelineMessage[]; onMessagesChange: (update: MessageUpdate) => void; onActivityChange?: (activity: RoomActivity) => void; onMemorySaved?: () => void }): ReactElement {
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activityTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => {
    if (activityTimer.current !== undefined) window.clearTimeout(activityTimer.current);
  }, []);

  async function send(): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setError(null);
    props.onActivityChange?.('thinking');
    const userMessage: TimelineMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmed };
    props.onMessagesChange((current) => [...current, userMessage]);
    setText('');
    try {
      const response = await props.api.sendChat(trimmed);
      props.onMessagesChange((current) => [...current, { id: response.messageId, role: 'assistant', text: response.text }]);
      if (response.savedMemory) props.onMemorySaved?.();
      props.onActivityChange?.('speaking');
      activityTimer.current = window.setTimeout(() => {
        props.onActivityChange?.('idle');
        activityTimer.current = undefined;
      }, 2200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '这次没有收到 Max 的回复。');
      props.onActivityChange?.('idle');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="chat-card" aria-labelledby="chat-title">
      <header className="panel-header">
        <div>
          <p className="eyebrow">OPEN CHANNEL</p>
          <h2 id="chat-title">和 Max 说说话</h2>
        </div>
        <span className="online-dot">在线</span>
      </header>
      <div className="chat-timeline" aria-live="polite">
        {props.messages.length === 0 ? <p className="empty-chat">今天想从哪一句开始？<br /><span>不用组织得很完整，Max 会接住你的意思。</span></p> : null}
        {props.messages.map((message) => (
          <article className={`bubble bubble-${message.role}`} key={message.id}>
            <span className="bubble-label">{message.role === 'user' ? '你' : 'Max'}</span>
            <p>{message.text}</p>
          </article>
        ))}
        {pending ? <div className="typing" aria-label="Max 正在输入"><i /><i /><i /></div> : null}
      </div>
      {error ? <p className="chat-error" role="alert">{error}</p> : null}
      <div className="composer">
        <label className="sr-only" htmlFor="chat-input">和 Max 说点什么</label>
        <textarea id="chat-input" aria-label="和 Max 说点什么" value={text} onChange={(event) => setText(event.target.value)} placeholder="写下此刻，不用想得太完整…" rows={2} disabled={pending} onKeyDown={(event) => { if (event.nativeEvent.isComposing) return; if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} />
        <button className="send-button" type="button" onClick={() => { void send(); }} disabled={pending || !text.trim()} aria-label="发送">{pending ? '…' : '发送'}</button>
      </div>
    </section>
  );
}
