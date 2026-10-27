import template from "@skillproof/ui/dist/index.html";
import type { EvaluationReport } from "../evaluator/types.js";

export function renderHtml(report: EvaluationReport): string {
  const payload = JSON.stringify({ mode: "single", report });
  const safePayload = payload.replace(/<\/script>/gi, "<\\/script>");
  const inject = `<script>window.__SKILLPROOF_DATA__ = ${safePayload};</script>`;
  return (template as string).replace("</body>", `${inject}\n</body>`);
}
