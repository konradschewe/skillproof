export const OUTPUT_FORMATS = ["markdown", "json", "github-summary", "html"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export { renderMarkdown, renderGitHubSummary } from "./markdown.js";
export { renderHtml } from "./html/index.js";
