import OpenAI from 'openai';
import { tokendanceBaseURL, type ServerConfig } from '../config.js';
import { ModelUnavailableError } from './errors.js';
import type { ChatCompletionInput, ChatModel } from './chat-service.js';

export class TokendanceClient implements ChatModel {
  private readonly client: OpenAI;

  public constructor(config: Pick<ServerConfig, 'TOKENDANCE_API_KEY' | 'TOKENDANCE_MODEL_ID'>) {
    this.client = new OpenAI({
      apiKey: config.TOKENDANCE_API_KEY,
      baseURL: tokendanceBaseURL,
      timeout: 20_000,
      maxRetries: 0
    });
    this.modelId = config.TOKENDANCE_MODEL_ID;
  }

  private readonly modelId: string;

  public async complete(input: ChatCompletionInput): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelId,
        messages: input.messages,
        ...(input.responseFormat === 'json_object' ? { response_format: { type: 'json_object' as const } } : {})
      });
      const content = completion.choices[0]?.message?.content;
      if (typeof content !== 'string' || content.trim().length === 0) throw new ModelUnavailableError();
      return content.trim();
    } catch (error) {
      if (error instanceof ModelUnavailableError) throw error;
      throw new ModelUnavailableError(error);
    }
  }
}
