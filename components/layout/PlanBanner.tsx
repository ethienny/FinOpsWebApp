// Warns when the scope has more subscriptions than the plan covers. Data is
// never cut silently: the banner names the limit and the plan that lifts it.

import { PLAN_LABELS } from "@/lib/entitlements/catalog";
import type { Entitlements } from "@/types/entitlements";

export function PlanBanner({ entitlements, subscriptionCount }: { entitlements: Entitlements; subscriptionCount: number }) {
  const max = entitlements.limits.maxSubscriptions;
  if (max === null || subscriptionCount <= max) return null;
  const next = entitlements.plan === "assessment" ? PLAN_LABELS.starter : PLAN_LABELS.pro;
  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-100">
      The {entitlements.planLabel} plan covers up to {max} {max === 1 ? "subscription" : "subscriptions"}; this workspace has{" "}
      {subscriptionCount}. Figures below include every subscription for the emulation. {next} removes the limit.
    </div>
  );
}
