import type { LLMProvider, ProviderType } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";
import { AICoreProvider } from "./aicore.js";

export function createProvider(type: ProviderType): LLMProvider {
  switch (type) {
    case "anthropic":
      return new AnthropicProvider();
    case "aicore":
      return new AICoreProvider();
  }
}

export { type LLMProvider, type ProviderType };
