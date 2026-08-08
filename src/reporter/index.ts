import type { EvaluationReport } from "../evaluator/types.js";

function aggregateMetricsSummary(report: EvaluationReport): string {
  const withMetrics = report.results.filter((r) => r.metrics);
  if (withMetrics.length === 0) return "";

  const totalTokens = withMetrics.reduce((acc, r) => {
    const m = r.metrics!;
    return acc + m.evaluator.inputTokens + m.evaluator.outputTokens + m.explorer.inputTokens + m.explorer.outputTokens;
  }, 0);
  const totalCost = withMetrics.reduce((acc, r) => acc + r.metrics!.estimatedCostUsd, 0);
  const totalDurationMs = withMetrics.reduce((acc, r) => acc + r.metrics!.durationMs, 0);

  return `\n## Metrics (${withMetrics.length} evaluated, ${report.results.length - withMetrics.length} cached)\n\n` +
    `| | Value |\n|---|---|\n` +
    `| Total tokens | ${totalTokens.toLocaleString()} |\n` +
    `| Estimated cost | $${totalCost.toFixed(4)} |\n` +
    `| Total duration | ${(totalDurationMs / 1000).toFixed(1)}s |\n` +
    `| Avg tokens / skill | ${Math.round(totalTokens / withMetrics.length).toLocaleString()} |\n` +
    `| Avg cost / skill | $${(totalCost / withMetrics.length).toFixed(4)} |\n`;
}

export function renderMarkdown(report: EvaluationReport): string {
  const statusIcon = (s: string) =>
    s === "adopted" ? "✅" : s === "partial" ? "⚠️" : "❌";

  const summary = report.results
    .map((r) => `| ${r.skillName} | ${statusIcon(r.status)} ${r.status} |`)
    .join("\n");

  const details = report.results
    .map(
      (r) => `### ${statusIcon(r.status)} ${r.skillName}

**Status:** ${r.status}

**Reasoning:** ${r.reasoning}

${r.evidence.length > 0 ? `**Evidence:**\n${r.evidence.map((e) => `- ${e}`).join("\n")}` : ""}`
    )
    .join("\n\n---\n\n");

  return `# Skillproof Report

**Repository:** ${report.repoPath}
**Skills Directory:** ${report.skillsDir}
**Evaluated At:** ${report.evaluatedAt}

## Summary

| Skill | Status |
|-------|--------|
${summary}
${aggregateMetricsSummary(report)}
## Details

${details}
`;
}

export function renderGitHubSummary(report: EvaluationReport): string {
  return renderMarkdown(report);
}
