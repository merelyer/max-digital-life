import type { ServiceClient } from '../supabase.js';

export type ConversationRepository = {
  ensure(userId: string, conversationId: string): Promise<void>;
  appendMessage(userId: string, conversationId: string, role: 'user' | 'assistant', content: string): Promise<string>;
};

export function createConversationRepository(client: ServiceClient): ConversationRepository {
  return {
    async ensure(userId, conversationId) {
      const { error } = await client.from('conversations').upsert({ id: conversationId, user_id: userId }, { onConflict: 'id' });
      if (error) throw error;
    },
    async appendMessage(userId, conversationId, role, content) {
      const { data, error } = await client
        .from('messages')
        .insert({ user_id: userId, conversation_id: conversationId, role, content })
        .select('id')
        .single();
      if (error) throw error;
      return String(data.id);
    }
  };
}
