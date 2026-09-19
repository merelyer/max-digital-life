import type { ServiceClient } from '../supabase';

export type NotificationPreference = { proactiveEnabled: boolean };

export type PreferenceRepository = {
  get(userId: string): Promise<NotificationPreference>;
  setProactiveEnabled(userId: string, enabled: boolean): Promise<void>;
};

export function createPreferenceRepository(client: ServiceClient): PreferenceRepository {
  return {
    async get(userId) {
      const { data, error } = await client
        .from('notification_preferences')
        .select('proactive_enabled')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return { proactiveEnabled: data?.proactive_enabled ?? true };
    },
    async setProactiveEnabled(userId, enabled) {
      const { error } = await client
        .from('notification_preferences')
        .upsert({ user_id: userId, proactive_enabled: enabled }, { onConflict: 'user_id' });
      if (error) throw error;
    }
  };
}
