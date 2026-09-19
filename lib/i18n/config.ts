// Supported locales for the webapp. Mirrors the two languages offered by the
// institutional site (English source, Portuguese translation).

export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "finops_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale from an Accept-Language header. Tags are
 * ranked by their q weight (ties keep header order) and the first one whose
 * primary subtag is supported wins, so "en-US,en;q=0.9,pt;q=0.8" is English
 * while "fr,pt-BR;q=0.7" falls through to Portuguese.
 */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.toLowerCase().startsWith("q="));
      const weight = q === undefined ? 1 : Number(q.slice(2));
      return { primary: tag.trim().toLowerCase().split("-")[0], weight, index };
    })
    .filter((entry) => entry.primary && entry.primary !== "*" && Number.isFinite(entry.weight) && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);

  // Only the primary subtag matters: "pt" covers pt-BR and pt-PT alike.
  return ranked.map((entry) => entry.primary).find(isLocale) ?? DEFAULT_LOCALE;
}
