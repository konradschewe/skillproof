import type { StructuredToolInterface } from "@langchain/core/tools";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { readFile } from "fs/promises";
import { join, relative } from "path";
import { glob } from "glob";
import { z } from "zod";

export const EXPLORER_TOOLS = new Set([
  "read_file",
  "read_multiple_files",
  "list_directory",
  "directory_tree",
  "search_files",
]);

const DEFAULT_EXCLUDE_DIRS = [
  ".git",
  ".venv",
  "venv",
  "node_modules",
  "__pycache__",
  ".pytest_cache",
  ".tox",
  "dist",
  "build",
  "coverage",
  ".mypy_cache",
  ".ruff_cache",
  ".claude",
];

// minimatch needs explicit glob patterns to match at any depth
const DEFAULT_EXCLUDES = DEFAULT_EXCLUDE_DIRS.flatMap((d) => [
  d,
  `**/${d}`,
  `**/${d}/**`,
  `*.pyc`,
  `**/*.pyc`,
  `*.egg-info`,
  `**/*.egg-info/**`,
]);

const TOOLS_WITH_EXCLUDE = new Set(["search_files", "directory_tree"]);
// Listing tools return many short entries; read tools return file content
const LISTING_TOOLS = new Set(["search_files", "directory_tree", "list_directory"]);
const MAX_LISTING_OUTPUT_CHARS = 6_000;
const MAX_READ_OUTPUT_CHARS = 12_000;

export async function loadExcludePatterns(repoPath: string): Promise<string[]> {
  try {
    const content = await readFile(join(repoPath, ".gitignore"), "utf-8");
    const gitignorePatterns = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && !l.startsWith("!"));
    return [...new Set([...DEFAULT_EXCLUDES, ...gitignorePatterns])];
  } catch {
    return DEFAULT_EXCLUDES;
  }
}


function withOutputLimit(tool: StructuredToolInterface): StructuredToolInterface {
  const maxChars = LISTING_TOOLS.has(tool.name) ? MAX_LISTING_OUTPUT_CHARS : MAX_READ_OUTPUT_CHARS;
  const original = tool.invoke.bind(tool);
  return Object.create(tool, {
    invoke: {
      value: async (input: unknown, config?: unknown) => {
        const result = await original(input as any, config as any);
        const text =
          typeof result === "string"
            ? result
            : (result as any)?.content ?? JSON.stringify(result);
        if (typeof text === "string" && text.length > maxChars) {
          const totalLines = text.split("\n").length;
          const shownLines = text.slice(0, maxChars).split("\n").length;
          const truncated =
            text.slice(0, maxChars) +
            `\n\n[truncated: showed ${shownLines} of ~${totalLines} lines. Use search_files to find specific content within this file.]`;
          return typeof result === "string"
            ? truncated
            : { ...result, content: truncated };
        }
        return result;
      },
    },
  });
}

function normalizeSearchPattern(pattern: unknown): unknown {
  if (typeof pattern !== "string") return pattern;
  // MCP server's search_files uses minimatch without auto-expansion: "main.py" won't
  // match "harness/main.py". Prefix bare filenames (no path separator, no glob chars) with "**/".
  if (!pattern.includes("/") && !pattern.includes("*") && !pattern.includes("?")) {
    return `**/${pattern}`;
  }
  return pattern;
}

function patchArgs(input: unknown, excludePatterns: string[], isSearchFiles: boolean): unknown {
  // LangChain invokes tools with either a plain args object or a ToolCall wrapper
  // {type:"tool_call", id:"...", name:"...", args:{...}}. We must patch args.excludePatterns,
  // not top-level, otherwise the MCP server never sees the exclude list.
  if (
    typeof input === "object" &&
    input !== null &&
    "type" in input &&
    (input as any).type === "tool_call" &&
    "args" in input
  ) {
    const tc = input as any;
    return {
      ...tc,
      args: {
        ...tc.args,
        excludePatterns: [...excludePatterns, ...(tc.args?.excludePatterns ?? [])],
        ...(isSearchFiles ? { pattern: normalizeSearchPattern(tc.args?.pattern) } : {}),
      },
    };
  }
  const obj = input as Record<string, unknown>;
  return {
    ...obj,
    excludePatterns: [...excludePatterns, ...((obj.excludePatterns as string[]) ?? [])],
    ...(isSearchFiles ? { pattern: normalizeSearchPattern(obj.pattern) } : {}),
  };
}

function withExcludePatterns(
  tool: StructuredToolInterface,
  excludePatterns: string[]
): StructuredToolInterface {
  if (!TOOLS_WITH_EXCLUDE.has(tool.name)) return tool;
  const original = tool.invoke.bind(tool);
  return Object.create(tool, {
    invoke: {
      value: async (input: unknown, config?: unknown) => {
        const patched = patchArgs(input, excludePatterns, tool.name === "search_files");
        return original(patched as any, config as any);
      },
    },
  });
}

export function prepareExplorerTools(
  tools: StructuredToolInterface[],
  excludePatterns: string[]
): StructuredToolInterface[] {
  return tools
    .filter((t) => EXPLORER_TOOLS.has(t.name))
    .map((t) => withExcludePatterns(t, excludePatterns))
    .map((t) => withOutputLimit(t));
}

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp",
  ".woff", ".woff2", ".ttf", ".eot",
  ".pdf", ".zip", ".gz", ".tar",
  ".pyc", ".pyo", ".so", ".dylib", ".dll",
]);
const MAX_GREP_MATCHES = 100;

export function createGrepTool(repoPath: string, excludePatterns: string[]): StructuredToolInterface {
  return new DynamicStructuredTool({
    name: "grep_files",
    description:
      "Search for a keyword or string within file contents. Use this to find where a specific function, import, class name, or variable is used across the codebase. Returns file path, line number, and matching line for each match.",
    schema: z.object({
      path: z.string().describe("Absolute path of the directory to search in"),
      query: z.string().describe("String to search for within file contents"),
      file_pattern: z
        .string()
        .optional()
        .describe(
          "Glob pattern to restrict which files to search (e.g. '**/*.py'). Defaults to common source file types."
        ),
    }),
    func: async ({ path: searchPath, query, file_pattern }) => {
      const pattern = file_pattern ?? "**/*.{py,ts,js,tsx,jsx,json,yaml,yml,toml,md,txt,sh,cfg,ini}";

      let files: string[];
      try {
        files = await glob(pattern, {
          cwd: searchPath,
          ignore: excludePatterns,
          absolute: true,
          nodir: true,
        });
      } catch {
        return `Error: could not search in path "${searchPath}"`;
      }

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

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(query)) {
            matches.push(`${relFile}:${i + 1}: ${lines[i].trim()}`);
            if (matches.length >= MAX_GREP_MATCHES) break;
          }
        }
      }

      if (matches.length === 0) return `No matches found for "${query}" in ${searchPath}`;
      const suffix = matches.length >= MAX_GREP_MATCHES ? `\n[truncated at ${MAX_GREP_MATCHES} matches]` : "";
      return matches.join("\n") + suffix;
    },
  });
}
