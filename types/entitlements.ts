// Product packaging: plans, the modules each plan includes and its limits.
// These types describe the offer, not the FinOps data.

export type Plan = "assessment" | "starter" | "pro" | "enterprise" | "partner";

export type Module = "core" | "tracking" | "insights" | "showback" | "sizing" | "governance";

export interface PlanLimits {
  /** Maximum subscriptions covered, or null when unlimited. */
  maxSubscriptions: number | null;
}

export interface Entitlements {
  plan: Plan;
  planLabel: string;
  modules: Module[];
  limits: PlanLimits;
  /** Where the plan came from: the demo switcher, the environment or the default. */
  source: "state" | "env" | "default";
}
