import type { StructuredToolInterface } from "@langchain/core/tools";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { readFile } from "fs/promises";
import { relative } from "path";
import { glob } from "glob";
import { z } from "zod";

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp",
  ".woff", ".woff2", ".ttf", ".eot",
  ".pdf", ".zip", ".gz", ".tar",
  ".pyc", ".pyo", ".so", ".dylib", ".dll",
]);

const MAX_GREP_MATCHES = 100;

const DEFAULT_FILE_PATTERN = "**/*.{py,ts,js,tsx,jsx,json,yaml,yml,toml,md,txt,sh,cfg,ini}";

async function globFiles(searchPath: string, pattern: string, excludePatterns: string[]): Promise<string[]> {
  try {
    return await glob(pattern, {
      cwd: searchPath,
      ignore: excludePatterns,
      absolute: true,
      nodir: true,
    });
  } catch {
    return [];
  }
}

function buildRegex(query: string, ignoreCase: boolean): RegExp | null {
  try {
    return new RegExp(query, ignoreCase ? "i" : "");
  } catch {
    return null;
  }
}

function collectMatches(
  lines: string[],
  relFile: string,
  regex: RegExp,
  contextLines: number,
  matches: string[]
): void {
  for (let i = 0; i < lines.length; i++) {
    if (matches.length >= MAX_GREP_MATCHES) break;
    if (!regex.test(lines[i])) continue;

    if (contextLines > 0) {
      const start = Math.max(0, i - contextLines);
      const end = Math.min(lines.length - 1, i + contextLines);
      for (let j = start; j <= end; j++) {
        const marker = j === i ? ">" : " ";
        matches.push(`${relFile}:${j + 1}:${marker} ${lines[j].trim()}`);
      }
      matches.push("--");
    } else {
      matches.push(`${relFile}:${i + 1}: ${lines[i].trim()}`);
    }
  }
}

export function createGrepTool(repoPath: string, excludePatterns: string[]): StructuredToolInterface {
  return new DynamicStructuredTool({
    name: "grep_files",
    description:
      "Search for a keyword, string, or regex pattern within file contents. Use this to find where a specific function, import, class name, or variable is used across the codebase. The query is treated as a regex — use alternation (e.g. 'foo|bar') to search for multiple terms at once. Returns file path, line number, and matching line for each match. Use context_lines to include surrounding lines for better code understanding.",
    schema: z.object({
      path: z.string().describe("Absolute path of the directory to search in"),
      query: z.string().describe("String or regex pattern to search for within file contents. Supports alternation (e.g. 'context_overlay|GenAIOperation|add_span_attribute')."),
      file_pattern: z
        .string()
        .optional()
        .describe("Glob pattern to restrict which files to search (e.g. '**/*.py'). Defaults to common source file types."),
      context_lines: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .describe("Number of lines to show before and after each match (like grep -C). Defaults to 0."),
      ignore_case: z
        .boolean()
        .optional()
        .describe("If true, match case-insensitively. Defaults to false."),
    }),
    func: async ({ path: searchPath, query, file_pattern, context_lines = 0, ignore_case = false }) => {
      const regex = buildRegex(query, ignore_case);
      if (!regex) return `Error: invalid regex pattern "${query}"`;

      const pattern = file_pattern ?? DEFAULT_FILE_PATTERN;
      const files = await globFiles(searchPath, pattern, excludePatterns);
      if (files.length === 0) return `Error: could not search in path "${searchPath}"`;

      const matches: string[] = [];

      for (const file of files) {
        if (matches.length >= MAX_GREP_MATCHES) break;

        const ext = file.slice(file.lastIndexOf("."));
        if (BINARY_EXTENSIONS.has(ext)) continue;

        let content: string;
        try {
          content = await readFile(file, "utf-8");
        } catch {
          continue;
        }

        const lines = content.split("\n");
        const relFile = relative(repoPath, file);
        collectMatches(lines, relFile, regex, context_lines, matches);
      }

      if (matches.length === 0) return `No matches found for "${query}" in ${searchPath}`;
      const suffix = matches.length >= MAX_GREP_MATCHES ? `\n[truncated at ${MAX_GREP_MATCHES} matches]` : "";
      return matches.join("\n") + suffix;
    },
  });
}
