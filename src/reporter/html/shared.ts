export const S_ORDER = ["adopted", "divergent", "partial", "missing", "not-applicable"] as const;
export type Sk = (typeof S_ORDER)[number];

export const SM: Record<Sk, { icon: string; label: string; bar: string }> = {
  adopted:          { icon: "✅", label: "Adopted",   bar: "#16a34a" },
  divergent:        { icon: "🔵", label: "Divergent", bar: "#3b82f6" },
  partial:          { icon: "⚠️",  label: "Partial",   bar: "#f59e0b" },
  missing:          { icon: "❌", label: "Missing",   bar: "#ef4444" },
  "not-applicable": { icon: "➖",  label: "N/A",       bar: "#94a3b8" },
};

export const sm = (s: string): { icon: string; label: string; bar: string } =>
  SM[s as Sk] ?? SM.missing;

export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const ea = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/\n/g, "&#10;");
