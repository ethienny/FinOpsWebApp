// Shown in place of a page whose module is outside the current plan. Explains
// what the module delivers and which plan unlocks it. The gate itself runs on
// the server, so typing the URL does not bypass it.

import { Lock } from "lucide-react";
import { MODULE_INFO, PLAN_LABELS, planRequiredFor } from "@/lib/entitlements/catalog";
import type { Entitlements, Module } from "@/types/entitlements";

export function ModuleLocked({ module, entitlements }: { module: Module; entitlements: Entitlements }) {
  const info = MODULE_INFO[module];
  const required = PLAN_LABELS[planRequiredFor(module)];
  return (
    <section className="card-surface mx-auto max-w-2xl p-8 text-center">
      <Lock className="mx-auto h-8 w-8 text-cyan-300" />
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-cyan-300">Available on {required}</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{info.label}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">{info.summary}</p>
      <p className="mt-6 text-xs text-slate-400">
        Your current plan is {entitlements.planLabel}. In this emulation, switch plans from the sidebar to preview the module.
      </p>
    </section>
  );
}
