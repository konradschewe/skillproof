import { discoverSkills } from "../skills/discover.js";
import { EvaluationAgent } from "../agent/index.js";
import { FileCache } from "../cache/index.js";
import { createProvider } from "../providers/index.js";
import { printSkillBanner } from "../agent/verbose.js";
import type { ProviderType } from "../providers/types.js";
import type { EvaluationReport, SkillEvaluationResult } from "./types.js";
import { execSync } from "child_process";

export interface EvaluatorOptions {
  skillsDir: string;
  repoPath: string;
  provider: ProviderType;
  cacheDir: string;
  filter?: string;
  systemPrompt?: string;
  strict?: boolean;
  verbose?: boolean;
  concurrency?: number;
  noCache?: boolean;
}

export async function runEvaluator(options: EvaluatorOptions): Promise<EvaluationReport> {
  const { skillsDir, repoPath, provider, cacheDir, filter, systemPrompt, strict, verbose, concurrency = 1, noCache = false } = options;

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
  const agent = new EvaluationAgent(llmProvider, verbose, systemPrompt, strict);

  const results: SkillEvaluationResult[] = new Array(filteredSkills.length);
  let nextIndex = 0;

  const evaluateOne = async () => {
    while (nextIndex < filteredSkills.length) {
      const i = nextIndex++;
      const skill = filteredSkills[i];
      const cached = noCache ? null : cache.get(skill.name, skillsRepoSha);
      if (cached) {
        console.error(`  [cache] ${skill.name}`);
        results[i] = cached.result as SkillEvaluationResult;
        continue;
      }

      if (verbose) {
        printSkillBanner(skill.name, i + 1, filteredSkills.length);
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
      results[i] = result;
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, filteredSkills.length) }, evaluateOne));

  await cache.save();

  const report: EvaluationReport = {
    repoPath,
    skillsDir,
    evaluatedAt: new Date().toISOString(),
    results,
  };

  return report;
}

function getSkillsRepoSha(skillsDir: string): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: skillsDir, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}
