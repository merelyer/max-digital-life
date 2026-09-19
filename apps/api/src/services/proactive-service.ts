import { shouldDeliverProactiveMessage } from '@max/domain';
import type { ProactiveMessage, ProactiveMessageRepository, ProactiveReason } from '../repositories/proactive-repository.js';
import type { ChatModel } from './chat-service.js';

export type ProactiveRunInput = {
  userId: string;
  timezone: string;
  deliveredToday: number;
  enabled: boolean;
  reason?: ProactiveReason;
  sourceTimestamp?: string;
};

type ProactiveServiceDependencies = {
  repository: ProactiveMessageRepository;
  model: ChatModel;
  now?: () => Date;
};

export class ProactiveService {
  private readonly now: () => Date;

  public constructor(private readonly dependencies: ProactiveServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
  }

  public async runForUser(input: ProactiveRunInput): Promise<ProactiveMessage | null> {
    const reason = input.reason;
    if (!reason || !shouldDeliverProactiveMessage({ enabled: input.enabled, deliveredToday: input.deliveredToday, hasReason: true })) return null;

    const deliveredAt = this.now().toISOString();
    const sourceTimestamp = input.sourceTimestamp ?? deliveredAt;
    const content = (await this.dependencies.model.complete({
      messages: [
        { role: 'system', content: '你是 Max，一只住在电脑里的白色小狗。写一条简短、具体、不过度打扰的主动关心消息。不要假装拥有现实身体或现实行动能力。' },
        { role: 'user', content: reason === 'unfinished_topic' ? '用户有一个之前没有收尾的话题，请温和提醒并给出一个小建议。' : '现在是用户所在时区的晚上，请发一条简短的晚间关心。' }
      ]
    })).trim();
    if (!content) return null;

    return this.dependencies.repository.create(input.userId, { reason, content, sourceTimestamp, deliveredAt });
  }
}
