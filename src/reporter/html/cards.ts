import type { EvaluationReport } from "../../evaluator/types.js";
import { sm, esc, ea } from "./shared.js";

export function evidenceHtml(items: string[]): string {
  if (items.length === 0) return "";
  const li = items.map((e) => {
    const m = e.match(/^([\w./\-]+\.[a-zA-Z]+(?:\s+lines?\s+[\d\-,]+)?):?\s*(.*)/);
    if (m) return `<li class="ev-item"><span class="ev-file">${esc(m[1])}</span>${m[2] ? ` <span>${esc(m[2])}</span>` : ""}</li>`;
    return `<li class="ev-item">${esc(e)}</li>`;
  }).join("");
  return `<details><summary>${items.length} evidence item${items.length !== 1 ? "s" : ""}</summary><ul class="ev-list">${li}</ul></details>`;
}

export function renderCards(report: EvaluationReport): string {
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
