import { pathToFileURL } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import { createSupabaseAuthVerifier, type AuthVerifier } from './auth';
import { loadConfig, type ServerConfig } from './config';
import { registerChatRoute } from './routes/chat';
import { createConversationRepository } from './repositories/conversation-repository';
import { MemoryRepository } from './repositories/memory-repository';
import { createSupabaseMemoryStore, createServiceClient } from './supabase';
import { ChatService } from './services/chat-service';
import { TokendanceClient } from './services/tokendance-client';

export type ChatServerDependencies = {
  auth: AuthVerifier;
  chatService: ChatService | { reply(input: { userId: string; conversationId: string; text: string }): Promise<{ messageId: string; text: string; savedMemory: boolean }> };
};

export function createChatServer(dependencies: ChatServerDependencies): FastifyInstance {
  const app = Fastify({ logger: false });
  registerChatRoute(app, dependencies);
  return app;
}

export function createConfiguredChatServer(config: ServerConfig = loadConfig()): FastifyInstance {
  const client = createServiceClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  const memoryRepository = new MemoryRepository(createSupabaseMemoryStore(client));
  const conversationRepository = createConversationRepository(client);
  const chatService = new ChatService({
    model: new TokendanceClient(config),
    conversationRepository,
    memoryRepository
  });
  return createChatServer({ auth: createSupabaseAuthVerifier(client), chatService });
}

export async function startServer(): Promise<void> {
  const app = createConfiguredChatServer();
  await app.listen({ host: '127.0.0.1', port: 3100 });
}

const entryPoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entryPoint) {
  startServer().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
