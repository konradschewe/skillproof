import type { EvaluationReport } from "../evaluator/types.js";

const statusIcon = (s: string) => s === "adopted" ? "✅" : s === "divergent" ? "🔀" : s === "partial" ? "⚠️" : s === "not-applicable" ? "➖" : "❌";

function metricsSection(report: EvaluationReport): string {
  const evaluated = report.results.filter((r) => r.metrics);
  if (evaluated.length === 0) return "";

  const tokens = evaluated.reduce((acc, r) => {
    const m = r.metrics!;
    return acc + m.evaluator.inputTokens + m.evaluator.outputTokens + m.explorer.inputTokens + m.explorer.outputTokens;
  }, 0);
  const cost = evaluated.reduce((acc, r) => acc + r.metrics!.estimatedCostUsd, 0);
  const ms = evaluated.reduce((acc, r) => acc + r.metrics!.durationMs, 0);
  const cached = report.results.length - evaluated.length;

  return (
    `\n## Metrics (${evaluated.length} evaluated, ${cached} cached)\n\n| | Value |\n|---|---|\n` +
    `| Total tokens | ${tokens.toLocaleString()} |\n` +
    `| Estimated cost | $${cost.toFixed(4)} |\n` +
    `| Total duration | ${(ms / 1000).toFixed(1)}s |\n` +
    `| Avg tokens / skill | ${Math.round(tokens / evaluated.length).toLocaleString()} |\n` +
    `| Avg cost / skill | $${(cost / evaluated.length).toFixed(4)} |\n`
  );
}

export function renderMarkdown(report: EvaluationReport): string {
  const summary = report.results
    .map((r) => `| ${r.skillName} | ${statusIcon(r.status)} ${r.status} |`)
    .join("\n");

  const details = report.results
    .map(
      (r) =>
        `### ${statusIcon(r.status)} ${r.skillName}\n\n**Status:** ${r.status}\n\n**Reasoning:** ${r.reasoning}\n\n` +
        (r.evidence.length > 0 ? `**Evidence:**\n${r.evidence.map((e) => `- ${e}`).join("\n")}` : "")
    )
    .join("\n\n---\n\n");

  return `# Skillproof Report\n\n**Repository:** ${report.repoPath}\n**Skills Directory:** ${report.skillsDir}\n**Evaluated At:** ${report.evaluatedAt}\n\n## Summary\n\n| Skill | Status |\n|-------|--------|\n${summary}\n${metricsSection(report)}\n## Details\n\n${details}\n`;
}

export function renderGitHubSummary(report: EvaluationReport): string {
  return renderMarkdown(report);
}
