import { describe, expect, it } from 'vitest';
import { AuthClient } from './auth';

describe('AuthClient', () => {
  it('returns no session before the user signs in', async () => {
    const auth = new AuthClient({
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
      signUp: async () => ({ data: { session: null, user: null }, error: null }),
      signOut: async () => ({ error: null })
    });

    await expect(auth.getSession()).resolves.toBeNull();
  });
});
