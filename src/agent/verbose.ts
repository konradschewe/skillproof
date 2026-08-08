import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";

// ANSI color helpers — no external dep needed
const c = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  italic:  "\x1b[3m",

  // Evaluator: cyan family
  evalLabel:  "\x1b[36m",   // cyan
  evalBorder: "\x1b[36m",

  // Explorer (subagent): magenta family
  exprLabel:  "\x1b[35m",   // magenta
  exprBorder: "\x1b[35m",
  exprBg:     "\x1b[45m",   // magenta bg for subagent start/end banners

  // Tool names
  toolName:   "\x1b[33m",   // yellow

  // Thinking / LLM reflection
  think:      "\x1b[90m",   // dark grey

  // Skill banner
  skillBg:    "\x1b[44m",   // blue bg
  skillFg:    "\x1b[97m",   // bright white

  // Result dim
  result:     "\x1b[90m",
};

const EVAL_PREFIX  = `${c.evalLabel}${c.bold}[evaluator]${c.reset}`;
const EXPL_PREFIX  = `  ${c.exprLabel}${c.bold}[explorer]${c.reset}`;

// How much of a param value to show before truncating
const MAX_PARAM_CHARS = 120;
// Max chars to show in tool results
const MAX_RESULT_CHARS = 400;

function truncate(s: string, max = MAX_PARAM_CHARS): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `${c.dim}…${c.reset}`;
}

function formatParams(input: string): string {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(input);
  } catch {
    return `  ${c.dim}${truncate(input)}${c.reset}`;
  }

  const lines: string[] = [];
  for (const [k, v] of Object.entries(parsed)) {
    const raw = typeof v === "string" ? v : JSON.stringify(v);
    const val = truncate(raw);
    lines.push(`  ${c.dim}${k}:${c.reset} ${val}`);
  }
  return lines.join("\n");
}

function formatResult(output: unknown): string {
  const text =
    typeof output === "string"
      ? output
      : typeof (output as any)?.content === "string"
      ? (output as any).content
      : JSON.stringify(output);

  // Strip JSON wrapper noise for readability — show plain text
  let clean = text;
  try {
    const obj = JSON.parse(text);
    if (obj?.type === "text" && typeof obj.text === "string") clean = obj.text;
  } catch { /* keep raw */ }

  const truncated = clean.length > MAX_RESULT_CHARS
    ? clean.slice(0, MAX_RESULT_CHARS) + `\n  ${c.dim}[… ${clean.length - MAX_RESULT_CHARS} more chars]${c.reset}`
    : clean;

  // Indent result lines
  return truncated
    .split("\n")
    .map((l: string) => `  ${c.result}${l}${c.reset}`)
    .join("\n");
}

// Derive a short friendly tool name from the raw name
function friendlyTool(toolName: unknown): string {
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

// ──────────────────────────────────────────────────────────
// Public: print a skill evaluation banner
// ──────────────────────────────────────────────────────────
export function printSkillBanner(skillName: string, index: number, total: number): void {
  const label = `${c.skillBg}${c.skillFg}${c.bold}  SKILL ${index}/${total}  ${c.reset}`;
  const name  = `${c.bold} ${skillName}${c.reset}`;
  const line  = `${c.dim}${"─".repeat(60)}${c.reset}`;
  process.stderr.write(`\n${line}\n${label}${name}\n${line}\n`);
}

// ──────────────────────────────────────────────────────────
// Callback handler
// ──────────────────────────────────────────────────────────
export class VerboseHandler extends BaseCallbackHandler {
  name = "VerboseHandler";
  private toolCallCount = 0;

  constructor(private label: "evaluator" | "explorer") {
    super();
  }

  // Agent thinking / LLM reflection between tool calls
  handleLLMEnd(output: LLMResult) {
    const text = output.generations?.[0]?.[0]?.text?.trim();
    if (!text) return;

    const prefix = this.label === "explorer" ? "  " : "";
    const tag    = this.label === "evaluator"
      ? `${c.evalLabel}💭 evaluator thinks:${c.reset}`
      : `  ${c.exprLabel}💭 explorer thinks:${c.reset}`;

    // Show thinking dimmed and indented
    const lines = text.split("\n").map(l => `${prefix}  ${c.think}${c.italic}${l}${c.reset}`).join("\n");
    process.stderr.write(`\n${tag}\n${lines}\n`);
  }

  // Tool being called
  handleToolStart(tool: unknown, input: string, _runId: string, _parentRunId?: string, _tags?: string[], _metadata?: Record<string, unknown>, name?: string) {
    this.toolCallCount++;
    const toolName = name ?? (tool as any)?.kwargs?.name ?? "tool";
    const friendly = friendlyTool(toolName);

    if (this.label === "evaluator" && toolName === "explore_codebase") {
      // Evaluator is delegating to the explorer subagent — highlight it
      let question = "";
      try { question = JSON.parse(input)?.question ?? ""; } catch {}
      process.stderr.write(
        `\n${EVAL_PREFIX} ${c.toolName}${c.bold}explore_codebase${c.reset}` +
        ` ${c.exprBg}${c.exprLabel}${c.bold} ▶ explorer subagent ${c.reset}\n` +
        `  ${c.dim}question:${c.reset} ${truncate(question, 200)}\n`
      );
    } else if (this.label === "evaluator") {
      process.stderr.write(
        `\n${EVAL_PREFIX} ${c.toolName}${c.bold}${friendly}${c.reset}\n` +
        `${formatParams(input)}\n`
      );
    } else {
      // Explorer tool call — indented under the subagent scope
      process.stderr.write(
        `\n${EXPL_PREFIX} ${c.toolName}${c.bold}${friendly}${c.reset}\n` +
        `${formatParams(input)}\n`
      );
    }
  }

  // Tool result returned
  handleToolEnd(output: unknown) {
    if (this.label === "evaluator") {
      // This is the explorer subagent's findings coming back
      const raw = typeof output === "string" ? output : JSON.stringify(output);
      let rendered = raw;
      try {
        const obj = JSON.parse(raw);
        if (Array.isArray(obj?.findings)) {
          const lines: string[] = obj.findings.map((f: any) => {
            const file = f.file ? `${c.bold}${f.file}${c.reset}` : "";
            const snip = f.snippet ? `\n      ${c.dim}${truncate(f.snippet, 160)}${c.reset}` : "";
            const rel  = f.relevance ? `\n      ${c.think}${truncate(f.relevance, 120)}${c.reset}` : "";
            return `    ${c.exprLabel}▸${c.reset} ${file}${rel}${snip}`;
          });
          rendered = lines.join("\n");
        } else {
          rendered = `    ${c.dim}${truncate(raw, 400)}${c.reset}`;
        }
      } catch {
        rendered = `    ${c.dim}${truncate(raw, 400)}${c.reset}`;
      }
      process.stderr.write(
        `${c.exprLabel}  ◀ explorer findings:${c.reset}\n${rendered}\n`
      );
    } else {
      // Explorer's own MCP tool results
      process.stderr.write(
        `  ${c.dim}↳ result:${c.reset}\n${formatResult(output)}\n`
      );
    }
  }
}
