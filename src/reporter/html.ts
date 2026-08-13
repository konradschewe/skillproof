import type { EvaluationReport } from "../evaluator/types.js";

const S_ORDER = ["adopted", "divergent", "partial", "missing", "not-applicable"] as const;
type Sk = (typeof S_ORDER)[number];

const SM: Record<Sk, { icon: string; label: string; bar: string }> = {
  adopted:          { icon: "✅", label: "Adopted",   bar: "#16a34a" },
  divergent:        { icon: "🔵", label: "Divergent", bar: "#3b82f6" },
  partial:          { icon: "⚠️",  label: "Partial",   bar: "#f59e0b" },
  missing:          { icon: "❌", label: "Missing",   bar: "#ef4444" },
  "not-applicable": { icon: "➖",  label: "N/A",       bar: "#94a3b8" },
};

const sm = (s: string) => SM[s as Sk] ?? SM.missing;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ea  = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/\n/g, "&#10;");

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;scroll-padding-top:60px}
:root{
  --bg:#f1f5f9;--surface:#fff;--surface-2:#f8fafc;
  --border:#e2e8f0;--border-subtle:#f1f5f9;
  --text:#0f172a;--text-2:#334155;--text-muted:#64748b;--text-subtle:#94a3b8;
  --r:10px;--r-sm:6px;
  --sh:0 1px 3px rgba(15,23,42,.08),0 1px 2px rgba(15,23,42,.04);
  --sh-md:0 4px 6px rgba(15,23,42,.07),0 2px 4px rgba(15,23,42,.04);
  --sh-up:0 8px 24px rgba(15,23,42,.12),0 2px 8px rgba(15,23,42,.06);
  --adopted-c:#16a34a;  --adopted-bg:#f0fdf4;  --adopted-bd:#86efac;
  --divergent-c:#2563eb;--divergent-bg:#eff6ff;--divergent-bd:#93c5fd;
  --partial-c:#d97706;  --partial-bg:#fffbeb;  --partial-bd:#fcd34d;
  --missing-c:#dc2626;  --missing-bg:#fef2f2;  --missing-bd:#fca5a5;
  --na-c:#6b7280;       --na-bg:#f9fafb;       --na-bd:#e5e7eb;
}
@media(prefers-color-scheme:dark){
  :root{
    --bg:#0f172a;--surface:#1e293b;--surface-2:#162032;
    --border:#334155;--border-subtle:#1e293b;
    --text:#f1f5f9;--text-2:#cbd5e1;--text-muted:#94a3b8;--text-subtle:#64748b;
    --sh:0 1px 3px rgba(0,0,0,.25);--sh-md:0 4px 6px rgba(0,0,0,.3);--sh-up:0 8px 24px rgba(0,0,0,.4);
    --adopted-c:#4ade80;  --adopted-bg:rgba(22,163,74,.12);  --adopted-bd:#166534;
    --divergent-c:#60a5fa;--divergent-bg:rgba(37,99,235,.12);--divergent-bd:#1e40af;
    --partial-c:#fbbf24;  --partial-bg:rgba(217,119,6,.12);  --partial-bd:#92400e;
    --missing-c:#f87171;  --missing-bg:rgba(220,38,38,.12);  --missing-bd:#991b1b;
    --na-c:#94a3b8;       --na-bg:rgba(100,116,139,.1);      --na-bd:#334155;
  }
}
[data-s="adopted"]        {--sc:var(--adopted-c);  --sbg:var(--adopted-bg);  --sbd:var(--adopted-bd)}
[data-s="divergent"]      {--sc:var(--divergent-c);--sbg:var(--divergent-bg);--sbd:var(--divergent-bd)}
[data-s="partial"]        {--sc:var(--partial-c);  --sbg:var(--partial-bg);  --sbd:var(--partial-bd)}
[data-s="missing"]        {--sc:var(--missing-c);  --sbg:var(--missing-bg);  --sbd:var(--missing-bd)}
[data-s="not-applicable"] {--sc:var(--na-c);       --sbg:var(--na-bg);       --sbd:var(--na-bd)}

