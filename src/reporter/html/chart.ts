import { S_ORDER, SM, type Sk } from "./shared.js";

export function donutSvg(counts: Record<string, number>, total: number): string {
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
  <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="white" font-size="20" font-weight="800" font-family="${font}">${pct}%</text>
  <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="rgba(255,255,255,.45)" font-size="9" font-family="${font}">coverage</text>
</svg>`;
}
