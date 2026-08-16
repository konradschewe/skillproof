import { writeFile } from "fs/promises";
import { resolve } from "path";
import { renderMarkdown, renderGitHubSummary, renderHtml } from "../reporter/index.js";
import type { EvaluationReport } from "../evaluator/types.js";
import type { AdoptionStatus } from "../evaluator/types.js";
import type { OutputFormat } from "../reporter/index.js";

export function renderOutput(report: EvaluationReport, format: OutputFormat): string {
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format === "github-summary") return renderGitHubSummary(report);
  if (format === "html") return renderHtml(report);
  return renderMarkdown(report);
}

export async function writeOutput(output: string, outputFile: string | undefined): Promise<void> {
  if (outputFile) {
    await writeFile(resolve(outputFile), output, "utf-8");
  } else {
    process.stdout.write(output);
  }
}

export async function writeGitHubStepSummary(report: EvaluationReport): Promise<void> {
  if (process.env.GITHUB_STEP_SUMMARY) {
    await writeFile(process.env.GITHUB_STEP_SUMMARY, renderGitHubSummary(report), "utf-8");
  }
}

export function checkFailStatuses(report: EvaluationReport, failStatuses: AdoptionStatus[]): void {
  if (failStatuses.length === 0) return;
  const failing = report.results.filter((r) => failStatuses.includes(r.status));
  if (failing.length > 0) {
    console.error(`\nFailed: ${failing.length} skill(s) with status [${failStatuses.join(", ")}]:`);
    for (const r of failing) console.error(`  - ${r.skillName} (${r.status})`);
    process.exit(1);
  }
}