body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
a{color:#3b82f6;text-decoration:none}
a:hover{text-decoration:underline}

/* Hero */
.hero{background:linear-gradient(135deg,#0f172a 0%,#1a3a5c 55%,#0f172a 100%);color:#fff;padding:2.5rem 2rem 2rem}
.hero-inner{max-width:980px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:2rem;flex-wrap:wrap}
.hero-left{flex:1;min-width:240px}
.hero-eyebrow{font-size:.68rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;opacity:.45;margin-bottom:.5rem}
.hero-title{font-size:1.85rem;font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:.35rem}
.hero-sub{font-size:.82rem;opacity:.5;margin-bottom:1.25rem}
.hero-meta{display:flex;flex-wrap:wrap;gap:.2rem 1.25rem;font-size:.75rem;opacity:.5}
.hero-meta span{display:flex;align-items:center;gap:.3rem}
.hero-meta b{opacity:.65;font-weight:500}
.hero-right{flex-shrink:0}

/* Donut */
.donut-wrap{display:flex;flex-direction:column;align-items:center;gap:.6rem}
.donut-legend{display:flex;flex-wrap:wrap;gap:.25rem .7rem;justify-content:center;max-width:180px}
.leg{display:flex;align-items:center;gap:.3rem;font-size:.68rem;color:rgba(255,255,255,.6)}
.leg-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.donut-note{font-size:.62rem;color:rgba(255,255,255,.32);text-align:center;max-width:180px;margin-top:.25rem;font-style:italic}

/* Content wrapper */
.main{max-width:980px;margin:0 auto;padding:1.75rem 2rem}

/* Stats */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:.6rem;margin-bottom:1.25rem}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:.9rem .75rem;text-align:center;box-shadow:var(--sh)}
.stat-n{font-size:1.9rem;font-weight:700;line-height:1;color:var(--sc,var(--text))}
.stat-lbl{font-size:.66rem;color:var(--text-muted);margin-top:.3rem;text-transform:uppercase;letter-spacing:.06em;font-weight:500}

/* Progress */
.progress{height:6px;background:var(--border);border-radius:3px;overflow:hidden;display:flex;margin-bottom:1.75rem}
.pseg{height:100%}

/* Section label */
.sec{font-size:.68rem;font-weight:600;color:var(--text-subtle);text-transform:uppercase;letter-spacing:.1em;margin:0 0 .6rem;padding-bottom:.5rem;border-bottom:1px solid var(--border)}

/* Metrics */
.metrics{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:1.1rem 1.25rem 1.25rem;margin-bottom:1.75rem;box-shadow:var(--sh)}
.metrics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:1rem;margin-top:.65rem}
.metric{text-align:center}
.metric-val{font-size:1.35rem;font-weight:700;display:block;color:var(--text)}
.metric-lbl{font-size:.66rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;font-weight:500}
.cached-note{font-size:.72rem;color:var(--text-subtle);margin-top:.15rem}

/* Summary table */
.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:1.75rem;box-shadow:var(--sh)}
table{width:100%;border-collapse:collapse;font-size:.85rem}
th{background:var(--surface-2);text-align:left;padding:.5rem 1rem;font-size:.66rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--border)}
td{padding:.5rem 1rem;border-bottom:1px solid var(--border-subtle);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--surface-2)}

/* Badge */
.badge{display:inline-flex;align-items:center;gap:.25em;padding:.2em .65em;border-radius:2em;font-size:.7rem;font-weight:600;border:1px solid var(--sbd);color:var(--sc);background:var(--sbg);white-space:nowrap;vertical-align:middle}

/* Legend */
.legend{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:.75rem 1rem;margin-bottom:.75rem;box-shadow:var(--sh)}
.legend summary{font-size:.7rem;font-weight:600;color:var(--text-subtle);text-transform:uppercase;letter-spacing:.08em}
.legend-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:.45rem .75rem;margin-top:.65rem}
.legend-row{display:flex;align-items:baseline;gap:.5rem;font-size:.8rem}
.legend-row .badge{flex-shrink:0;position:relative;top:1px}
.legend-def{color:var(--text-muted)}
.legend-def strong{color:var(--text-2);font-weight:600}

