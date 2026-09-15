"use client";

// Run comparison picker of the run history page. Writes runA and runB to the
// query string.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FinOpsRun } from "@/types/finops";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

export function RunComparePicker({ runs, runA, runB }: { runs: FinOpsRun[]; runA?: string; runB?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const dict = useDictionary().runHistory.comparison;

  function set(key: "runA" | "runB", value: string) {
    const next = new URLSearchParams(sp.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <label className="text-xs text-slate-400">
        {dict.runA}
        <select
          className="mt-1 block rounded-lg border border-white/10 bg-navy-900 px-2 py-2 text-sm text-white"
          value={runA ?? ""}
          onChange={(e) => set("runA", e.target.value)}
        >
          <option value="">{dict.select}</option>
          {runs.map((r) => (
            <option key={r.RunId} value={r.RunId}>
              {r.RunId}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-400">
        {dict.runB}
        <select
          className="mt-1 block rounded-lg border border-white/10 bg-navy-900 px-2 py-2 text-sm text-white"
          value={runB ?? ""}
          onChange={(e) => set("runB", e.target.value)}
        >
          <option value="">{dict.select}</option>
          {runs.map((r) => (
            <option key={r.RunId} value={r.RunId}>
              {r.RunId}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
