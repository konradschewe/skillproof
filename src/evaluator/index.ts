import { discoverSkills } from "../skills/discover.js";
import { EvaluationAgent } from "../agent/index.js";
import { FileCache } from "../cache/index.js";
import { renderMarkdown, renderGitHubSummary, renderHtml } from "../reporter/index.js";
import { createProvider } from "../providers/index.js";
import { printSkillBanner } from "../agent/verbose.js";
import type { ProviderType } from "../providers/types.js";
import type { EvaluationReport, SkillEvaluationResult } from "./types.js";
import { execSync } from "child_process";
import { writeFile } from "fs/promises";

export interface EvaluatorOptions {
  skillsDir: string;
  repoPath: string;
  provider: ProviderType;
  cacheDir: string;
  filter?: string;
  systemPrompt?: string;
  verbose?: boolean;
  outputFormat: "markdown" | "json" | "github-summary" | "html";
  outputFile?: string;
}

export async function runEvaluator(options: EvaluatorOptions): Promise<EvaluationReport> {
  const { skillsDir, repoPath, provider, cacheDir, filter, systemPrompt, verbose, outputFormat, outputFile } = options;

  const cache = new FileCache(cacheDir);
  await cache.load();

  const skillsRepoSha = getSkillsRepoSha(skillsDir);

  const skills = await discoverSkills(skillsDir);
  const filteredSkills = filter
    ? skills.filter((s) => s.name.includes(filter))
    : skills;

  if (filteredSkills.length === 0) {
    throw new Error(filter ? `No skills matching "${filter}" found in: ${skillsDir}` : `No SKILL.md files found in: ${skillsDir}`);
  }

  console.error(`Found ${filteredSkills.length} skill(s).`);

  const llmProvider = createProvider(provider);
  const agent = new EvaluationAgent(llmProvider, verbose, systemPrompt);

  const results: SkillEvaluationResult[] = [];

  for (const skill of filteredSkills) {
    const cached = cache.get(skill.name, skillsRepoSha);
    if (cached) {
      console.error(`  [cache] ${skill.name}`);
      results.push(cached.result as SkillEvaluationResult);
      continue;
    }

    if (verbose) {
      printSkillBanner(skill.name, results.length + 1, filteredSkills.length);
    } else {
      console.error(`  [eval]  ${skill.name}`);
    }
    const result = await agent.evaluate(skill, repoPath);
    if (result.metrics) {
      const m = result.metrics;
      const totalTokens = m.evaluator.inputTokens + m.evaluator.outputTokens + m.explorer.inputTokens + m.explorer.outputTokens;
      console.error(
        `          tokens=${totalTokens} (eval_in=${m.evaluator.inputTokens} eval_out=${m.evaluator.outputTokens}` +
        ` expl_in=${m.explorer.inputTokens} expl_out=${m.explorer.outputTokens})` +
        ` cost=$${m.estimatedCostUsd.toFixed(4)} duration=${(m.durationMs / 1000).toFixed(1)}s`
      );
    }
    cache.set(skill.name, skillsRepoSha, result);
    results.push(result);
  }

  await cache.save();

  const report: EvaluationReport = {
    repoPath,
    skillsDir,
    evaluatedAt: new Date().toISOString(),
    results,
  };

  const output =
    outputFormat === "json"
      ? JSON.stringify(report, null, 2)
      : outputFormat === "github-summary"
      ? renderGitHubSummary(report)
      : outputFormat === "html"
      ? renderHtml(report)
      : renderMarkdown(report);

  if (outputFile) {
    await writeFile(outputFile, output, "utf-8");
  } else {
    process.stdout.write(output);
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    await writeFile(process.env.GITHUB_STEP_SUMMARY, renderGitHubSummary(report), "utf-8");
  }

  return report;
}

function getSkillsRepoSha(skillsDir: string): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: skillsDir, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}
