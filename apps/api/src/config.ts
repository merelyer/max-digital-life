import { z } from 'zod';

export const tokendanceBaseURL = 'https://tokendance.space/gateway/v1';

export const configSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TOKENDANCE_API_KEY: z.string().min(1),
  TOKENDANCE_MODEL_ID: z.string().min(1),
  API_CRON_SECRET: z.string().min(24)
});

export type ServerConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return configSchema.parse(env);
}
