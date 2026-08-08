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

const DEFAULT_EXCLUDES = [
  ".git",
  ".venv",
  "venv",
  "node_modules",
  "__pycache__",
  "*.pyc",
  ".pytest_cache",
  ".tox",
  "dist",
  "build",
  "*.egg-info",
  "coverage",
  ".mypy_cache",
  ".ruff_cache",
  ".claude",
];

const TOOLS_WITH_EXCLUDE = new Set(["search_files", "directory_tree"]);
const MAX_TOOL_OUTPUT_CHARS = 20_000;

export async function loadExcludePatterns(repoPath: string): Promise<string[]> {
  try {
    const content = await readFile(join(repoPath, ".gitignore"), "utf-8");
    const gitignorePatterns = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
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

function withExcludePatterns(
  tool: StructuredToolInterface,
  excludePatterns: string[]
): StructuredToolInterface {
  if (!TOOLS_WITH_EXCLUDE.has(tool.name)) return tool;
  const original = tool.invoke.bind(tool);
  return Object.create(tool, {
    invoke: {
      value: async (input: unknown, config?: unknown) => {
        const patched = {
          ...(input as Record<string, unknown>),
          excludePatterns: [
            ...excludePatterns,
            ...((input as any).excludePatterns ?? []),
          ],
        };
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
