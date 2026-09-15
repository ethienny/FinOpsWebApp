import { en } from "./dictionaries/en";
import { pt } from "./dictionaries/pt";
import type { Locale } from "./config";
import type { Widen } from "./dictionaries/widen";

export type Dictionary = Widen<typeof en>;

const dictionaries: Record<Locale, Dictionary> = { en, pt };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
