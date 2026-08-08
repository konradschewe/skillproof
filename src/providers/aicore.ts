import { AzureOpenAiChatClient } from "@sap-ai-sdk/langchain";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { LLMProvider } from "./types.js";

export class AICoreProvider implements LLMProvider {
  readonly type = "aicore" as const;

  constructor(readonly modelId: string) {}

  createModel(): BaseChatModel {
    return new AzureOpenAiChatClient({ modelName: this.modelId }) as unknown as BaseChatModel;
  }
}
