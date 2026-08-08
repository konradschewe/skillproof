import { createAgent, toolStrategy } from "langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { Skill } from "../skills/types.js";
import type { SkillEvaluationResult } from "../evaluator/types.js";
import type { LLMProvider } from "../providers/types.js";
import { SYSTEM_PROMPT, buildUserPrompt, EvaluationSchema } from "../providers/prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ALLOWED_TOOLS = new Set([
  "read_file",
  "read_multiple_files",
  "list_directory",
  "directory_tree",
  "search_files",
]);

export class EvaluationAgent {
  constructor(private provider: LLMProvider) {}

  async evaluate(skill: Skill, repoPath: string): Promise<SkillEvaluationResult> {
    const serverPath = resolve(
      __dirname,
      "../../node_modules/@modelcontextprotocol/server-filesystem/dist/index.js"
    );

    const mcp = new MultiServerMCPClient({
      fs: { transport: "stdio", command: "node", args: [serverPath, repoPath] },
    });

    try {
      const mcpTools = (await mcp.getTools()).filter((t) => ALLOWED_TOOLS.has(t.name));

      const agent = createAgent({
        model: this.provider.createModel(),
        tools: mcpTools,
        systemPrompt: SYSTEM_PROMPT,
        // toolStrategy expects Zod v4 types; cast needed for Zod v3 compatibility
        responseFormat: toolStrategy(EvaluationSchema as any) as any,
      });

      const result = await agent.invoke({
        messages: [new HumanMessage(buildUserPrompt(skill))],
      });

      return { skillName: skill.name, ...result.structuredResponse };
    } finally {
      await mcp.close();
    }
  }
}
