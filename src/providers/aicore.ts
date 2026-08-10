import { AzureOpenAiChatClient } from "@sap-ai-sdk/langchain";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { LLMProvider } from "./types.js";

const EVALUATOR_MODEL_ID = "anthropic--claude-4.6-sonnet";
const EXPLORER_MODEL_ID = "anthropic--claude-4.5-haiku";

export class AICoreProvider implements LLMProvider {
  readonly type = "aicore" as const;
  readonly modelId = EVALUATOR_MODEL_ID;
  readonly explorerModelId = EXPLORER_MODEL_ID;

  createModel(): BaseChatModel {
    return new AzureOpenAiChatClient({ modelName: EVALUATOR_MODEL_ID }) as unknown as BaseChatModel;
  }

  createExplorerModel(): BaseChatModel {
    return new AzureOpenAiChatClient({ modelName: EXPLORER_MODEL_ID }) as unknown as BaseChatModel;
  }
}
