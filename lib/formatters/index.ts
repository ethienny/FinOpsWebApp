const COMPACT_CURRENCY = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`;
  const cached = COMPACT_CURRENCY.get(key);
  if (cached) return cached;
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  });
  COMPACT_CURRENCY.set(key, fmt);
  return fmt;
}

export function formatMoney(value: number | null | undefined, currency = "USD", compact = true): string {
  const n = value ?? 0;
  if (!compact && Math.abs(n) < 1000) return currencyFormatter(currency, false).format(n);
  if (compact) return currencyFormatter(currency, true).format(n);
  return currencyFormatter(currency, false).format(n);
}

export function formatNumber(value: number | null | undefined, compact = true): string {
  const n = value ?? 0;
  return new Intl.NumberFormat("en-US", {
    notation: compact && Math.abs(n) >= 10000 ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(n);
}

export function formatPercent(value: number | null | undefined, fromRatio = true): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const pct = fromRatio ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d) + " UTC";
}

export function formatDuration(start: string, end: string): string {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return "—";
  const mins = Math.round((b - a) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function friendlyService(resourceType: string): string {
  const last = resourceType.split("/").pop() ?? resourceType;
  return last.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");
}
