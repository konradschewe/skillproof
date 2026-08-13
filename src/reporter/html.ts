import type { EvaluationReport } from "../evaluator/types.js";

type Status = string;

const STATUS_CONFIG: Record<string, { icon: string; label: string; light: { fg: string; bg: string; border: string; bar: string } }> = {
  adopted:       { icon: "✅", label: "Adopted",       light: { fg: "#1a7f37", bg: "#dafbe1", border: "#1a7f37", bar: "#1a7f37" } },
  divergent:     { icon: "🔵", label: "Divergent",     light: { fg: "#0550ae", bg: "#ddf4ff", border: "#0969da", bar: "#0969da" } },
  partial:       { icon: "⚠️", label: "Partial",       light: { fg: "#9a6700", bg: "#fff8c5", border: "#d4a72c", bar: "#d4a72c" } },
  missing:       { icon: "❌", label: "Missing",       light: { fg: "#cf222e", bg: "#ffebe9", border: "#cf222e", bar: "#cf222e" } },
  "not-applicable": { icon: "➖", label: "N/A",        light: { fg: "#57606a", bg: "#f6f8fa", border: "#d0d7de", bar: "#d0d7de" } },
};

const cfg = (s: Status) => STATUS_CONFIG[s] ?? STATUS_CONFIG["missing"];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/\n/g, "&#10;");

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  :root {
    --bg: #f6f8fa; --surface: #fff; --border: #d0d7de; --text: #1f2328;
    --text-muted: #57606a; --text-subtle: #8c959f;
    --radius: 10px; --radius-sm: 6px;
    --shadow: 0 1px 3px rgba(31,35,40,.06), 0 4px 12px rgba(31,35,40,.04);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0d1117; --surface: #161b22; --border: #30363d; --text: #e6edf3;
      --text-muted: #8b949e; --text-subtle: #6e7681;
      --shadow: 0 1px 3px rgba(0,0,0,.3), 0 4px 12px rgba(0,0,0,.2);
    }
  }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0 auto; padding: 2rem 1.5rem; background: var(--bg); color: var(--text); max-width: 960px; line-height: 1.5; }
  h1 { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.3rem; }
  h2 { font-size: 1rem; font-weight: 600; margin: 2rem 0 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; }
  h3 { margin: 0; font-size: 0.95rem; font-weight: 600; }
  a { color: #0969da; text-decoration: none; }
  a:hover { text-decoration: underline; }

  .meta { color: var(--text-muted); font-size: 0.82rem; margin-bottom: 1.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; }
  .meta-item { display: flex; align-items: center; gap: 0.35rem; }
  .meta-label { color: var(--text-subtle); }

  .stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
  .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 0.75rem; text-align: center; box-shadow: var(--shadow); }
  .stat-value { font-size: 2rem; font-weight: 700; line-height: 1; }
  .stat-label { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.3rem; text-transform: uppercase; letter-spacing: .05em; }

  .progress-bar { background: var(--border); border-radius: 4px; height: 6px; margin-bottom: 2rem; overflow: hidden; display: flex; }
  .progress-segment { transition: width .3s ease; }

  .filter-bar { display: flex; gap: 0.4rem; margin-bottom: 1rem; flex-wrap: wrap; }
  .filter-btn { background: var(--surface); border: 1px solid var(--border); border-radius: 2em; padding: 0.25em 0.75em; font-size: 0.78rem; cursor: pointer; color: var(--text-muted); font-weight: 500; transition: all .15s; }
  .filter-btn:hover, .filter-btn.active { background: var(--text); color: var(--bg); border-color: var(--text); }

  table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 1.5rem; box-shadow: var(--shadow); font-size: 0.875rem; }
  th { background: var(--bg); text-align: left; padding: 0.6rem 0.9rem; font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid var(--border); }
  td { padding: 0.6rem 0.9rem; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg); }

  .badge { display: inline-flex; align-items: center; gap: 0.3em; padding: 0.18em 0.6em; border-radius: 2em; font-size: 0.72rem; font-weight: 600; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1.25rem 1rem; margin-bottom: 0.75rem; border-left: 3px solid var(--border); box-shadow: var(--shadow); }
  .card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
  .card-icon { font-size: 1rem; line-height: 1; }
  .reasoning { margin: 0 0 1rem; color: var(--text); font-size: 0.9rem; line-height: 1.6; }
  .reasoning p { margin: 0 0 0.5rem; }
  .reasoning p:last-child { margin-bottom: 0; }
  .reasoning strong { color: var(--text); }
  .reasoning ul, .reasoning ol { margin: 0.4rem 0 0.4rem 1.25rem; padding: 0; }
  .reasoning li { margin-bottom: 0.2rem; }

  details { margin-top: 0.25rem; }
  summary { cursor: pointer; font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; padding: 0.4rem 0; list-style: none; display: flex; align-items: center; gap: 0.4rem; user-select: none; }
  summary::-webkit-details-marker { display: none; }
  summary::before { content: "▶"; font-size: 0.6rem; transition: transform .15s; }
  details[open] summary::before { transform: rotate(90deg); }
  .evidence-list { margin: 0.5rem 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.3rem; }
  .evidence-item { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 0.78rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.4rem 0.65rem; color: var(--text-muted); line-height: 1.4; word-break: break-all; }
  .evidence-file { color: #0969da; font-weight: 500; }

  .metrics { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; margin-bottom: 2rem; box-shadow: var(--shadow); }
  .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 1rem; }
  .metric { text-align: center; }
  .metric-value { display: block; font-size: 1.4rem; font-weight: 700; }
  .metric-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
  .cached-note { font-size: 0.78rem; color: var(--text-subtle); margin: 0.25rem 0 1rem; }
