// Development-only visual fixture. No remote account or model calls.
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { ApiSurface, AuthSurface } from './types';
const auth: AuthSurface = {
  getSession: async () => ({ access_token: 'visual-fixture' }),
  signIn: async () => ({ access_token: 'visual-fixture' }),
  signUp: async () => ({ access_token: 'visual-fixture' }),
  signOut: async () => undefined
};
const api: ApiSurface = {
  listMemories: async () => [],
  deleteMemory: async () => undefined,
  getInbox: async () => [],
  checkProactive: async () => ({ delivered: false, message: null }),
  setProactiveEnabled: async (enabled) => ({ enabled }),
  getProactiveEnabled: async () => ({ enabled: false }),
  sendChat: async () => new Promise((resolve) => {
    window.setTimeout(() => resolve({ messageId: String(Date.now()), text: '这是本地视觉验收的示例回复，用来检查消息换行、输入状态与 Max 的回应动作。', savedMemory: false }), 1600);
  })
};
createRoot(document.getElementById('root')!).render(<><p style={{ margin: 0, textAlign: 'center', fontSize: 12 }}>本地视觉验收 · 示例数据 · 不连接账号</p><App auth={auth} api={api} /></>);
