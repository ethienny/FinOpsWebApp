// Server-side locale resolution: the cookie set by the language switcher
// wins, otherwise the browser's Accept-Language header decides, defaulting
// to English.

import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, pickLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  return pickLocale((await headers()).get("accept-language"));
}
