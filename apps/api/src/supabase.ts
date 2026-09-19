import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MemoryDraft } from '@max/domain';
import type { MemoryRecord, MemoryStore } from './repositories/memory-repository';

export type ServiceClient = SupabaseClient;

export function createServiceClient(url: string, serviceRoleKey: string): ServiceClient {
  return createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function createSupabaseMemoryStore(client: ServiceClient): MemoryStore {
  return {
    async list(userId) {
      const { data, error } = await client
        .from('memories')
        .select('id,user_id,content,kind,importance,created_at')
        .eq('user_id', userId)
        .order('importance', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []).map(toMemoryRecord);
    },
    async delete(userId, memoryId) {
      const { data, error } = await client
        .from('memories')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', userId)
        .select('id');
      if (error) throw error;
      return (data ?? []).length > 0;
    },
    async create(userId, draft: MemoryDraft) {
      const { data, error } = await client
        .from('memories')
        .insert({ user_id: userId, content: draft.content.trim(), kind: draft.kind, importance: draft.importance })
        .select('id,user_id,content,kind,importance,created_at')
        .single();
      if (error) throw error;
      return toMemoryRecord(data);
    }
  };
}

function toMemoryRecord(row: Record<string, unknown>): MemoryRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    content: String(row.content),
    kind: row.kind as MemoryRecord['kind'],
    importance: Number(row.importance) as MemoryRecord['importance'],
    createdAt: String(row.created_at)
  };
}
