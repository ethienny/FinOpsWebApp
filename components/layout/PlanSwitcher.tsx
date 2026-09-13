"use client";

// Demo control in the sidebar: switches the active plan so the same customer
// can be shown on Starter, Pro or Enterprise during a sales conversation.

import { setPlan } from "@/app/actions/plan";
import { PLAN_LABELS, PLANS } from "@/lib/entitlements/catalog";
import type { Plan } from "@/types/entitlements";

export function PlanSwitcher({ plan }: { plan: Plan }) {
  return (
    // Keyed on the plan so the form remounts with the stored value once the
    // server action revalidates; React resets the form before that arrives.
    <form key={plan} action={setPlan} className="flex items-center justify-between gap-2">
      <label htmlFor="plan-switcher" className="text-slate-400">
        Plan <span className="text-slate-500">(demo)</span>
      </label>
      <select
        id="plan-switcher"
        name="plan"
        defaultValue={plan}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-white/10 bg-navy-900 px-2 py-1 text-xs text-cyan-100"
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {PLAN_LABELS[p]}
          </option>
        ))}
      </select>
    </form>
  );
}
