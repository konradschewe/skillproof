export const CSS = `
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
