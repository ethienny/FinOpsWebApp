"use client";

// Scope of the anomalies page. The values come from the alert history, not
// from the FinOps inventory, so the page has its own bar in the shell.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { X } from "lucide-react";
import type { AnomalyFilterOptions } from "@/types/anomalies";
import { routingLabel } from "@/lib/anomalies/metrics";

const FIELDS: Array<{ key: string; label: string; optionKey: keyof AnomalyFilterOptions; render?: (v: string) => string }> = [
  { key: "subscription", label: "Subscription", optionKey: "subscriptions" },
  { key: "service", label: "Service", optionKey: "services" },
  { key: "routing", label: "Routing Source", optionKey: "routingSources", render: routingLabel },
  { key: "attribution", label: "Attribution", optionKey: "attributionStatuses", render: (v) => v.replace(/_/g, " ") },
];

export function AnomalyFilterBar({ options }: { options: AnomalyFilterOptions }) {
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
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
                  {field.render ? field.render(v) : v}
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
            {f.label}: {f.render ? f.render(f.value) : f.value}
            <X className="h-3 w-3" />
          </button>
        ))}
        {active.length ? (
          <button type="button" onClick={() => router.replace(pathname)} className="text-xs text-slate-400 hover:text-white">
            Clear Filters
          </button>
        ) : (
          <span className="text-xs text-slate-500">Whole reported week</span>
        )}
      </div>
    </div>
  );
}
