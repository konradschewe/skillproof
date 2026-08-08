import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { LLMProvider } from "./types.js";

const EXPLORER_MODEL_ID = "claude-haiku-4-5-20251001";

export class AnthropicProvider implements LLMProvider {
  readonly type = "anthropic" as const;
  readonly explorerModelId = EXPLORER_MODEL_ID;

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

  createExplorerModel(): BaseChatModel {
    return new ChatAnthropic({
      model: EXPLORER_MODEL_ID,
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...(process.env.ANTHROPIC_BASE_URL && {
        anthropicApiUrl: process.env.ANTHROPIC_BASE_URL,
      }),
    });
  }
}
