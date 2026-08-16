import type { EvaluationReport } from "../../evaluator/types.js";
import { S_ORDER, esc } from "./shared.js";
import { CSS } from "./styles.js";
import { donutSvg } from "./chart.js";
import { renderMetrics } from "./metrics.js";
import { renderTable } from "./table.js";
import { renderCards } from "./cards.js";
import { INLINE_SCRIPT } from "./scripts.js";
import { statTilesHtml, progressHtml, donutLegendHtml, filterButtonsHtml } from "./hero.js";

export function renderHtml(report: EvaluationReport): string {
  const counts = Object.fromEntries(S_ORDER.map((s) => [s, report.results.filter((r) => r.status === s).length]));
  const total = report.results.length;
  const scored = total - (counts["not-applicable"] || 0);

  const repoName = report.repoPath.split("/").pop() ?? report.repoPath;
  const date = new Date(report.evaluatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Skillproof — ${esc(repoName)}</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>${CSS}</style>
</head>
<body>

<div class="hero">
  <div class="hero-inner">
    <div class="hero-left">
      <div class="hero-eyebrow">Skillproof</div>
      <h1 class="hero-title">${esc(repoName)}</h1>
      <p class="hero-sub">Skill adoption report</p>
      <div class="hero-meta">
        <span><b>Repo</b> ${esc(report.repoPath)}</span>
        <span><b>Skills</b> ${esc(report.skillsDir)}</span>
        <span><b>Evaluated</b> ${date}</span>
      </div>
    </div>
    <div class="hero-right">
      <div class="donut-wrap">
        ${donutSvg(counts, total)}
        <div class="donut-legend">${donutLegendHtml(counts)}</div>
        <p class="donut-note">(adopted + divergent) ÷ non-N/A</p>
      </div>
    </div>
  </div>
</div>

<div class="main">
  <div class="stats">${statTilesHtml(counts, total)}</div>
  ${progressHtml(counts, scored)}

  ${renderMetrics(report)}

  <div class="sec">Summary</div>
  ${renderTable(report)}

  <div class="sec" style="margin-top:1.5rem">Details</div>
  <details class="legend">
    <summary>Status guide</summary>
    <div class="legend-grid">
      <div class="legend-row"><span class="badge" data-s="adopted">✅ Adopted</span><span class="legend-def">Requirements are <strong>clearly implemented</strong> using the prescribed API</span></div>
      <div class="legend-row"><span class="badge" data-s="divergent">🔵 Divergent</span><span class="legend-def">All behaviors present, but via a <strong>different API or pattern</strong> than prescribed</span></div>
      <div class="legend-row"><span class="badge" data-s="partial">⚠️ Partial</span><span class="legend-def">Some required behaviors are <strong>genuinely absent</strong> — not just implemented differently</span></div>
      <div class="legend-row"><span class="badge" data-s="missing">❌ Missing</span><span class="legend-def">The skill's requirements are <strong>not implemented</strong></span></div>
      <div class="legend-row"><span class="badge" data-s="not-applicable">➖ N/A</span><span class="legend-def">The skill is <strong>intentionally irrelevant</strong> to this repository</span></div>
    </div>
  </details>
  <div class="controls">
    <div class="controls-inner">
      ${filterButtonsHtml(counts, total)}
      <div class="search">
        <svg class="search-ico" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>
        <input type="text" placeholder="Search skills…" oninput="doSearch(this.value)" autocomplete="off"/>
      </div>
    </div>
  </div>
  <div id="cards">${renderCards(report)}</div>
</div>

<script>${INLINE_SCRIPT}</script>
</body>
</html>`;
}
