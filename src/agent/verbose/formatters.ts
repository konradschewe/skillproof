import { c, MAX_PARAM_CHARS, MAX_RESULT_CHARS } from "./colors.js";

export function truncate(s: string, max = MAX_PARAM_CHARS): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `${c.dim}…${c.reset}`;
}

export function formatParams(input: string): string {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(input);
  } catch {
    return `  ${c.dim}${truncate(input)}${c.reset}`;
  }

  const lines: string[] = [];
  for (const [k, v] of Object.entries(parsed)) {
    const raw = typeof v === "string" ? v : JSON.stringify(v);
    lines.push(`  ${c.dim}${k}:${c.reset} ${truncate(raw)}`);
  }
  return lines.join("\n");
}

export function formatResult(output: unknown): string {
  const text =
    typeof output === "string"
      ? output
      : typeof (output as any)?.content === "string"
      ? (output as any).content
      : JSON.stringify(output);

  let clean = text;
  try {
    const obj = JSON.parse(text);
    if (obj?.type === "text" && typeof obj.text === "string") clean = obj.text;
  } catch { /* keep raw */ }

  const truncated = clean.length > MAX_RESULT_CHARS
    ? clean.slice(0, MAX_RESULT_CHARS) + `\n  ${c.dim}[… ${clean.length - MAX_RESULT_CHARS} more chars]${c.reset}`
    : clean;

  return truncated
    .split("\n")
    .map((l: string) => `  ${c.result}${l}${c.reset}`)
    .join("\n");
}

export function friendlyTool(toolName: unknown): string {
  if (typeof toolName !== "string") return "tool";
  const map: Record<string, string> = {
    search_files:        "search_files",
    read_file:           "read_file",
    read_multiple_files: "read_multiple_files",
    list_directory:      "list_directory",
    directory_tree:      "directory_tree",
    explore_codebase:    "explore_codebase",
  };
  return map[toolName] ?? toolName;
}
