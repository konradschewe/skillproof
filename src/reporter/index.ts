import type { EvaluationReport } from "../evaluator/types.js";

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

## Details

${details}
`;
}

export function renderGitHubSummary(report: EvaluationReport): string {
  return renderMarkdown(report);
}
