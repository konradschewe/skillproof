import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";
import { fetchModels } from "tokenlens";

export interface AgentMetrics {
  llmCalls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export interface EvaluationMetrics {
  durationMs: number;
  evaluator: AgentMetrics;
  explorer: AgentMetrics;
  estimatedCostUsd: number;
}

function normalizeModelId(modelId: string): string {
  // Strip provider prefix: "anthropic--claude-x" → "claude-x"
  const stripped = modelId.replace(/^[^-]+-+-/, "");
  // Reorder version-first names: "claude-4.6-sonnet" → "claude-sonnet-4-6"
  const reordered = stripped.replace(/^claude-([\d.]+)-(\w+)$/, "claude-$2-$1");
  return reordered.replace(/\./g, "-");
}

export async function estimateCost(
  metrics: EvaluationMetrics,
  evaluatorModelId: string,
  explorerModelId: string,
  providerName = "anthropic"
): Promise<number> {
  try {
    const provider = await fetchModels(providerName);
    const resolveModel = (modelId: string) =>
      provider?.models?.[normalizeModelId(modelId)] ??
      provider?.models?.[modelId];

    const evalModel = resolveModel(evaluatorModelId);
    const exprModel = resolveModel(explorerModelId);

    if (!evalModel?.cost?.input || !evalModel.cost.output || !exprModel?.cost?.input || !exprModel.cost.output) {
      return fallbackCost(metrics);
    }

    const cost = (m: AgentMetrics, c: typeof evalModel.cost) => {
      const input = c?.input ?? 3;
      const output = c?.output ?? 15;
      const cacheRead = c?.cache_read ?? input * 0.1;
      const cacheWrite = c?.cache_write ?? input * 1.25;
      return (
        (m.inputTokens / 1_000_000) * input +
        (m.outputTokens / 1_000_000) * output +
        (m.cacheReadTokens / 1_000_000) * cacheRead +
        (m.cacheWriteTokens / 1_000_000) * cacheWrite
      );
    };

    return cost(metrics.evaluator, evalModel.cost) + cost(metrics.explorer, exprModel.cost);
  } catch {
    return fallbackCost(metrics);
  }
}

// Fallback: Haiku prices (explorer dominates token count)
function fallbackCost(metrics: EvaluationMetrics): number {
  const evalIn = metrics.evaluator.inputTokens / 1_000_000;
  const evalOut = metrics.evaluator.outputTokens / 1_000_000;
  const exprIn = (metrics.explorer.inputTokens + metrics.explorer.cacheWriteTokens) / 1_000_000;
  const exprOut = metrics.explorer.outputTokens / 1_000_000;
  const exprCacheRead = metrics.explorer.cacheReadTokens / 1_000_000;
  return evalIn * 3.0 + evalOut * 15.0 + exprIn * 1.0 + exprOut * 5.0 + exprCacheRead * 0.1;
}

export class MetricsHandler extends BaseCallbackHandler {
  name = "MetricsHandler";
  readonly data: AgentMetrics = {
    llmCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  };

  handleLLMEnd(output: LLMResult) {
    this.data.llmCalls++;
    // @langchain/anthropic puts usage in llmOutput.usage
    const usage = (output as any).llmOutput?.usage;
    if (usage) {
      this.data.inputTokens += usage.input_tokens ?? 0;
      this.data.outputTokens += usage.output_tokens ?? 0;
      this.data.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
      this.data.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
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
