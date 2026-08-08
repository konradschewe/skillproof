import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { LLMProvider } from "./types.js";

export class AnthropicProvider implements LLMProvider {
  readonly type = "anthropic" as const;

  constructor(readonly modelId: string) {}

  createModel(): BaseChatModel {
    return new ChatAnthropic({
      model: this.modelId,
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...(process.env.ANTHROPIC_BASE_URL && {
        anthropicApiUrl: process.env.ANTHROPIC_BASE_URL,
      }),
    });
  }
}
