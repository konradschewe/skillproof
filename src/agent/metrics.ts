import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import { fetchModels } from "tokenlens";

export interface AgentMetrics {
  llmCalls: number;
  inputTokens: number;
  outputTokens: number;
}

export interface EvaluationMetrics {
  durationMs: number;
  evaluator: AgentMetrics;
  explorer: AgentMetrics;
  estimatedCostUsd: number;
}

export async function estimateCost(
  metrics: EvaluationMetrics,
  modelId: string,
  providerName = "anthropic"
): Promise<number> {
  try {
    const provider = await fetchModels(providerName);
    // modelId may be "anthropic--claude-sonnet-4-5" or "claude-sonnet-4-5"
    const normalized = modelId.replace(/^[^-]+-+-/, "");
    const model = provider?.models?.[normalized] ?? provider?.models?.[modelId];
    if (!model?.cost?.input || !model.cost.output) return fallbackCost(metrics);
    const totalInput = metrics.evaluator.inputTokens + metrics.explorer.inputTokens;
    const totalOutput = metrics.evaluator.outputTokens + metrics.explorer.outputTokens;
    return (totalInput / 1_000_000) * model.cost.input + (totalOutput / 1_000_000) * model.cost.output;
  } catch {
    return fallbackCost(metrics);
  }
}

// Fallback: Claude Sonnet 4.5 prices if tokenlens unavailable
function fallbackCost(metrics: EvaluationMetrics): number {
  const totalInput = metrics.evaluator.inputTokens + metrics.explorer.inputTokens;
  const totalOutput = metrics.evaluator.outputTokens + metrics.explorer.outputTokens;
  return (totalInput / 1_000_000) * 3.0 + (totalOutput / 1_000_000) * 15.0;
}

export class MetricsHandler extends BaseCallbackHandler {
  name = "MetricsHandler";
  readonly data: AgentMetrics = { llmCalls: 0, inputTokens: 0, outputTokens: 0 };

  handleLLMEnd(output: LLMResult) {
    this.data.llmCalls++;
    // @langchain/anthropic puts usage in llmOutput.usage
    const usage = (output as any).llmOutput?.usage;
    if (usage) {
      this.data.inputTokens += usage.input_tokens ?? 0;
      this.data.outputTokens += usage.output_tokens ?? 0;
      return;
    }
    // OpenAI-style fallback (llmOutput.tokenUsage)
    const tokenUsage = (output as any).llmOutput?.tokenUsage;
    if (tokenUsage) {
      this.data.inputTokens += tokenUsage.promptTokens ?? 0;
      this.data.outputTokens += tokenUsage.completionTokens ?? 0;
    }
  }
}
