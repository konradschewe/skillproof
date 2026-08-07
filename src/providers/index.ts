import type { LLMProvider, ProviderType } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";
import { AICoreProvider } from "./aicore.js";

export function createProvider(type: ProviderType, modelId: string): LLMProvider {
  switch (type) {
    case "anthropic":
      return new AnthropicProvider(modelId);
    case "aicore":
      return new AICoreProvider(modelId);
  }
}

export { type LLMProvider, type ProviderType };
