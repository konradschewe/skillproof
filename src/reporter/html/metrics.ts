import type { EvaluationReport } from "../../evaluator/types.js";

export function renderMetrics(report: EvaluationReport): string {
  const ev = report.results.filter((r) => r.metrics);
  if (ev.length === 0) return "";

  const cached = report.results.length - ev.length;
  const tokens = ev.reduce((a, r) => a + r.metrics!.evaluator.inputTokens + r.metrics!.evaluator.outputTokens + r.metrics!.explorer.inputTokens + r.metrics!.explorer.outputTokens, 0);
  const cost = ev.reduce((a, r) => a + r.metrics!.estimatedCostUsd, 0);
  const ms = ev.reduce((a, r) => a + r.metrics!.durationMs, 0);

  return `<div class="metrics">
  <div class="sec">Metrics</div>
  <p class="cached-note">${ev.length} evaluated · ${cached} cached</p>
  <div class="metrics-grid">
    <div class="metric"><span class="metric-val">${tokens.toLocaleString()}</span><span class="metric-lbl">Tokens</span></div>
    <div class="metric"><span class="metric-val">$${cost.toFixed(4)}</span><span class="metric-lbl">Cost</span></div>
    <div class="metric"><span class="metric-val">${(ms / 1000).toFixed(1)}s</span><span class="metric-lbl">Duration</span></div>
    <div class="metric"><span class="metric-val">${Math.round(tokens / ev.length).toLocaleString()}</span><span class="metric-lbl">Avg tokens</span></div>
    <div class="metric"><span class="metric-val">$${(cost / ev.length).toFixed(4)}</span><span class="metric-lbl">Avg cost</span></div>
  </div>
</div>`;
}
