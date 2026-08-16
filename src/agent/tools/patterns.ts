import { readFile } from "fs/promises";
import { join } from "path";

export const DEFAULT_EXCLUDE_DIRS = [
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

export const DEFAULT_EXCLUDES = DEFAULT_EXCLUDE_DIRS.flatMap((d) => [
  d,
  `**/${d}`,
  `**/${d}/**`,
  `*.pyc`,
  `**/*.pyc`,
  `*.egg-info`,
  `**/*.egg-info/**`,
]);

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

export function normalizeSearchPattern(pattern: unknown): unknown {
  if (typeof pattern !== "string") return pattern;
  // MCP server's search_files uses minimatch without auto-expansion: "main.py" won't
  // match "harness/main.py". Prefix bare filenames (no path separator, no glob chars) with "**/".
  if (!pattern.includes("/") && !pattern.includes("*") && !pattern.includes("?")) {
    return `**/${pattern}`;
  }
  return pattern;
}
