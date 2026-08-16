import { fetchModels } from "tokenlens";
import type { AgentMetrics, EvaluationMetrics } from "./metrics.js";

function normalizeModelId(modelId: string): string {
  const stripped = modelId.replace(/^[^-]+-+-/, "");
  const reordered = stripped.replace(/^claude-([\d.]+)-(\w+)$/, "claude-$2-$1");
  return reordered.replace(/\./g, "-");
}

function tokenCost(m: AgentMetrics, cost: { input?: number; output?: number; cache_read?: number; cache_write?: number }): number {
  const input = cost.input ?? 3;
  const output = cost.output ?? 15;
  const cacheRead = cost.cache_read ?? input * 0.1;
  const cacheWrite = cost.cache_write ?? input * 1.25;
  return (
    (m.inputTokens / 1_000_000) * input +
    (m.outputTokens / 1_000_000) * output +
    (m.cacheReadTokens / 1_000_000) * cacheRead +
    (m.cacheWriteTokens / 1_000_000) * cacheWrite
  );
}

function fallbackCost(metrics: EvaluationMetrics): number {
  const evalIn = metrics.evaluator.inputTokens / 1_000_000;
  const evalOut = metrics.evaluator.outputTokens / 1_000_000;
  const exprIn = (metrics.explorer.inputTokens + metrics.explorer.cacheWriteTokens) / 1_000_000;
  const exprOut = metrics.explorer.outputTokens / 1_000_000;
  const exprCacheRead = metrics.explorer.cacheReadTokens / 1_000_000;
  return evalIn * 3.0 + evalOut * 15.0 + exprIn * 1.0 + exprOut * 5.0 + exprCacheRead * 0.1;
}

export async function estimateCost(
  metrics: EvaluationMetrics,
  evaluatorModelId: string,
  explorerModelId: string,
  providerName = "anthropic"
): Promise<number> {
  try {
    const provider = await fetchModels(providerName);
    const resolveModel = (id: string) =>
      provider?.models?.[normalizeModelId(id)] ?? provider?.models?.[id];

    const evalModel = resolveModel(evaluatorModelId);
    const exprModel = resolveModel(explorerModelId);

    if (!evalModel?.cost?.input || !evalModel.cost.output || !exprModel?.cost?.input || !exprModel.cost.output) {
      return fallbackCost(metrics);
    }

    return tokenCost(metrics.evaluator, evalModel.cost) + tokenCost(metrics.explorer, exprModel.cost);
  } catch {
    return fallbackCost(metrics);
  }
}
