import { z } from "zod";
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { HumanMessage } from "@langchain/core/messages";
import type { LLMResult } from "@langchain/core/outputs";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent, toolStrategy } from "langchain";
import { readFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import type { SkillEvaluationResult } from "../evaluator/types.js";
import type { LLMProvider } from "../providers/types.js";
import type { Skill } from "../skills/types.js";
import { buildUserPrompt, EvaluationSchema, SYSTEM_PROMPT } from "./prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ALLOWED_TOOLS = new Set([
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

async function loadExcludePatterns(repoPath: string): Promise<string[]> {
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

const MAX_TOOL_OUTPUT_CHARS = 20_000;
const TOOLS_WITH_EXCLUDE = new Set(["search_files", "directory_tree"]);

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
        const text = typeof result === "string" ? result : (result as any)?.content ?? JSON.stringify(result);
        if (typeof text === "string" && text.length > MAX_TOOL_OUTPUT_CHARS) {
          const truncated = text.slice(0, MAX_TOOL_OUTPUT_CHARS) + `\n\n[truncated at ${MAX_TOOL_OUTPUT_CHARS} chars]`;
          return typeof result === "string" ? truncated : { ...result, content: truncated };
        }
        return result;
      },
    },
  });
}

class VerboseHandler extends BaseCallbackHandler {
  name = "VerboseHandler";

  handleLLMEnd(output: LLMResult) {
    const text = output.generations?.[0]?.[0]?.text;
    if (text?.trim()) {
      process.stderr.write(`\n[llm] ${text.trim()}\n`);
    }
  }

  handleToolStart(_tool: unknown, input: string) {
    try {
      process.stderr.write(`\n[tool] ${JSON.stringify(JSON.parse(input), null, 2)}\n`);
    } catch {
      process.stderr.write(`\n[tool] ${input}\n`);
    }
  }

  handleToolEnd(output: unknown) {
    const text =
      typeof output === "string"
        ? output
        : typeof (output as any)?.content === "string"
        ? (output as any).content
        : JSON.stringify(output);
    const truncated = text.length > 500 ? text.slice(0, 500) + " …" : text;
    process.stderr.write(`[tool result] ${truncated}\n`);
  }
}

export class EvaluationAgent {
  constructor(
    private provider: LLMProvider,
    private verbose = false
  ) {}

  async evaluate(skill: Skill, repoPath: string): Promise<SkillEvaluationResult> {
    const serverPath = resolve(
      __dirname,
      "../../node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"
    );

    const mcp = new MultiServerMCPClient({
      fs: { transport: "stdio", command: "node", args: [serverPath, repoPath] },
    });

    try {
      const excludePatterns = await loadExcludePatterns(repoPath);

      const mcpTools = (await mcp.getTools())
        .filter((t) => ALLOWED_TOOLS.has(t.name))
        .map((t) => withExcludePatterns(t, excludePatterns))
        .map((t) => {
          if (TOOLS_WITH_EXCLUDE.has(t.name)) return t;
          // truncate output for read tools that have no excludePatterns
          const original = t.invoke.bind(t);
          return Object.create(t, {
            invoke: {
              value: async (input: unknown, config?: unknown) => {
                const result = await original(input as any, config as any);
                const text = typeof result === "string" ? result : (result as any)?.content ?? JSON.stringify(result);
                if (typeof text === "string" && text.length > MAX_TOOL_OUTPUT_CHARS) {
                  const truncated = text.slice(0, MAX_TOOL_OUTPUT_CHARS) + `\n\n[truncated at ${MAX_TOOL_OUTPUT_CHARS} chars]`;
                  return typeof result === "string" ? truncated : { ...result, content: truncated };
                }
                return result;
              },
            },
          });
        });

      const agent = createAgent({
        model: this.provider.createModel(),
        tools: mcpTools,
        systemPrompt: SYSTEM_PROMPT,
        // toolStrategy expects Zod v4 types; cast needed for Zod v3 compatibility
        responseFormat: toolStrategy(EvaluationSchema as any) as any,
      });

      const config = this.verbose ? { callbacks: [new VerboseHandler()] } : undefined;

      const result = await agent.invoke(
        { messages: [new HumanMessage(buildUserPrompt(skill))] },
        config
      );

      return { skillName: skill.name, ...(result.structuredResponse as z.infer<typeof EvaluationSchema>) };
    } finally {
      await mcp.close();
    }
  }
}
