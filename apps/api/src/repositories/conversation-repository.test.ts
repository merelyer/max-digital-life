import { describe, expect, it } from 'vitest';
import { createConversationRepository } from './conversation-repository';
import { ConversationAccessError } from '../services/errors';

describe('ConversationRepository', () => {
  it('rejects an existing conversation owned by another user', async () => {
    const client = {
      from: (table: string) => {
        if (table !== 'conversations') throw new Error(`unexpected table: ${table}`);
        const builder = {
          select: () => builder,
          eq: () => builder,
          maybeSingle: async () => ({ data: { user_id: 'u-owner' }, error: null }),
          insert: async () => ({ error: null })
        };
        return builder;
      }
    } as never;
    const repository = createConversationRepository(client);

    await expect(repository.ensure('u-other', 'c-1')).rejects.toBeInstanceOf(ConversationAccessError);
  });

  it('creates a new conversation without overwriting an existing row', async () => {
    let exists = false;
    let insertedUser = '';
    const client = {
      from: (table: string) => {
        if (table !== 'conversations') throw new Error(`unexpected table: ${table}`);
        const builder = {
          select: () => builder,
          eq: () => builder,
          maybeSingle: async () => ({ data: exists ? { user_id: insertedUser } : null, error: null }),
          insert: async (row: { user_id: string }) => { exists = true; insertedUser = row.user_id; return { error: null }; }
        };
        return builder;
      }
    } as never;
    const repository = createConversationRepository(client);

    await expect(repository.ensure('u-new', 'c-2')).resolves.toBeUndefined();
    expect(insertedUser).toBe('u-new');
  });
});