`;

function evidenceHtml(items: string[]): string {
  if (items.length === 0) return "";
  const listItems = items.map((e) => {
    const fileMatch = e.match(/^([\w./\-]+\.py(?:\s+lines?\s+[\d\-,]+)?):?\s*(.*)/);
    if (fileMatch) {
      return `<li class="evidence-item"><span class="evidence-file">${esc(fileMatch[1])}</span> ${esc(fileMatch[2])}</li>`;
    }
    return `<li class="evidence-item">${esc(e)}</li>`;
  }).join("");
  return `<details><summary>${items.length} evidence item${items.length !== 1 ? "s" : ""}</summary><ul class="evidence-list">${listItems}</ul></details>`;
}

function renderSummaryTable(report: EvaluationReport): string {
  const sorted = [...report.results].sort((a, b) => {
    const order = ["adopted", "divergent", "partial", "missing", "not-applicable"];
    return order.indexOf(a.status) - order.indexOf(b.status);
  });
  const rows = sorted.map((r) => {
    const c = cfg(r.status);
    return `<tr data-status="${r.status}">
      <td><a href="#skill-${r.skillName}">${esc(r.skillName)}</a></td>
      <td><span class="badge" style="background:${c.light.bg};color:${c.light.fg}">${c.icon} ${c.label}</span></td>
    </tr>`;
  }).join("");
  return `<table><thead><tr><th>Skill</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderDetailCards(report: EvaluationReport): string {
  return report.results.map((r) => {
    const c = cfg(r.status);
    return `<div class="card" id="skill-${r.skillName}" data-status="${r.status}" style="border-left-color:${c.light.border}">
      <div class="card-header">
        <span class="card-icon">${c.icon}</span>
        <h3>${esc(r.skillName)}</h3>
        <span class="badge" style="background:${c.light.bg};color:${c.light.fg}">${c.label}</span>
      </div>
      <div class="reasoning" data-md="${escAttr(r.reasoning)}"></div>
      ${evidenceHtml(r.evidence)}
    </div>`;
  }).join("");
}

