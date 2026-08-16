import type { StructuredToolInterface } from "@langchain/core/tools";
import { withExcludePatterns } from "./wrappers.js";
import { withOutputLimit } from "./wrappers.js";

export const EXPLORER_TOOLS = new Set([
  "read_file",
  "read_multiple_files",
  "list_directory",
  "directory_tree",
  "search_files",
]);

export function prepareExplorerTools(
  tools: StructuredToolInterface[],
  excludePatterns: string[]
): StructuredToolInterface[] {
  return tools
    .filter((t) => EXPLORER_TOOLS.has(t.name))
    .map((t) => withExcludePatterns(t, excludePatterns))
    .map((t) => withOutputLimit(t));
}

export { loadExcludePatterns } from "./patterns.js";
export { createGrepTool } from "./grep.js";
