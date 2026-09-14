// Plan catalog. Which modules each plan unlocks, what each module covers and
// the plan limits. Pure data and helpers, unit tested. No plan hides savings:
// plans differ in depth, governance and scale.

import type { Entitlements, Module, Plan, PlanLimits } from "@/types/entitlements";

export const PLANS: readonly Plan[] = ["assessment", "starter", "pro", "enterprise", "partner"];

export const PLAN_LABELS: Record<Plan, string> = {
  assessment: "Assessment",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
  partner: "Partner",
};

export const MODULE_INFO: Record<Module, { label: string; summary: string; pages: string[] }> = {
  core: {
    label: "Insights core",
    summary: "Executive view, opportunities with validated savings and the full resource inventory.",
    pages: ["/", "/opportunities", "/resources"],
  },
  tracking: {
    label: "Tracking",
    summary: "Record what the team decided on each recommendation and prove the savings realized.",
    pages: ["/tracking"],
  },
  insights: {
    label: "Insights",
    summary: "What changed since the previous run, cost of inaction across runs and quick wins ranked by value and execution risk.",
    pages: ["/insights", "/changes"],
  },
  anomalies: {
    label: "Cost anomalies",
    summary: "Weekly report of the anomaly alerting: notified and suppressed alerts, coverage and routing governance.",
    pages: ["/anomalies"],
  },
  showback: {
    label: "Showback",
    summary: "Cost allocation by owner, cost center, application and environment.",
    pages: ["/showback"],
  },
  sizing: {
    label: "Sizing",
    summary: "Conservative, moderate and aggressive rightsizing profiles with performance risk.",
    pages: ["/sizing"],
  },
  governance: {
    label: "Governance",
    summary: "Engine health, run history and data quality across executions.",
    pages: ["/engine-health", "/run-history"],
  },
};

const PLAN_MODULES: Record<Plan, Module[]> = {
  assessment: ["core"],
  starter: ["core", "tracking", "insights"],
  pro: ["core", "tracking", "insights", "anomalies", "showback", "sizing"],
  enterprise: ["core", "tracking", "insights", "anomalies", "showback", "sizing", "governance"],
  partner: ["core", "tracking", "insights", "anomalies", "showback", "sizing", "governance"],
};

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  assessment: { maxSubscriptions: 1 },
  starter: { maxSubscriptions: 5 },
  pro: { maxSubscriptions: null },
  enterprise: { maxSubscriptions: null },
  partner: { maxSubscriptions: null },
};

export function isPlan(value: unknown): value is Plan {
  return typeof value === "string" && (PLANS as readonly string[]).includes(value);
}

export function entitlementsFor(plan: Plan, source: Entitlements["source"]): Entitlements {
  return { plan, planLabel: PLAN_LABELS[plan], modules: PLAN_MODULES[plan], limits: PLAN_LIMITS[plan], source };
}

export function hasModule(entitlements: Entitlements, module: Module): boolean {
  return entitlements.modules.includes(module);
}

/** Lowest plan that unlocks the module, used by the locked page and the menu. */
export function planRequiredFor(module: Module): Plan {
  return PLANS.find((plan) => PLAN_MODULES[plan].includes(module)) ?? "enterprise";
}

/** Module that owns a route, or null for routes that are always available. */
export function moduleForPath(pathname: string): Module | null {
  for (const [module, info] of Object.entries(MODULE_INFO) as Array<[Module, (typeof MODULE_INFO)[Module]]>) {
    if (info.pages.some((page) => (page === "/" ? pathname === "/" : pathname === page || pathname.startsWith(`${page}/`)))) {
      return module;
    }
  }
  return null;
}

/** True when the scope has more subscriptions than the plan covers. */
export function exceedsSubscriptionLimit(entitlements: Entitlements, subscriptionCount: number): boolean {
  const max = entitlements.limits.maxSubscriptions;
  return max !== null && subscriptionCount > max;
}