function renderMetrics(report: EvaluationReport): string {
  const evaluated = report.results.filter((r) => r.metrics);
  if (evaluated.length === 0) return "";
  const cached = report.results.length - evaluated.length;
  const tokens = evaluated.reduce((acc, r) => {
    const m = r.metrics!;
    return acc + m.evaluator.inputTokens + m.evaluator.outputTokens + m.explorer.inputTokens + m.explorer.outputTokens;
  }, 0);
  const cost = evaluated.reduce((acc, r) => acc + r.metrics!.estimatedCostUsd, 0);
  const ms = evaluated.reduce((acc, r) => acc + r.metrics!.durationMs, 0);
  return `<div class="metrics">
    <h2 style="margin:0 0 0.25rem">Metrics</h2>
    <p class="cached-note">${evaluated.length} evaluated · ${cached} cached</p>
    <div class="metrics-grid">
      <div class="metric"><span class="metric-value">${tokens.toLocaleString()}</span><span class="metric-label">Tokens</span></div>
      <div class="metric"><span class="metric-value">$${cost.toFixed(4)}</span><span class="metric-label">Cost</span></div>
      <div class="metric"><span class="metric-value">${(ms / 1000).toFixed(1)}s</span><span class="metric-label">Duration</span></div>
      <div class="metric"><span class="metric-value">${Math.round(tokens / evaluated.length).toLocaleString()}</span><span class="metric-label">Avg tokens</span></div>
    </div>
  </div>`;
}

export function renderHtml(report: EvaluationReport): string {
  const counts = Object.fromEntries(
    ["adopted", "divergent", "partial", "missing", "not-applicable"].map(
      (s) => [s, report.results.filter((r) => r.status === s).length]
    )
  );
  const total = report.results.length;
  const scored = total - counts["not-applicable"];

  const statTiles = (["adopted", "divergent", "partial", "missing"] as const)
    .filter((s) => counts[s] > 0 || s === "adopted" || s === "missing")
    .map((s) => {
      const c = cfg(s);
      return `<div class="stat"><div class="stat-value" style="color:${c.light.fg}">${counts[s]}</div><div class="stat-label">${c.label}</div></div>`;
    }).join("");
  const naBlock = counts["not-applicable"] > 0
    ? `<div class="stat"><div class="stat-value" style="color:var(--text-muted)">${counts["not-applicable"]}</div><div class="stat-label">N/A</div></div>`
    : "";

  const progressSegments = (["adopted", "divergent", "partial", "missing"] as const)
    .map((s) => {
      const pct = scored > 0 ? (counts[s] / scored) * 100 : 0;
      return `<div class="progress-segment" style="width:${pct}%;background:${cfg(s).light.bar}"></div>`;
    }).join("");

  const date = new Date(report.evaluatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

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
    <span class="meta-item"><span class="meta-label">Repo</span>${esc(report.repoPath)}</span>
    <span class="meta-item"><span class="meta-label">Skills</span>${esc(report.skillsDir)}</span>
    <span class="meta-item"><span class="meta-label">Evaluated</span>${date}</span>
  </div>

  <div class="stat-row">${statTiles}${naBlock}<div class="stat"><div class="stat-value">${total}</div><div class="stat-label">Total</div></div></div>
  ${scored > 0 ? `<div class="progress-bar">${progressSegments}</div>` : ""}

  ${renderMetrics(report)}

  <h2>Summary</h2>
  ${renderSummaryTable(report)}

  <h2>Details</h2>
  <div class="filter-bar">
    <button class="filter-btn active" onclick="filterCards('all', this)">All</button>
    ${["adopted","divergent","partial","missing","not-applicable"].filter(s => counts[s] > 0).map(s =>
      `<button class="filter-btn" onclick="filterCards('${s}', this)">${cfg(s).icon} ${cfg(s).label} (${counts[s]})</button>`
    ).join("")}
  </div>
  <div id="cards">${renderDetailCards(report)}</div>

  <script>
    document.querySelectorAll('.reasoning[data-md]').forEach(el => {
      el.innerHTML = marked.parse(el.dataset.md);
    });
    function filterCards(status, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#cards .card').forEach(card => {
        card.style.display = status === 'all' || card.dataset.status === status ? '' : 'none';
      });
    }
  </script>
</body>
</html>`;
}
