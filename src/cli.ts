#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "path";
import { runEvaluator } from "./evaluator/index.js";
import { OUTPUT_FORMATS } from "./reporter/index.js";
import { PROVIDER_TYPES } from "./providers/types.js";
import { validateProvider, validateOutputFormat, validateConcurrency, validateFailStatuses } from "./cli/validation.js";
import { renderOutput, writeOutput, writeGitHubStepSummary, checkFailStatuses } from "./cli/output.js";
import type { ProviderType } from "./providers/types.js";
import type { OutputFormat } from "./reporter/index.js";

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
  .option("--provider <type>", `LLM provider: ${PROVIDER_TYPES.join(", ")}`, "anthropic")
  .option("--system-prompt <text>", "Append additional context to the evaluator's system prompt. Use this to describe repo-specific architecture that affects skill evaluation (e.g. 'this is a shared library, not a concrete agent').")
  .option("--strict", "Require exact API names and patterns as specified in the skill definition. By default, functionally equivalent implementations are accepted (e.g. a lower-level API that achieves the same result as a convenience wrapper counts as adoption).")
  .option("--concurrency <number>", "Number of skills to evaluate in parallel", "1")
  // Cache
  .option("--cache-dir <path>", "Directory for caching results", ".skillproof-cache")
  .option("--no-cache", "Skip cache and force re-evaluation of all skills")
  // Output
  .option("--output-format <format>", `Output format: ${OUTPUT_FORMATS.join(", ")}`, "markdown")
  .option("--output-file <path>", "Write output to file instead of stdout")
  .option("--fail-on <statuses>", `Exit with code 1 if any skill matches these statuses (comma-separated)`)
  // Debug
  .option("--verbose", "Stream agent thinking and tool calls to stderr")
  .action(async (opts) => {
    try {
      const provider = validateProvider(opts.provider);
      const outputFormat = validateOutputFormat(opts.outputFormat) as OutputFormat;
      const concurrency = validateConcurrency(opts.concurrency);
      const failStatuses = validateFailStatuses(opts.failOn);

      const report = await runEvaluator({
        skillsDir: resolve(opts.skillsDir),
        repoPath: resolve(opts.repoPath),
        provider: provider as ProviderType,
        cacheDir: resolve(opts.cacheDir),
        filter: opts.filter,
        systemPrompt: opts.systemPrompt,
        strict: opts.strict ?? false,
        concurrency,
        verbose: opts.verbose ?? false,
        noCache: !opts.cache,
      });

      const output = renderOutput(report, outputFormat);
      await writeOutput(output, opts.outputFile);
      await writeGitHubStepSummary(report);
      checkFailStatuses(report, failStatuses);
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
