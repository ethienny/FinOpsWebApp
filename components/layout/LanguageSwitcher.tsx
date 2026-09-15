"use client";

// EN / PT toggle. Submits the locale server action, then refreshes the
// router so every server-rendered page picks up the new cookie immediately.

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/actions";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/cn";

const OPTIONS: Array<{ code: Locale; label: string }> = [
  { code: "en", label: "EN" },
  { code: "pt", label: "PT" },
];

export function LanguageSwitcher() {
  const { locale, dict } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(code: Locale) {
    if (code === locale || pending) return;
    const formData = new FormData();
    formData.set("locale", code);
    startTransition(async () => {
      await setLocale(formData);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={dict.shell.languageSwitcher.aria}
      className="flex items-center gap-0.5 rounded-lg border border-white/10 p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => choose(option.code)}
          disabled={pending}
          aria-pressed={locale === option.code}
          className={cn(
            "rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide disabled:opacity-60",
            locale === option.code ? "bg-cyan-400/10 text-cyan-100" : "text-slate-400 hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
