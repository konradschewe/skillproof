#!/usr/bin/env node
import { Command } from "commander";
import { resolve } from "path";
import { runEvaluator } from "./evaluator/index.js";
import type { ProviderType } from "./providers/types.js";

const program = new Command();

program
  .name("skillproof")
  .description("Verify that Claude agent skills are correctly adopted in your codebase")
  .version("0.1.0")
  .requiredOption("--skills-dir <path>", "Path to the directory containing SKILL.md files")
  .option("--repo-path <path>", "Path to the repository to evaluate", process.cwd())
  .option("--provider <type>", "LLM provider: anthropic or aicore", "anthropic")
  .option("--model <id>", "Model ID to use", "anthropic--claude-4.6-sonnet")
  .option("--cache-dir <path>", "Directory for caching results", ".skillproof-cache")
  .option("--filter <substring>", "Only evaluate skills whose name contains this substring")
  .option("--verbose", "Stream agent thinking and tool calls to stderr")
  .option("--output-format <format>", "Output format: markdown, json, github-summary", "markdown")
  .option("--output-file <path>", "Write output to file instead of stdout")
  .action(async (opts) => {
    try {
      await runEvaluator({
        skillsDir: resolve(opts.skillsDir),
        repoPath: resolve(opts.repoPath),
        provider: opts.provider as ProviderType,
        modelId: opts.model,
        cacheDir: resolve(opts.cacheDir),
        filter: opts.filter,
        verbose: opts.verbose ?? false,
        outputFormat: opts.outputFormat,
        outputFile: opts.outputFile ? resolve(opts.outputFile) : undefined,
      });
    } catch (err) {
      console.error("Error:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
