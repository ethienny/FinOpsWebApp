"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { FilterOptions } from "@/types/finops";
import { X } from "lucide-react";

const FIELDS: Array<{ key: string; label: string; optionKey: keyof FilterOptions }> = [
  { key: "tenant", label: "Tenant", optionKey: "tenants" },
  { key: "subscription", label: "Subscription", optionKey: "subscriptions" },
  { key: "serviceType", label: "Service Type", optionKey: "serviceTypes" },
  { key: "priority", label: "Priority", optionKey: "priorities" },
  { key: "owner", label: "Owner", optionKey: "owners" },
  { key: "environment", label: "Environment", optionKey: "environments" },
  { key: "costCenter", label: "Cost Center", optionKey: "costCenters" },
];

export function FilterBar({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const active = useMemo(
    () => FIELDS.map((f) => ({ ...f, value: sp.get(f.key) || "" })).filter((f) => f.value),
    [sp],
  );

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearAll() {
    const keep = new URLSearchParams();
    const profile = sp.get("profile");
    const runA = sp.get("runA");
    const runB = sp.get("runB");
    if (profile) keep.set("profile", profile);
    if (runA) keep.set("runA", runA);
    if (runB) keep.set("runB", runB);
    const qs = keep.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-7">
        {FIELDS.map((field) => (
          <label key={field.key} className="block text-[11px] uppercase tracking-wide text-slate-400">
            {field.label}
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-navy-900 px-2 py-1.5 text-xs text-slate-100"
              value={sp.get(field.key) || ""}
              onChange={(e) => setParam(field.key, e.target.value)}
            >
              <option value="">All</option>
              {options[field.optionKey].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {active.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setParam(f.key, "")}
            className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-100"
          >
            {f.label}: {f.value}
            <X className="h-3 w-3" />
          </button>
        ))}
        {active.length ? (
          <button type="button" onClick={clearAll} className="text-xs text-slate-400 hover:text-white">
            Clear Filters
          </button>
        ) : (
          <span className="text-xs text-slate-500">No global filters applied</span>
        )}
      </div>
    </div>
  );
}
