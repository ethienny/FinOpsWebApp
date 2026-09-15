"use server";

// Server action behind the language switcher. Stores the chosen locale in a
// cookie so every subsequent request (server and client) renders in it.

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "./config";

export async function setLocale(formData: FormData): Promise<void> {
  const locale = formData.get("locale");
  if (!isLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