/* Sticky controls */
.controls{position:sticky;top:0;z-index:10;background:var(--bg);padding:.65rem 0;margin-bottom:.65rem;border-bottom:1px solid var(--border)}
.controls-inner{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap}
.fbtn{background:var(--surface);border:1px solid var(--border);border-radius:2em;padding:.28em .75em;font-size:.73rem;cursor:pointer;color:var(--text-muted);font-weight:500;transition:background .12s,color .12s,border-color .12s;white-space:nowrap}
.fbtn:hover{background:var(--surface-2);color:var(--text-2)}
.fbtn.on{background:var(--text);color:var(--bg);border-color:var(--text)}
.search{margin-left:auto;position:relative}
.search input{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-sm);padding:.28em .75em .28em 1.9rem;font-size:.78rem;color:var(--text);outline:none;width:190px;transition:border-color .15s,width .2s}
.search input:focus{border-color:#3b82f6;width:250px}
.search input::placeholder{color:var(--text-subtle)}
.search-ico{position:absolute;left:.6rem;top:50%;transform:translateY(-50%);color:var(--text-subtle);pointer-events:none;font-size:.72rem}

/* Cards */
@keyframes fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.card{background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--sc);border-radius:var(--r);padding:1.2rem 1.25rem 1rem;margin-bottom:.65rem;box-shadow:var(--sh);transition:box-shadow .15s,transform .15s;animation:fadein .22s ease both}
.card:hover{box-shadow:var(--sh-up);transform:translateY(-1px)}
.card-hdr{display:flex;align-items:center;gap:.55rem;margin-bottom:.8rem}
.card-ico{font-size:1.05rem;line-height:1;flex-shrink:0}
.card-name{font-size:.95rem;font-weight:600;flex:1}
.reasoning{font-size:.875rem;color:var(--text-2);line-height:1.65}
.reasoning p{margin-bottom:.45rem}
.reasoning p:last-child{margin-bottom:0}
.reasoning ul,.reasoning ol{margin:.35rem 0 .35rem 1.2rem}
.reasoning li{margin-bottom:.2rem}
.reasoning strong{color:var(--text)}
.reasoning code{font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;font-size:.82em;background:var(--surface-2);border:1px solid var(--border);border-radius:3px;padding:.1em .35em}
.reasoning h1,.reasoning h2,.reasoning h3{color:var(--text);margin:.6rem 0 .3rem;font-size:inherit;font-weight:600}

/* Evidence */
details{margin-top:.6rem}
summary{cursor:pointer;list-style:none;font-size:.7rem;font-weight:600;color:var(--text-subtle);text-transform:uppercase;letter-spacing:.08em;padding:.3rem 0;display:flex;align-items:center;gap:.4rem;user-select:none}
summary::-webkit-details-marker{display:none}
summary::before{content:"▶";font-size:.52rem;transition:transform .15s}
details[open] summary::before{transform:rotate(90deg)}
.ev-list{margin:.45rem 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:.28rem}
.ev-item{font-family:"SFMono-Regular",Consolas,"Liberation Mono",Menlo,monospace;font-size:.76rem;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-sm);padding:.38rem .65rem;color:var(--text-muted);word-break:break-all;line-height:1.45}
.ev-file{color:#3b82f6;font-weight:500}

@media(max-width:620px){
  .hero{padding:1.75rem 1.25rem 1.5rem}
  .main{padding:1.25rem}
  .hero-right{display:none}
  .search input{width:130px}
  .search input:focus{width:170px}
}
`;

function donutSvg(counts: Record<string, number>, total: number): string {
  const R = 36, cx = 50, cy = 50, circ = 2 * Math.PI * R;
  const segs: string[] = [];
  let cum = 0;
  for (const s of S_ORDER) {
    const n = counts[s] || 0;
    if (n === 0) continue;
    const frac = n / total;
    const len = frac * circ;
    segs.push(
      `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${SM[s].bar}" stroke-width="9" ` +
      `stroke-dasharray="${len.toFixed(2)} ${(circ - len).toFixed(2)}" ` +
      `stroke-dashoffset="${(-(cum * circ)).toFixed(2)}" ` +
      `transform="rotate(-90 ${cx} ${cy})"/>`
    );
    cum += frac;
  }
  const scored = total - (counts["not-applicable"] || 0);
  const pct = scored > 0 ? Math.round(((counts.adopted || 0) + (counts.divergent || 0)) / scored * 100) : 0;
  const font = `-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`;
  return `<svg viewBox="0 0 100 100" width="128" height="128">
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="9"/>
  ${segs.join("\n  ")}
  <text x="${cx}" y="${cy-4}" text-anchor="middle" fill="white" font-size="20" font-weight="800" font-family="${font}">${pct}%</text>
  <text x="${cx}" y="${cy+12}" text-anchor="middle" fill="rgba(255,255,255,.45)" font-size="9" font-family="${font}">coverage</text>
</svg>`;
}

