import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export type ProviderType = "anthropic" | "aicore";

export interface LLMProvider {
  readonly type: ProviderType;
  readonly modelId: string;
  createModel(): BaseChatModel;
}
