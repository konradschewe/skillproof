import type { EvaluationReport } from "../../evaluator/types.js";
import { S_ORDER, sm, esc, type Sk } from "./shared.js";

export function renderTable(report: EvaluationReport): string {
  const sorted = [...report.results].sort(
    (a, b) => S_ORDER.indexOf(a.status as Sk) - S_ORDER.indexOf(b.status as Sk)
  );
  const rows = sorted.map((r) =>
    `<tr><td><a href="#sk-${esc(r.skillName)}">${esc(r.skillName)}</a></td>` +
    `<td><span class="badge" data-s="${r.status}">${sm(r.status).icon} ${sm(r.status).label}</span></td></tr>`
  ).join("");
  return `<div class="table-wrap"><table><thead><tr><th>Skill</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
