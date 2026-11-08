import { HumanMessage } from "@langchain/core/messages";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { countTokensApproximately, createAgent, summarizationMiddleware } from "langchain";
import { createRequire } from "module";
import type { LLMProvider } from "../providers/types.js";
import { MetricsHandler } from "./metrics.js";
import { createGrepTool, loadExcludePatterns, prepareExplorerTools, withTemplateSanitization } from "./tools/index.js";
import { VerboseHandler } from "./verbose/index.js";

const SUMMARIZE_TRIGGER_TOKENS = 40_000;

const REPO_CONTEXT_SYSTEM_PROMPT = `You are a codebase analysis agent. Your job is to explore a repository and produce a concise structural summary.

The summary will be used to evaluate whether this repository meets the requirements defined in a set of code agent skill definitions (SKILL.md files). Each skill definition describes concrete implementation requirements — files, patterns, or behaviours that must be present in the repository. The summary helps determine upfront which skills are relevant and which do not apply.

You have access to filesystem tools. Keep your exploration focused — start with the top-level structure and only go deeper where needed.

Be factual and concise. Plain text only, no markdown headers.`;

export class RepoContextAgent {
  constructor(
    private provider: LLMProvider,
    private verbose = false,
    private userContext?: string
  ) {}

  async generateContext(repoPath: string): Promise<string> {
    const serverPath = createRequire(import.meta.url).resolve(
      "@modelcontextprotocol/server-filesystem/dist/index.js"
    );

    const mcp = new MultiServerMCPClient({
      fs: { transport: "stdio", command: "node", args: [serverPath, repoPath] },
    });

    try {
      const excludePatterns = await loadExcludePatterns(repoPath);
      const tools = [
        ...prepareExplorerTools(await mcp.getTools(), excludePatterns),
        withTemplateSanitization(createGrepTool(repoPath, excludePatterns)),
      ];

      const model = this.provider.createExplorerModel();
      const metricsHandler = new MetricsHandler();
      const callbacks = this.verbose
        ? [new VerboseHandler("repo-context"), metricsHandler]
        : [metricsHandler];

      const systemPrompt = this.userContext
        ? `${REPO_CONTEXT_SYSTEM_PROMPT}\n\n## Additional Context (provided by the user)\n\n${this.userContext}`
        : REPO_CONTEXT_SYSTEM_PROMPT;

      const agent = createAgent({
        model,
        tools,
        systemPrompt,
        middleware: [
          summarizationMiddleware({
            model,
            trigger: { tokens: SUMMARIZE_TRIGGER_TOKENS },
            keep: { tokens: 8_000 },
            tokenCounter: (messages) => countTokensApproximately(messages),
          }),
        ],
      });

      const result = await agent.invoke(
        { messages: [new HumanMessage(`Repo root: ${repoPath}\n\nAnalyse this repository and produce a concise summary.`)] },
        { callbacks, recursionLimit: 35 } as any
      );

      const messages = result.messages as any[];
      const lastMessage = messages[messages.length - 1];
      const content: string =
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : Array.isArray(lastMessage.content)
            ? lastMessage.content
                .filter((c: any) => c.type === "text")
                .map((c: any) => c.text as string)
                .join("\n")
            : String(lastMessage.content);

      const m = metricsHandler.data;
      console.error(
        `  [context] tokens=${m.inputTokens + m.outputTokens}` +
        ` (in=${m.inputTokens} out=${m.outputTokens})`
      );

      return content;
    } finally {
      await mcp.close();
    }
  }
}
