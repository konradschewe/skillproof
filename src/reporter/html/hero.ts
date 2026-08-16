import { S_ORDER, SM, sm, type Sk } from "./shared.js";

export function statTilesHtml(counts: Record<string, number>, total: number): string {
  const main = (["adopted", "divergent", "partial", "missing"] as Sk[])
    .filter((s) => counts[s] > 0 || s === "adopted" || s === "missing")
    .map((s) => `<div class="stat" data-s="${s}"><div class="stat-n">${counts[s]}</div><div class="stat-lbl">${SM[s].label}</div></div>`)
    .join("");
  const na = counts["not-applicable"] > 0
    ? `<div class="stat" data-s="not-applicable"><div class="stat-n">${counts["not-applicable"]}</div><div class="stat-lbl">N/A</div></div>`
    : "";
  return `${main}${na}<div class="stat"><div class="stat-n">${total}</div><div class="stat-lbl">Total</div></div>`;
}

export function progressHtml(counts: Record<string, number>, scored: number): string {
  if (scored === 0) return "";
  const segs = (["adopted", "divergent", "partial", "missing"] as Sk[])
    .map((s) => {
      const pct = (counts[s] / scored) * 100;
      return pct > 0 ? `<div class="pseg" style="width:${pct.toFixed(2)}%;background:${SM[s].bar}"></div>` : "";
    }).join("");
  return `<div class="progress">${segs}</div>`;
}

export function donutLegendHtml(counts: Record<string, number>): string {
  return S_ORDER.filter((s) => counts[s] > 0).map((s) =>
    `<span class="leg"><span class="leg-dot" style="background:${SM[s].bar}"></span>${SM[s].label} ${counts[s]}</span>`
  ).join("");
}

export function filterButtonsHtml(counts: Record<string, number>, total: number): string {
  const btns = S_ORDER.filter((s) => counts[s] > 0).map((s) =>
    `<button class="fbtn" onclick="setFilter('${s}',this)">${sm(s).icon} ${SM[s].label} (${counts[s]})</button>`
  ).join("");
  return `<button class="fbtn on" onclick="setFilter('all',this)">All (${total})</button>${btns}`;
}
