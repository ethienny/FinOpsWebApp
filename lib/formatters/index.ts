// Display formatters for money, numbers, percentages, dates and durations.
// Money is compact by default (1.2K, 3.4M) unless the caller asks for the
// full value.
//
// Number and date conventions depend on the UI language, so the formatters
// come from createFormatters(locale). Server code gets them through
// getFormatters() (lib/i18n/get-formatters.ts) and client components through
// useFormatters() (lib/i18n/LocaleProvider.tsx).

import type { Locale } from "@/lib/i18n/config";

// English keeps the conventions the app already used (US numbers, day-first
// dates); Portuguese uses pt-BR for both.
const NUMBER_LOCALE: Record<Locale, string> = { en: "en-US", pt: "pt-BR" };
const DATE_LOCALE: Record<Locale, string> = { en: "en-GB", pt: "pt-BR" };

export interface Formatters {
  formatMoney: (value: number | null | undefined, currency?: string, compact?: boolean) => string;
  formatNumber: (value: number | null | undefined, compact?: boolean) => string;
  formatPercent: (value: number | null | undefined, fromRatio?: boolean) => string;
  /** Fixed-decimal number with the locale's separator, e.g. 3.5 / 3,5. */
  formatDecimal: (value: number, digits?: number) => string;
  formatDate: (value: string | null | undefined) => string;
  /** Inclusive date range (YYYY-MM-DD), e.g. "Sep 07 – Sep 13, 2026" / "07 set. – 13 set. 2026". */
  formatDateRange: (from: string, to: string) => string;
  /** Short month name of a UTC date, e.g. "Sep" / "set". */
  formatMonthShort: (date: Date) => string;
}

const cache = new Map<Locale, Formatters>();

export function createFormatters(locale: Locale): Formatters {
  const cached = cache.get(locale);
  if (cached) return cached;

  const numberLocale = NUMBER_LOCALE[locale];
  const currencyFormatters = new Map<string, Intl.NumberFormat>();
  const percent = new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const date = new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  // Standalone month names use the number locale so English stays "Sep" (en-GB would give "Sept").
  const month = new Intl.DateTimeFormat(numberLocale, { month: "short", timeZone: "UTC" });
  const numbers = new Map<string, Intl.NumberFormat>();
  const decimals = new Map<number, Intl.NumberFormat>();

  function currencyFormatter(currency: string, compact: boolean): Intl.NumberFormat {
    const key = `${currency}:${compact}`;
    const hit = currencyFormatters.get(key);
    if (hit) return hit;
    const fmt = new Intl.NumberFormat(numberLocale, {
      style: "currency",
      currency: currency || "USD",
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
      minimumFractionDigits: compact ? 0 : 2,
    });
    currencyFormatters.set(key, fmt);
    return fmt;
  }

  const formatters: Formatters = {
    formatMoney(value, currency = "USD", compact = true) {
      return currencyFormatter(currency, compact).format(value ?? 0);
    },

    formatNumber(value, compact = true) {
      const n = value ?? 0;
      const useCompact = compact && Math.abs(n) >= 10000;
      const key = `${compact}:${useCompact}`;
      let fmt = numbers.get(key);
      if (!fmt) {
        fmt = new Intl.NumberFormat(numberLocale, {
          notation: useCompact ? "compact" : "standard",
          maximumFractionDigits: compact ? 1 : 0,
        });
        numbers.set(key, fmt);
      }
      return fmt.format(n);
    },

    formatPercent(value, fromRatio = true) {
      if (value === null || value === undefined || Number.isNaN(value)) return "—";
      return `${percent.format(fromRatio ? value * 100 : value)}%`;
    },

    formatDecimal(value, digits = 1) {
      let fmt = decimals.get(digits);
      if (!fmt) {
        fmt = new Intl.NumberFormat(numberLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
        decimals.set(digits, fmt);
      }
      return fmt.format(value);
    },

    formatDate(value) {
      if (!value) return "—";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return value;
      return `${date.format(d)} UTC`;
    },

    formatDateRange(from, to) {
      const start = new Date(`${from}T00:00:00Z`);
      const end = new Date(`${to}T00:00:00Z`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${from} – ${to}`;
      const dayMonth = (d: Date) => {
        const day = String(d.getUTCDate()).padStart(2, "0");
        return locale === "pt" ? `${day} ${month.format(d)}` : `${month.format(d)} ${day}`;
      };
      const sep = locale === "pt" ? " " : ", ";
      return `${dayMonth(start)} – ${dayMonth(end)}${sep}${end.getUTCFullYear()}`;
    },

    formatMonthShort: (d) => month.format(d),
  };

  cache.set(locale, formatters);
  return formatters;
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
