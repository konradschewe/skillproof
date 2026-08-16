import type { StructuredToolInterface } from "@langchain/core/tools";
import { normalizeSearchPattern } from "./patterns.js";

const TOOLS_WITH_EXCLUDE = new Set(["search_files", "directory_tree"]);
// Listing tools return many short entries; read tools return file content
const LISTING_TOOLS = new Set(["search_files", "directory_tree", "list_directory"]);
const MAX_LISTING_OUTPUT_CHARS = 6_000;
const MAX_READ_OUTPUT_CHARS = 12_000;

export function withOutputLimit(tool: StructuredToolInterface): StructuredToolInterface {
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
            `\n\n[truncated: showed ${shownLines} of ~${totalLines} lines. Use grep_files to search for specific content within this file.]`;
          return typeof result === "string"
            ? truncated
            : { ...result, content: truncated };
        }
        return result;
      },
    },
  });
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

export function withExcludePatterns(
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
