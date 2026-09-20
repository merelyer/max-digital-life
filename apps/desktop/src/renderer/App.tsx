import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ApiClient } from './lib/api';
import { createAuthClient, type AuthSession } from './lib/auth';
import { ChatPanel } from './components/ChatPanel';
import { LoginPanel } from './components/LoginPanel';
import { MaxRoom } from './components/MaxRoom';
import { MemoryPanel } from './components/MemoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import type { ApiMemory, ApiProactiveMessage, ApiSurface, AuthSurface, RoomActivity, TimelineMessage } from './types';
import './styles/app.css';

export type AppProps = { api?: ApiSurface; auth?: AuthSurface };

export function App(props: AppProps): ReactElement {
  const auth = useMemo(() => props.auth ?? createDefaultAuth(), [props.auth]);
  const api = useMemo(() => props.api ?? createDefaultApi(auth), [props.api, auth]);
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);
  const [memories, setMemories] = useState<ApiMemory[]>([]);
  const [messages, setMessages] = useState<TimelineMessage[]>([]);
  const [roomActivity, setRoomActivity] = useState<RoomActivity>('idle');
  const [proactiveEnabled, setProactiveEnabled] = useState(true);
  const [proactivePreferenceReady, setProactivePreferenceReady] = useState(false);
  const seenInbox = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    void auth.getSession().then((next) => { if (active) setSession(next); }).catch(() => { if (active) setSession(null); });
    return () => { active = false; };
  }, [auth]);

  useEffect(() => {
    if (!session) {
      setProactivePreferenceReady(false);
      return undefined;
    }
    let active = true;
    setProactivePreferenceReady(false);
    const loadInitialData = async (): Promise<void> => {
      const [memoriesResult, preferenceResult] = await Promise.allSettled([api.listMemories(), api.getProactiveEnabled()]);
      if (!active) return;
      if (memoriesResult.status === 'fulfilled') setMemories(memoriesResult.value);
      if (preferenceResult.status === 'fulfilled') {
        setProactiveEnabled(preferenceResult.value.enabled);
        setProactivePreferenceReady(true);
      }
    };
    void loadInitialData();
    return () => { active = false; };
  }, [api, session]);

  useEffect(() => {
    if (!session || !proactivePreferenceReady || !proactiveEnabled) return undefined;
    let active = true;
    let timer: number | undefined;
    const loadInbox = async (): Promise<void> => {
      try {
        await api.checkProactive();
        const inbox = await api.getInbox();
        if (!active) return;
        appendInbox(inbox, seenInbox, setMessages, api);
      } catch {
        // The chat remains usable when the optional inbox is temporarily unavailable.
      }
    };
    const scheduleNext = (): void => {
      if (!active) return;
      timer = window.setTimeout(async () => {
        await loadInbox();
        scheduleNext();
      }, randomProactiveDelay());
    };
    scheduleNext();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [api, proactiveEnabled, proactivePreferenceReady, session]);

  if (session === undefined) return <main className="loading-shell" aria-label="正在打开 Max">正在打开 Max…</main>;
  if (!session) return <LoginPanel auth={auth} onAuthenticated={() => { void auth.getSession().then(setSession); }} />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup"><span className="brand-dot" aria-hidden="true" /><div><p className="eyebrow">A DIGITAL LIFE</p><h1>max<span>/</span>room</h1></div></div>
        <div className="header-actions"><span className="session-label">这台电脑 · 已连接</span><button className="text-button" type="button" onClick={() => { void auth.signOut().then(() => setSession(null)); }}>退出</button></div>
      </header>
      <main className="app-grid">
        <MaxRoom memoryCount={memories.length} activity={roomActivity} />
        <ChatPanel api={api} messages={messages} onMessagesChange={setMessages} onActivityChange={setRoomActivity} />
      </main>
      <footer className="utility-grid">
        <MemoryPanel api={api} memories={memories} onMemoriesChange={setMemories} />
        <SettingsPanel api={api} enabled={proactiveEnabled} onEnabledChange={setProactiveEnabled} />
      </footer>
    </div>
  );
}

function appendInbox(inbox: ApiProactiveMessage[], seen: { current: Set<string> }, setMessages: (update: (current: TimelineMessage[]) => TimelineMessage[]) => void, api: ApiSurface): void {
  const unseen = inbox.filter((item) => !seen.current.has(item.id));
  if (unseen.length === 0) return;
  // The API returns newest first; consume the oldest pending message first so a
  // backlog is released one at a time instead of arriving as a burst.
  const item = unseen[unseen.length - 1];
  if (!item) return;
  seen.current.add(item.id);
  setMessages((current) => [...current, { id: item.id, role: 'proactive' as const, text: item.content }]);
  void window.maxDesktop?.showNotification({ title: 'Max', body: item.content });
  void api.dismissProactive?.(item.id);
}

export const PROACTIVE_DELAY_MIN_MS = 20 * 60 * 1000;
export const PROACTIVE_DELAY_MAX_MS = 50 * 60 * 1000;

export function randomProactiveDelay(random: () => number = Math.random): number {
  const sample = Math.max(0, Math.min(1, random()));
  return Math.min(PROACTIVE_DELAY_MAX_MS, Math.floor(PROACTIVE_DELAY_MIN_MS + sample * (PROACTIVE_DELAY_MAX_MS - PROACTIVE_DELAY_MIN_MS + 1)));
}

function createDefaultAuth(): AuthSurface {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return {
      getSession: async () => null,
      signIn: async () => { throw new Error('请先配置 Supabase 登录信息。'); },
      signUp: async () => { throw new Error('请先配置 Supabase 登录信息。'); },
      signOut: async () => undefined
    };
  }
  return createAuthClient({ url, anonKey });
}

function createDefaultApi(auth: AuthSurface): ApiClient {
  return new ApiClient({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3100',
    getAccessToken: async () => (await auth.getSession())?.access_token ?? null
  });
}