function evidenceHtml(items: string[]): string {
  if (items.length === 0) return "";
  const li = items.map((e) => {
    const m = e.match(/^([\w./\-]+\.[a-zA-Z]+(?:\s+lines?\s+[\d\-,]+)?):?\s*(.*)/);
    if (m) return `<li class="ev-item"><span class="ev-file">${esc(m[1])}</span>${m[2] ? ` <span>${esc(m[2])}</span>` : ""}</li>`;
    return `<li class="ev-item">${esc(e)}</li>`;
  }).join("");
  return `<details><summary>${items.length} evidence item${items.length !== 1 ? "s" : ""}</summary><ul class="ev-list">${li}</ul></details>`;
}

function renderTable(report: EvaluationReport): string {
  const sorted = [...report.results].sort(
    (a, b) => S_ORDER.indexOf(a.status as Sk) - S_ORDER.indexOf(b.status as Sk)
  );
  const rows = sorted.map((r) =>
    `<tr><td><a href="#sk-${esc(r.skillName)}">${esc(r.skillName)}</a></td>` +
    `<td><span class="badge" data-s="${r.status}">${sm(r.status).icon} ${sm(r.status).label}</span></td></tr>`
  ).join("");
  return `<div class="table-wrap"><table><thead><tr><th>Skill</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderCards(report: EvaluationReport): string {
  return report.results.map((r, i) =>
    `<div class="card" id="sk-${esc(r.skillName)}" data-s="${r.status}" style="animation-delay:${(i * 0.025).toFixed(3)}s">` +
    `<div class="card-hdr">` +
    `<span class="card-ico">${sm(r.status).icon}</span>` +
    `<span class="card-name">${esc(r.skillName)}</span>` +
    `<span class="badge" data-s="${r.status}">${sm(r.status).label}</span>` +
    `</div>` +
    `<div class="reasoning" data-md="${ea(r.reasoning)}"></div>` +
    `${evidenceHtml(r.evidence)}` +
    `</div>`
  ).join("");
}

function renderMetrics(report: EvaluationReport): string {
  const ev = report.results.filter((r) => r.metrics);
  if (ev.length === 0) return "";
  const cached = report.results.length - ev.length;
  const tokens = ev.reduce((a, r) => a + r.metrics!.evaluator.inputTokens + r.metrics!.evaluator.outputTokens + r.metrics!.explorer.inputTokens + r.metrics!.explorer.outputTokens, 0);
  const cost = ev.reduce((a, r) => a + r.metrics!.estimatedCostUsd, 0);
  const ms = ev.reduce((a, r) => a + r.metrics!.durationMs, 0);
  return `<div class="metrics">
  <div class="sec">Metrics</div>
  <p class="cached-note">${ev.length} evaluated · ${cached} cached</p>
  <div class="metrics-grid">
    <div class="metric"><span class="metric-val">${tokens.toLocaleString()}</span><span class="metric-lbl">Tokens</span></div>
    <div class="metric"><span class="metric-val">$${cost.toFixed(4)}</span><span class="metric-lbl">Cost</span></div>
    <div class="metric"><span class="metric-val">${(ms / 1000).toFixed(1)}s</span><span class="metric-lbl">Duration</span></div>
    <div class="metric"><span class="metric-val">${Math.round(tokens / ev.length).toLocaleString()}</span><span class="metric-lbl">Avg tokens</span></div>
    <div class="metric"><span class="metric-val">$${(cost / ev.length).toFixed(4)}</span><span class="metric-lbl">Avg cost</span></div>
  </div>
</div>`;
}

export function renderHtml(report: EvaluationReport): string {
  const counts = Object.fromEntries(S_ORDER.map((s) => [s, report.results.filter((r) => r.status === s).length]));
  const total = report.results.length;
  const scored = total - (counts["not-applicable"] || 0);

  const statTiles =
    (["adopted", "divergent", "partial", "missing"] as Sk[])
      .filter((s) => counts[s] > 0 || s === "adopted" || s === "missing")
      .map((s) => `<div class="stat" data-s="${s}"><div class="stat-n">${counts[s]}</div><div class="stat-lbl">${SM[s].label}</div></div>`)
      .join("") +
    (counts["not-applicable"] > 0
      ? `<div class="stat" data-s="not-applicable"><div class="stat-n">${counts["not-applicable"]}</div><div class="stat-lbl">N/A</div></div>`
      : "") +
    `<div class="stat"><div class="stat-n">${total}</div><div class="stat-lbl">Total</div></div>`;

  const progressSegs = scored > 0
    ? (["adopted", "divergent", "partial", "missing"] as Sk[])
        .map((s) => {
          const pct = (counts[s] / scored) * 100;
          return pct > 0 ? `<div class="pseg" style="width:${pct.toFixed(2)}%;background:${SM[s].bar}"></div>` : "";
        }).join("")
    : "";

  const donutLegend = S_ORDER.filter((s) => counts[s] > 0).map((s) =>
    `<span class="leg"><span class="leg-dot" style="background:${SM[s].bar}"></span>${SM[s].label} ${counts[s]}</span>`
  ).join("");

  const filterBtns = S_ORDER.filter((s) => counts[s] > 0).map((s) =>
    `<button class="fbtn" onclick="setFilter('${s}',this)">${SM[s].icon} ${SM[s].label} (${counts[s]})</button>`
  ).join("");

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
        <div class="donut-legend">${donutLegend}</div>
        <p class="donut-note">(adopted + divergent) ÷ non-N/A</p>
      </div>
    </div>
  </div>
</div>

<div class="main">
  <div class="stats">${statTiles}</div>
  ${progressSegs ? `<div class="progress">${progressSegs}</div>` : ""}

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
      <button class="fbtn on" onclick="setFilter('all',this)">All (${total})</button>
      ${filterBtns}
      <div class="search">
        <svg class="search-ico" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>
        <input type="text" placeholder="Search skills…" oninput="doSearch(this.value)" autocomplete="off"/>
      </div>
    </div>
  </div>
  <div id="cards">${renderCards(report)}</div>
</div>

<script>
var filt='all',q='';
if(typeof marked!=='undefined'){
  marked.setOptions&&marked.setOptions({breaks:true});
  document.querySelectorAll('.reasoning[data-md]').forEach(function(el){
    try{el.innerHTML=marked.parse(el.dataset.md);}catch(e){el.textContent=el.dataset.md;}
  });
}else{
  document.querySelectorAll('.reasoning[data-md]').forEach(function(el){el.textContent=el.dataset.md;});
}
function setFilter(f,btn){
  filt=f;
  document.querySelectorAll('.fbtn').forEach(function(b){b.classList.remove('on');});
  if(btn)btn.classList.add('on');
  render();
}
function doSearch(v){q=v.toLowerCase().trim();render();}
function render(){
  document.querySelectorAll('#cards .card').forEach(function(c){
    var statusOk=filt==='all'||c.dataset.s===filt;
    var nameOk=!q||c.id.toLowerCase().includes(q)||c.querySelector('.card-name').textContent.toLowerCase().includes(q);
    c.style.display=statusOk&&nameOk?'':'none';
  });
}
</script>
</body>
</html>`;
}
