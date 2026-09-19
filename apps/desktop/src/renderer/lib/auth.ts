import { createClient } from '@supabase/supabase-js';

export type AuthSession = {
  access_token: string;
  [key: string]: unknown;
};

type AuthErrorLike = { message: string } | null;

export type AuthGateway = {
  getSession(): Promise<{ data: { session: AuthSession | null }; error: AuthErrorLike }>;
  signInWithPassword(input: { email: string; password: string }): Promise<{ data: { session: AuthSession | null; user: unknown | null }; error: AuthErrorLike }>;
  signUp(input: { email: string; password: string }): Promise<{ data: { session: AuthSession | null; user: unknown | null }; error: AuthErrorLike }>;
  signOut(): Promise<{ error: AuthErrorLike }>;
};

export class AuthClient {
  public constructor(private readonly gateway: AuthGateway) {}

  public async getSession(): Promise<AuthSession | null> {
    const result = await this.gateway.getSession();
    if (result.error) throw mapAuthError(result.error);
    return result.data.session;
  }

  public async signIn(email: string, password: string): Promise<AuthSession | null> {
    const result = await this.gateway.signInWithPassword({ email, password });
    if (result.error) throw mapAuthError(result.error);
    return result.data.session;
  }

  public async signUp(email: string, password: string): Promise<AuthSession | null> {
    const result = await this.gateway.signUp({ email, password });
    if (result.error) throw mapAuthError(result.error);
    return result.data.session;
  }

  public async signOut(): Promise<void> {
    const result = await this.gateway.signOut();
    if (result.error) throw mapAuthError(result.error);
  }
}

export function createAuthClient(config: { url: string; anonKey: string }): AuthClient {
  return new AuthClient(createClient(config.url, config.anonKey).auth as unknown as AuthGateway);
}

function mapAuthError(error: { message: string }): Error {
  const messages: Record<string, string> = {
    'Invalid login credentials': '邮箱或密码不正确。',
    'User already registered': '这个邮箱已经注册，请直接登录。',
    'Password should be at least 6 characters.': '密码至少需要 6 位。'
  };
  return new Error(messages[error.message] ?? error.message);
}
