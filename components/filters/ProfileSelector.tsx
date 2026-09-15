"use client";

// Sizing profile switch. Writes the chosen profile to the query string so the
// sizing page renders that profile on the server.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SizingProfile } from "@/types/finops";
import { cn } from "@/lib/cn";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

const PROFILES: SizingProfile[] = ["Conservative", "Moderate", "Aggressive"];

export function ProfileSelector({ value }: { value: SizingProfile }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const dict = useDictionary();

  function setProfile(profile: SizingProfile) {
    const next = new URLSearchParams(sp.toString());
    next.set("profile", profile);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-navy-900 p-1">
      {PROFILES.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setProfile(p)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium",
            value === p ? "bg-cyan-400/15 text-cyan-100" : "text-slate-400 hover:text-white",
          )}
        >
          {dict.sizing.profiles[p]}
        </button>
      ))}
    </div>
  );
}
