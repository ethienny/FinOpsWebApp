"use client";

// Makes the locale and its resolved dictionary available to client
// components, which cannot call the server-only cookies()/headers() lookup
// in ./get-locale.ts. The root layout resolves both once per request and
// passes them down through this provider; server components (pages) instead
// call getDictionary(await getLocale()) directly.

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionary";

const LocaleContext = createContext<{ locale: Locale; dict: Dictionary } | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, dict }), [locale, dict]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}

/** Convenience hook for client components that only need the dictionary. */
export function useDictionary() {
  return useLocale().dict;
}
