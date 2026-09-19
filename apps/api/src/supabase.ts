import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MemoryDraft } from '@max/domain';
import type { MemoryRecord, MemoryStore } from './repositories/memory-repository.js';
import type { ProactiveMessage, ProactiveMessageDraft, ProactiveMessageStore } from './repositories/proactive-repository.js';

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

export function createSupabaseProactiveMessageStore(client: ServiceClient): ProactiveMessageStore {
  return {
    async countDeliveredSince(userId, since, until) {
      const { data, error } = await client
        .from('proactive_messages')
        .select('id')
        .eq('user_id', userId)
        .gte('delivered_at', since)
        .lt('delivered_at', until);
      if (error) throw error;
      return data?.length ?? 0;
    },
    async create(userId, draft: ProactiveMessageDraft) {
      const { data, error } = await client
        .from('proactive_messages')
        .insert({
          user_id: userId,
          reason: draft.reason,
          content: draft.content.trim(),
          source_timestamp: draft.sourceTimestamp,
          delivered_at: draft.deliveredAt
        })
        .select('id,user_id,reason,content,source_timestamp,delivered_at,dismissed_at')
        .single();
      if (error) throw error;
      return toProactiveMessage(data);
    },
    async listUndismissed(userId) {
      const { data, error } = await client
        .from('proactive_messages')
        .select('id,user_id,reason,content,source_timestamp,delivered_at,dismissed_at')
        .eq('user_id', userId)
        .is('dismissed_at', null)
        .order('delivered_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toProactiveMessage);
    },
    async dismiss(userId, messageId) {
      const { data, error } = await client
        .from('proactive_messages')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('user_id', userId)
        .is('dismissed_at', null)
        .select('id');
      if (error) throw error;
      return (data ?? []).length > 0;
    }
  };
}

function toProactiveMessage(row: Record<string, unknown>): ProactiveMessage {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    reason: row.reason as ProactiveMessage['reason'],
    content: String(row.content),
    sourceTimestamp: String(row.source_timestamp),
    deliveredAt: String(row.delivered_at),
    dismissedAt: row.dismissed_at === null || row.dismissed_at === undefined ? null : String(row.dismissed_at)
  };
}
