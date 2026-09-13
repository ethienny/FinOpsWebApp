// Pure helpers that overlay recommendation decisions on FinOps rows and derive
// the tracking KPIs. No I/O here, so the rules can be unit tested directly.

import type {
  DecisionSavings,
  DecisionStatus,
  OpportunityRow,
  RecommendationDecision,
  ResourceSummary,
} from "@/types/finops";

export const DECISION_STATUSES = ["open", "accepted", "in_progress", "done", "dismissed"] as const;

export const DECISION_LABELS: Record<DecisionStatus, string> = {
  open: "Open",
  accepted: "Accepted",
  in_progress: "In progress",
  done: "Done",
  dismissed: "Dismissed",
};

const IN_PROGRESS: readonly DecisionStatus[] = ["accepted", "in_progress"];

export function decisionsByResource(decisions: RecommendationDecision[]): Map<string, RecommendationDecision> {
  return new Map(decisions.map((d) => [d.resourceId, d]));
}

/** Adds the decision fields to each row. Rows without a decision are open. */
export function applyDecisions(
  rows: ResourceSummary[],
  decisions: Map<string, RecommendationDecision>,
): OpportunityRow[] {
  return rows.map((row) => {
    const decision = decisions.get(row.ResourceId);
    const status = decision?.status ?? "open";
    return {
      ...row,
      decisionStatus: status,
      decisionLabel: DECISION_LABELS[status],
      decisionOwner: decision?.owner ?? "",
    };
  });
}

/**
 * Savings tracked through decisions. Only PRICED savings are summed, matching
 * the executive rule that heuristic values never enter an official total.
 * Dismissed and open rows contribute nothing to either amount.
 */
export function decisionSavings(
  rows: ResourceSummary[],
  decisions: Map<string, RecommendationDecision>,
): DecisionSavings {
  let inProgress = 0;
  let realized = 0;
  let decided = 0;
  for (const row of rows) {
    const decision = decisions.get(row.ResourceId);
    if (!decision || decision.status === "open") continue;
    decided += 1;
    if (row.SavingsReliability !== "PRICED") continue;
    const savings = row.EstimatedMonthlySavings ?? 0;
    if (IN_PROGRESS.includes(decision.status)) inProgress += savings;
    else if (decision.status === "done") realized += savings;
  }
  return { inProgress, realized, decided };
}
