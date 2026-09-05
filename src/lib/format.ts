export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(
    new Date(value)
  );
}

export const RISK_COLORS: Record<string, { text: string; bg: string; dot: string; glow: string }> = {
  critical: { text: "text-danger", bg: "bg-danger/10 border border-danger/30", dot: "bg-danger", glow: "shadow-glow-danger" },
  high: { text: "text-orange-400", bg: "bg-orange-400/10 border border-orange-400/30", dot: "bg-orange-400", glow: "" },
  medium: { text: "text-secondary", bg: "bg-secondary/10 border border-secondary/30", dot: "bg-secondary", glow: "" },
  low: { text: "text-accent", bg: "bg-accent/10 border border-accent/30", dot: "bg-accent", glow: "shadow-glow-emerald" },
};

export const STATUS_COLORS: Record<string, { text: string; dot: string }> = {
  matched: { text: "text-accent", dot: "bg-accent" },
  mismatch: { text: "text-danger", dot: "bg-danger" },
  missing: { text: "text-danger", dot: "bg-danger" },
  delayed: { text: "text-orange-400", dot: "bg-orange-400" },
  duplicate: { text: "text-danger", dot: "bg-danger" },
};

export const DECISION_STYLE: Record<string, { text: string; bg: string }> = {
  AUTO_RESOLVE: { text: "text-accent", bg: "bg-accent/10 border border-accent/30" },
  RECOMMEND: { text: "text-secondary", bg: "bg-secondary/10 border border-secondary/30" },
  ESCALATE: { text: "text-danger", bg: "bg-danger/10 border border-danger/30" },
};

export function categoryLabel(category: string) {
  return category
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
