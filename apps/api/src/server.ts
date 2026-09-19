import { pathToFileURL } from 'node:url';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { createSupabaseAuthVerifier, type AuthVerifier } from './auth';
import { loadConfig, type ServerConfig } from './config';
import { registerChatRoute } from './routes/chat';
import { registerProactiveRoutes, type ProactiveRouteDependencies } from './routes/proactive';
import { registerMemoryRoutes } from './routes/memories';
import { createConversationRepository } from './repositories/conversation-repository';
import { MemoryRepository } from './repositories/memory-repository';
import { createSupabaseMemoryStore, createServiceClient, createSupabaseProactiveMessageStore } from './supabase';
import { createPreferenceRepository } from './repositories/preference-repository';
import { createProactiveMessageRepository } from './repositories/proactive-repository';
import { ChatService } from './services/chat-service';
import { ProactiveService } from './services/proactive-service';
import { TokendanceClient } from './services/tokendance-client';

export type ChatServerDependencies = {
  auth: AuthVerifier;
  chatService: ChatService | { reply(input: { userId: string; conversationId: string; text: string }): Promise<{ messageId: string; text: string; savedMemory: boolean }> };
};

export type ApiServerDependencies = ChatServerDependencies & Omit<ProactiveRouteDependencies, 'auth'> & { memoryRepository: Pick<MemoryRepository, 'listRelevant' | 'delete'> };

export function createChatServer(dependencies: ChatServerDependencies): FastifyInstance {
  const app = Fastify({ logger: false });
  void app.register(cors, { origin: ['null', 'http://localhost:5173', 'http://127.0.0.1:5173'] });
  registerChatRoute(app, dependencies);
  return app;
}

export function createApiServer(dependencies: ApiServerDependencies): FastifyInstance {
  const app = Fastify({ logger: false });
  void app.register(cors, { origin: ['null', 'http://localhost:5173', 'http://127.0.0.1:5173'] });
  registerChatRoute(app, dependencies);
  registerMemoryRoutes(app, dependencies);
  registerProactiveRoutes(app, dependencies);
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

export function createConfiguredApiServer(config: ServerConfig = loadConfig()): FastifyInstance {
  const client = createServiceClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  const memoryRepository = new MemoryRepository(createSupabaseMemoryStore(client));
  const conversationRepository = createConversationRepository(client);
  const chatService = new ChatService({
    model: new TokendanceClient(config),
    conversationRepository,
    memoryRepository
  });
  const proactiveRepository = createProactiveMessageRepository(createSupabaseProactiveMessageStore(client));
  const proactiveService = new ProactiveService({ repository: proactiveRepository, model: new TokendanceClient(config) });
  return createApiServer({
    auth: createSupabaseAuthVerifier(client),
    chatService,
    memoryRepository,
    cronSecret: config.API_CRON_SECRET,
    preferenceRepository: createPreferenceRepository(client),
    proactiveRepository,
    proactiveService
  });
}

export async function startServer(): Promise<void> {
  const app = createConfiguredApiServer();
  await app.listen({ host: '127.0.0.1', port: 3100 });
}

const entryPoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entryPoint) {
  startServer().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
