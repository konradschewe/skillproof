#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "path";
import { runEvaluator } from "./evaluator/index.js";
import { OUTPUT_FORMATS } from "./reporter/index.js";
import { PROVIDER_TYPES } from "./providers/types.js";
import { validateProvider, validateOutputFormat, validateConcurrency, validateFailStatuses } from "./cli/validation.js";
import { renderOutput, writeOutput, writeGitHubStepSummary, checkFailStatuses } from "./cli/output.js";
import { loadConfigFile, type CliConfig } from "./cli/config.js";
import type { ProviderType } from "./providers/types.js";
import type { OutputFormat } from "./reporter/index.js";

const program = new Command();

program
  .name("skillproof")
  .description("Verify that Claude agent skills are correctly adopted in your codebase")
  .version("0.1.0")
  // Config file
  .option("--config <path>", "Path to a JSON config file. CLI flags override config file values.")
  // What to evaluate
  .option("--skills-dir <path>", "Path to the directory containing SKILL.md files")
  .option("--repo-path <path>", "Path to the repository to evaluate")
  .option("--filter <substring>", "Only evaluate skills whose name contains this substring")
  // How to evaluate
  .option("--provider <type>", `LLM provider: ${PROVIDER_TYPES.join(", ")}`)
  .option("--system-prompt <text>", "Append additional context to the evaluator's system prompt. Use this to describe repo-specific architecture that affects skill evaluation (e.g. 'this is a shared library, not a concrete agent').")
  .option("--strict", "Require exact API names and patterns as specified in the skill definition. By default, functionally equivalent implementations are accepted (e.g. a lower-level API that achieves the same result as a convenience wrapper counts as adoption).")
  .option("--concurrency <number>", "Number of skills to evaluate in parallel")
  // Cache
  .option("--cache-dir <path>", "Directory for caching results")
  .option("--no-cache", "Skip cache and force re-evaluation of all skills")
  // Output
  .option("--output-format <format>", `Output format: ${OUTPUT_FORMATS.join(", ")}`)
  .option("--output-file <path>", "Write output to file instead of stdout")
  .option("--fail-on <statuses>", "Exit with code 1 if any skill matches these statuses (comma-separated)")
  // Debug
  .option("--verbose", "Stream agent thinking and tool calls to stderr")
  .action(async (opts) => {
    try {
      const file: CliConfig = opts.config ? loadConfigFile(opts.config) : {};

      // CLI value wins when explicitly provided; config file wins over undefined
      const from = (key: string) => program.getOptionValueSource(key) === "cli";

      const skillsDir   = from("skillsDir")     ? opts.skillsDir     : (file.skillsDir     ?? opts.skillsDir);
      const repoPath    = from("repoPath")       ? opts.repoPath      : (file.repoPath      ?? opts.repoPath      ?? process.cwd());
      const filter      = from("filter")         ? opts.filter        : (file.filter        ?? opts.filter);
      const rawProvider = from("provider")       ? opts.provider      : (file.provider      ?? opts.provider      ?? "anthropic");
      const systemPrompt= from("systemPrompt")   ? opts.systemPrompt  : (file.systemPrompt  ?? opts.systemPrompt);
      const strict      = from("strict")         ? opts.strict        : (file.strict        ?? opts.strict        ?? false);
      const rawConc     = from("concurrency")    ? opts.concurrency   : String(file.concurrency ?? opts.concurrency ?? "1");
      const cacheDir    = from("cacheDir")       ? opts.cacheDir      : (file.cacheDir      ?? opts.cacheDir      ?? ".skillproof-cache");
      const noCache     = from("cache")          ? !opts.cache        : (file.noCache       ?? !opts.cache);
      const rawFormat   = from("outputFormat")   ? opts.outputFormat  : (file.outputFormat  ?? opts.outputFormat  ?? "markdown");
      const outputFile  = from("outputFile")     ? opts.outputFile    : (file.outputFile    ?? opts.outputFile);
      const failOnRaw   = from("failOn")         ? opts.failOn        : (file.failOn        ?? opts.failOn);
      const verbose     = from("verbose")        ? opts.verbose       : (file.verbose       ?? opts.verbose       ?? false);

      if (!skillsDir) throw new Error("--skills-dir is required (or set skillsDir in config file)");

      const provider     = validateProvider(rawProvider);
      const outputFormat = validateOutputFormat(rawFormat) as OutputFormat;
      const concurrency  = validateConcurrency(rawConc);
      const failStatuses = validateFailStatuses(failOnRaw);

      const report = await runEvaluator({
        skillsDir: resolve(skillsDir),
        repoPath: resolve(repoPath),
        provider: provider as ProviderType,
        cacheDir: resolve(cacheDir),
        filter,
        systemPrompt,
        strict: strict ?? false,
        concurrency,
        verbose: verbose ?? false,
        noCache: noCache ?? false,
      });

      const output = renderOutput(report, outputFormat);
      await writeOutput(output, outputFile);
      await writeGitHubStepSummary(report);
      checkFailStatuses(report, failStatuses);
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
