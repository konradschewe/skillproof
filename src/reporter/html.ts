import type { EvaluationReport } from "../evaluator/types.js";

const statusIcon = (s: string) => (s === "adopted" ? "✅" : s === "partial" ? "⚠️" : "❌");
const statusClass = (s: string) => (s === "adopted" ? "adopted" : s === "partial" ? "partial" : "missing");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/\n/g, "&#10;");

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0 auto; padding: 2rem; background: #f6f8fa; color: #24292f; max-width: 900px; }
  h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.2rem; margin: 2rem 0 0.75rem; border-bottom: 1px solid #d0d7de; padding-bottom: 0.4rem; }
  h3 { margin: 0; font-size: 1rem; }
  a { color: #0969da; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .meta { color: #57606a; font-size: 0.875rem; margin-bottom: 1.5rem; }
  .meta span { margin-right: 1.25rem; }
  .stat-row { display: flex; gap: 1rem; margin-bottom: 2rem; }
  .stat { flex: 1; background: #fff; border: 1px solid #d0d7de; border-radius: 8px; padding: 1rem 1.25rem; text-align: center; }
  .stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
  .stat-label { font-size: 0.8rem; color: #57606a; margin-top: 0.25rem; }
  .stat.adopted .stat-value { color: #1a7f37; }
  .stat.partial .stat-value { color: #9a6700; }
  .stat.missing .stat-value { color: #cf222e; }
  .progress-bar { background: #d0d7de; border-radius: 4px; height: 8px; margin-bottom: 2rem; overflow: hidden; display: flex; }
  .progress-bar .adopted { background: #1a7f37; }
  .progress-bar .partial { background: #d4a72c; }
  .progress-bar .missing { background: #cf222e; }
  table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #d0d7de; border-radius: 8px; overflow: hidden; margin-bottom: 2rem; }
  th { background: #f6f8fa; text-align: left; padding: 0.6rem 0.75rem; font-size: 0.8rem; color: #57606a; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #d0d7de; }
  td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #f0f2f4; font-size: 0.9rem; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f6f8fa; }
  .badge { display: inline-block; padding: 0.2em 0.55em; border-radius: 2em; font-size: 0.75rem; font-weight: 600; }
  .badge.adopted { background: #dafbe1; color: #1a7f37; }
  .badge.partial { background: #fff8c5; color: #9a6700; }
  .badge.missing { background: #ffebe9; color: #cf222e; }
  .card { background: #fff; border: 1px solid #d0d7de; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; border-left: 4px solid #d0d7de; }
  .card.adopted { border-left-color: #1a7f37; }
  .card.partial { border-left-color: #d4a72c; }
  .card.missing { border-left-color: #cf222e; }
  .card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; }
  .card-icon { font-size: 1.1rem; }
  .reasoning { margin: 0 0 0.75rem; color: #57606a; font-size: 0.9rem; line-height: 1.5; }
  .evidence { margin: 0; padding-left: 1.25rem; font-size: 0.85rem; color: #57606a; }
  .evidence li { margin-bottom: 0.25rem; }
  .metrics { background: #fff; border: 1px solid #d0d7de; border-radius: 8px; padding: 1.25rem; margin-bottom: 2rem; }
  .metrics h2 { margin-top: 0; border: none; padding: 0; }
  .metrics-note { color: #57606a; font-size: 0.85rem; margin: 0.25rem 0 1rem; }
  .metrics-grid { display: flex; gap: 1rem; }
  .metric { flex: 1; text-align: center; }
  .metric-value { display: block; font-size: 1.4rem; font-weight: 700; }
  .metric-label { font-size: 0.78rem; color: #57606a; }
`;

function renderSummaryTable(report: EvaluationReport): string {
  const rows = report.results
    .map(
      (r) => `
      <tr>
        <td>${statusIcon(r.status)}</td>
        <td><a href="#skill-${r.skillName}">${r.skillName}</a></td>
        <td><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
      </tr>`
    )
    .join("");
  return `<table><thead><tr><th></th><th>Skill</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderDetailCards(report: EvaluationReport): string {
  return report.results
    .map((r) => {
      const evidence =
        r.evidence.length > 0
          ? `<ul class="evidence">${r.evidence.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>`
          : "";
      return `
      <div class="card ${statusClass(r.status)}" id="skill-${r.skillName}">
        <div class="card-header">
          <span class="card-icon">${statusIcon(r.status)}</span>
          <h3>${esc(r.skillName)}</h3>
          <span class="badge ${statusClass(r.status)}">${r.status}</span>
        </div>
        <p class="reasoning" data-md="${escAttr(r.reasoning)}"></p>
        ${evidence}
      </div>`;
    })
    .join("");
}

function renderMetrics(report: EvaluationReport, total: number): string {
  const evaluated = report.results.filter((r) => r.metrics);
  if (evaluated.length === 0) return "";

  const tokens = evaluated.reduce((acc, r) => {
    const m = r.metrics!;
    return acc + m.evaluator.inputTokens + m.evaluator.outputTokens + m.explorer.inputTokens + m.explorer.outputTokens;
  }, 0);
  const cost = evaluated.reduce((acc, r) => acc + r.metrics!.estimatedCostUsd, 0);
  const ms = evaluated.reduce((acc, r) => acc + r.metrics!.durationMs, 0);

  return `
  <div class="metrics">
    <h2>Metrics</h2>
    <p class="metrics-note">${evaluated.length} evaluated, ${total - evaluated.length} cached</p>
    <div class="metrics-grid">
      <div class="metric"><span class="metric-value">${tokens.toLocaleString()}</span><span class="metric-label">Total tokens</span></div>
      <div class="metric"><span class="metric-value">$${cost.toFixed(4)}</span><span class="metric-label">Estimated cost</span></div>
      <div class="metric"><span class="metric-value">${(ms / 1000).toFixed(1)}s</span><span class="metric-label">Total duration</span></div>
      <div class="metric"><span class="metric-value">${Math.round(tokens / evaluated.length).toLocaleString()}</span><span class="metric-label">Avg tokens / skill</span></div>
    </div>
  </div>`;
}

export function renderHtml(report: EvaluationReport): string {
  const adopted = report.results.filter((r) => r.status === "adopted").length;
  const partial = report.results.filter((r) => r.status === "partial").length;
  const missing = report.results.filter((r) => r.status === "missing").length;
  const total = report.results.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Skillproof Report</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>${CSS}</style>
</head>
<body>
  <h1>Skillproof Report</h1>
  <div class="meta">
    <span>📁 ${esc(report.repoPath)}</span>
    <span>🗂 ${esc(report.skillsDir)}</span>
    <span>🕐 ${report.evaluatedAt}</span>
  </div>
  <div class="stat-row">
    <div class="stat adopted"><div class="stat-value">${adopted}</div><div class="stat-label">Adopted</div></div>
    <div class="stat partial"><div class="stat-value">${partial}</div><div class="stat-label">Partial</div></div>
    <div class="stat missing"><div class="stat-value">${missing}</div><div class="stat-label">Missing</div></div>
    <div class="stat"><div class="stat-value">${total}</div><div class="stat-label">Total skills</div></div>
  </div>
  ${total > 0 ? `<div class="progress-bar"><div class="adopted" style="width:${(adopted / total) * 100}%"></div><div class="partial" style="width:${(partial / total) * 100}%"></div><div class="missing" style="width:${(missing / total) * 100}%"></div></div>` : ""}
  <h2>Summary</h2>
  ${renderSummaryTable(report)}
  ${renderMetrics(report, total)}
  <h2>Details</h2>
  ${renderDetailCards(report)}
  <script>document.querySelectorAll('.reasoning[data-md]').forEach(el => { el.innerHTML = marked.parse(el.dataset.md); });</script>
</body>
</html>`;
}
