import type { StructuredToolInterface } from "@langchain/core/tools";
import { readFile } from "fs/promises";
import { join } from "path";

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
const MAX_TOOL_OUTPUT_CHARS = 20_000;

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
  const original = tool.invoke.bind(tool);
  return Object.create(tool, {
    invoke: {
      value: async (input: unknown, config?: unknown) => {
        const result = await original(input as any, config as any);
        const text =
          typeof result === "string"
            ? result
            : (result as any)?.content ?? JSON.stringify(result);
        if (typeof text === "string" && text.length > MAX_TOOL_OUTPUT_CHARS) {
          const truncated =
            text.slice(0, MAX_TOOL_OUTPUT_CHARS) +
            `\n\n[truncated at ${MAX_TOOL_OUTPUT_CHARS} chars]`;
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
        const result = await original(patched as any, config as any);
        const text =
          typeof result === "string"
            ? result
            : (result as any)?.content ?? JSON.stringify(result);
        if (typeof text === "string" && text.length > MAX_TOOL_OUTPUT_CHARS) {
          const truncated =
            text.slice(0, MAX_TOOL_OUTPUT_CHARS) +
            `\n\n[truncated at ${MAX_TOOL_OUTPUT_CHARS} chars]`;
          return typeof result === "string"
            ? truncated
            : { ...result, content: truncated };
        }
        return result;
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
    .map((t) => (TOOLS_WITH_EXCLUDE.has(t.name) ? t : withOutputLimit(t)));
}
