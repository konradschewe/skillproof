import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

export const PROVIDER_TYPES = ["anthropic", "aicore"] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export interface LLMProvider {
  readonly type: ProviderType;
  readonly modelId: string;
  readonly explorerModelId: string;
  createModel(): BaseChatModel;
  createExplorerModel(): BaseChatModel;
}
