import type { ServiceClient } from '../supabase.js';
import { ConversationAccessError } from '../services/errors.js';

export type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type ConversationRepository = {
  ensure(userId: string, conversationId: string): Promise<void>;
  listMessages(userId: string, conversationId: string, limit: number): Promise<ConversationMessage[]>;
  appendMessage(userId: string, conversationId: string, role: 'user' | 'assistant', content: string): Promise<string>;
};

export function createConversationRepository(client: ServiceClient): ConversationRepository {
  return {
    async ensure(userId, conversationId) {
      const existing = await client.from('conversations').select('user_id').eq('id', conversationId).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) {
        if (String(existing.data.user_id) !== userId) throw new ConversationAccessError();
        return;
      }

      const inserted = await client.from('conversations').insert({ id: conversationId, user_id: userId });
      if (!inserted.error) return;

      // Another request may have created the conversation between the read and
      // insert. Re-read it and only accept it when the owner still matches.
      const raced = await client.from('conversations').select('user_id').eq('id', conversationId).maybeSingle();
      if (raced.error) throw raced.error;
      if (!raced.data) throw inserted.error;
      if (String(raced.data.user_id) !== userId) throw new ConversationAccessError();
    },
    async listMessages(userId, conversationId, limit) {
      const { data, error } = await client
        .from('messages')
        .select('id,role,content,created_at')
        .eq('user_id', userId)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).reverse().map((row) => ({
        id: String(row.id),
        role: row.role as ConversationMessage['role'],
        content: String(row.content),
        createdAt: String(row.created_at)
      }));
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
