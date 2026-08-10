import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { LLMProvider } from "./types.js";

const EVALUATOR_MODEL_ID = "claude-sonnet-4-6";
const EXPLORER_MODEL_ID = "claude-haiku-4-5-20251001";

const SHARED_CONFIG = {
  ...(process.env.ANTHROPIC_BASE_URL && {
    anthropicApiUrl: process.env.ANTHROPIC_BASE_URL,
  }),
};

export class AnthropicProvider implements LLMProvider {
  readonly type = "anthropic" as const;
  readonly modelId = EVALUATOR_MODEL_ID;
  readonly explorerModelId = EXPLORER_MODEL_ID;

  createModel(): BaseChatModel {
    return new ChatAnthropic({
      model: EVALUATOR_MODEL_ID,
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...SHARED_CONFIG,
    });
  }

  createExplorerModel(): BaseChatModel {
    return new ChatAnthropic({
      model: EXPLORER_MODEL_ID,
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...SHARED_CONFIG,
    });
  }
}
