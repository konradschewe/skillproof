#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "path";
import { writeFile } from "fs/promises";
import { runEvaluator } from "./evaluator/index.js";
import { renderMarkdown, renderGitHubSummary, renderHtml } from "./reporter/index.js";
import type { ProviderType } from "./providers/types.js";
import type { AdoptionStatus } from "./evaluator/types.js";

const VALID_PROVIDERS: ProviderType[] = ["anthropic", "aicore"];
const VALID_FORMATS = ["markdown", "json", "github-summary", "html"] as const;
const VALID_STATUSES: AdoptionStatus[] = ["adopted", "divergent", "partial", "missing", "not-applicable"];

const program = new Command();

program
  .name("skillproof")
  .description("Verify that Claude agent skills are correctly adopted in your codebase")
  .version("0.1.0")
  // What to evaluate
  .requiredOption("--skills-dir <path>", "Path to the directory containing SKILL.md files")
  .option("--repo-path <path>", "Path to the repository to evaluate", process.cwd())
  .option("--filter <substring>", "Only evaluate skills whose name contains this substring")
  // How to evaluate
  .option("--provider <type>", `LLM provider: ${VALID_PROVIDERS.join(", ")}`, "anthropic")
  .option("--system-prompt <text>", "Append additional context to the evaluator's system prompt. Use this to describe repo-specific architecture that affects skill evaluation (e.g. 'this is a shared library, not a concrete agent').")
  .option("--strict", "Require exact API names and patterns as specified in the skill definition. By default, functionally equivalent implementations are accepted (e.g. a lower-level API that achieves the same result as a convenience wrapper counts as adoption).")
  .option("--concurrency <number>", "Number of skills to evaluate in parallel", "1")
  // Cache
  .option("--cache-dir <path>", "Directory for caching results", ".skillproof-cache")
  .option("--no-cache", "Skip cache and force re-evaluation of all skills")
  // Output
  .option("--output-format <format>", `Output format: ${VALID_FORMATS.join(", ")}`, "markdown")
  .option("--output-file <path>", "Write output to file instead of stdout")
  .option("--fail-on <statuses>", `Exit with code 1 if any skill matches these statuses (comma-separated: ${VALID_STATUSES.join(", ")})`)
  // Debug
  .option("--verbose", "Stream agent thinking and tool calls to stderr")
  .action(async (opts) => {
    try {
      if (!VALID_PROVIDERS.includes(opts.provider)) {
        throw new Error(`Invalid --provider "${opts.provider}". Must be one of: ${VALID_PROVIDERS.join(", ")}`);
      }

      if (!VALID_FORMATS.includes(opts.outputFormat)) {
        throw new Error(`Invalid --output-format "${opts.outputFormat}". Must be one of: ${VALID_FORMATS.join(", ")}`);
      }

      const concurrency = parseInt(opts.concurrency, 10);
      if (isNaN(concurrency) || concurrency < 1) {
        throw new Error(`Invalid --concurrency "${opts.concurrency}". Must be a positive integer.`);
      }

      let failStatuses: AdoptionStatus[] = [];
      if (opts.failOn) {
        failStatuses = opts.failOn.split(",").map((s: string) => s.trim()) as AdoptionStatus[];
        const invalid = failStatuses.filter((s) => !VALID_STATUSES.includes(s));
        if (invalid.length > 0) {
          throw new Error(`Invalid --fail-on value(s): ${invalid.join(", ")}. Must be from: ${VALID_STATUSES.join(", ")}`);
        }
      }

      const report = await runEvaluator({
        skillsDir: resolve(opts.skillsDir),
        repoPath: resolve(opts.repoPath),
        provider: opts.provider as ProviderType,
        cacheDir: resolve(opts.cacheDir),
        filter: opts.filter,
        systemPrompt: opts.systemPrompt,
        strict: opts.strict ?? false,
        concurrency,
        verbose: opts.verbose ?? false,
        noCache: !opts.cache,
      });

      const format = opts.outputFormat as (typeof VALID_FORMATS)[number];
      const output =
        format === "json"
          ? JSON.stringify(report, null, 2)
          : format === "github-summary"
          ? renderGitHubSummary(report)
          : format === "html"
          ? renderHtml(report)
          : renderMarkdown(report);

      if (opts.outputFile) {
        await writeFile(resolve(opts.outputFile), output, "utf-8");
      } else {
        process.stdout.write(output);
      }

      if (process.env.GITHUB_STEP_SUMMARY) {
        await writeFile(process.env.GITHUB_STEP_SUMMARY, renderGitHubSummary(report), "utf-8");
      }

      if (failStatuses.length > 0) {
        const failing = report.results.filter((r) => failStatuses.includes(r.status));
        if (failing.length > 0) {
          console.error(`\nFailed: ${failing.length} skill(s) with status [${failStatuses.join(", ")}]:`);
          for (const r of failing) console.error(`  - ${r.skillName} (${r.status})`);
          process.exit(1);
        }
      }
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
