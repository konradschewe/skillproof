import { discoverSkills } from "../skills/discover.js";
import { EvaluationAgent } from "../agent/index.js";
import { FileCache } from "../cache/index.js";
import { renderMarkdown, renderGitHubSummary } from "../reporter/index.js";
import { createProvider } from "../providers/index.js";
import type { ProviderType } from "../providers/types.js";
import type { EvaluationReport, SkillEvaluationResult } from "./types.js";
import { execSync } from "child_process";
import { writeFile } from "fs/promises";
import { resolve } from "path";

export interface EvaluatorOptions {
  skillsDir: string;
  repoPath: string;
  provider: ProviderType;
  modelId: string;
  cacheDir: string;
  outputFormat: "markdown" | "json" | "github-summary";
  outputFile?: string;
}

export async function runEvaluator(options: EvaluatorOptions): Promise<EvaluationReport> {
  const { skillsDir, repoPath, provider, modelId, cacheDir, outputFormat, outputFile } = options;

  const cache = new FileCache(cacheDir);
  await cache.load();

  const skillsRepoSha = getSkillsRepoSha(skillsDir);

  const skills = await discoverSkills(skillsDir);
  if (skills.length === 0) {
    throw new Error(`No SKILL.md files found in: ${skillsDir}`);
  }

  console.error(`Found ${skills.length} skill(s).`);

  const llmProvider = createProvider(provider, modelId);
  const agent = new EvaluationAgent(llmProvider);

  const results: SkillEvaluationResult[] = [];

  for (const skill of skills) {
    const cached = cache.get(skill.name, skillsRepoSha);
    if (cached) {
      console.error(`  [cache] ${skill.name}`);
      results.push(cached.result as SkillEvaluationResult);
      continue;
    }

    console.error(`  [eval]  ${skill.name}`);
    const result = await agent.evaluate(skill, repoPath);
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
