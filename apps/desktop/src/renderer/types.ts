import type { AuthClient, AuthSession } from './lib/auth';
import type { ApiClient, ApiMemory, ApiProactiveMessage, ChatResponse } from './lib/api';

export type AuthSurface = Pick<AuthClient, 'getSession' | 'signIn' | 'signUp' | 'signOut'>;

export type ApiSurface = Pick<ApiClient, 'sendChat' | 'listMemories' | 'deleteMemory' | 'getInbox' | 'checkProactive' | 'setProactiveEnabled' | 'getProactiveEnabled'> & {
  dismissProactive?: (id: string) => Promise<void>;
};

export type TimelineMessage = {
  id: string;
  role: 'user' | 'assistant' | 'proactive';
  text: string;
};

export type { ApiMemory, ApiProactiveMessage, AuthSession, ChatResponse };
