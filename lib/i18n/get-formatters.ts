// Server-side counterpart of useFormatters(): formatters bound to the
// request's locale, for server components and pages.

import { createFormatters, type Formatters } from "@/lib/formatters";
import { getLocale } from "./get-locale";

export async function getFormatters(): Promise<Formatters> {
  return createFormatters(await getLocale());
}
