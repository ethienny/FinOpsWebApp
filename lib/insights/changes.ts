// What changed between the latest complete run and the one before it. Pure
// functions over the recommendation history, unit tested without data files.
// Savings comparisons use PRICED estimates only.

import type {
  ChangeFields,
  ChangeKind,
  ChangeSummary,
  FinOpsRecommendation,
  FinOpsRun,
  ResourceChange,
  RunTotals,
} from "@/types/finops";
import { eligibleRuns } from "./aging";

/** A savings move counts when it exceeds both the share and the absolute floor. */
const MATERIAL_SAVINGS_SHARE = 0.05;
const MATERIAL_SAVINGS_FLOOR = 1;

export const CHANGE_LABELS: Record<ChangeKind, string> = {
  new: "New",
  resolved: "Resolved",
  action_changed: "Action changed",
  reliability_changed: "Reliability changed",
  savings_changed: "Savings changed",
};

export const CHANGE_KINDS: readonly ChangeKind[] = ["new", "resolved", "action_changed", "reliability_changed", "savings_changed"];

/** Complete full scope run right before the latest one, or null when there is none. */
export function previousEligibleRun(runs: FinOpsRun[], latestRunId: string): FinOpsRun | null {
  const eligible = eligibleRuns(runs, latestRunId);
  return eligible.length >= 2 ? eligible[eligible.length - 2] : null;
}

function pricedSavings(row: FinOpsRecommendation | undefined): number {
  if (!row || row.SavingsReliability !== "PRICED") return 0;
  return row.EstimatedMonthlySavings ?? 0;
}

function isMaterial(previous: number, current: number): boolean {
  const delta = Math.abs(current - previous);
  return delta >= MATERIAL_SAVINGS_FLOOR && delta >= Math.abs(previous) * MATERIAL_SAVINGS_SHARE;
}

function classify(current: FinOpsRecommendation | undefined, previous: FinOpsRecommendation | undefined): ChangeKind | null {
  const nowActionable = Boolean(current?.IsActionable);
  const wasActionable = Boolean(previous?.IsActionable);
  if (nowActionable && !wasActionable) return "new";
  if (wasActionable && !nowActionable) return "resolved";
  if (!nowActionable || !wasActionable || !current || !previous) return null;
  if (current.RecommendationAction !== previous.RecommendationAction) return "action_changed";
  if (current.SavingsReliability !== previous.SavingsReliability) return "reliability_changed";
  if (current.SavingsReliability === "PRICED" && isMaterial(pricedSavings(previous), pricedSavings(current))) {
    return "savings_changed";
  }
  return null;
}

/**
 * Compares the rows of two runs resource by resource. A resource that is
 * actionable on both runs with the same action, reliability and a stable
 * estimate is unchanged and left out.
 */
export function diffRuns(current: FinOpsRecommendation[], previous: FinOpsRecommendation[]): ResourceChange[] {
  const currentById = new Map(current.map((r) => [r.ResourceId, r]));
  const previousById = new Map(previous.map((r) => [r.ResourceId, r]));
  const ids = new Set([...currentById.keys(), ...previousById.keys()]);

  const result: ResourceChange[] = [];
  for (const resourceId of ids) {
    const now = currentById.get(resourceId);
    const before = previousById.get(resourceId);
    const kind = classify(now, before);
    if (!kind) continue;
    const previousSavings = pricedSavings(before);
    const currentSavings = pricedSavings(now);
    result.push({
      resourceId,
      kind,
      previousAction: before?.RecommendationAction ?? "",
      currentAction: now?.RecommendationAction ?? "",
      previousReliability: before?.SavingsReliability ?? "",
      currentReliability: now?.SavingsReliability ?? "",
      previousSavings,
      currentSavings,
      savingsDelta: currentSavings - previousSavings,
    });
  }
  return result;
}

/** Validated savings, actionable count and cost of one run in the scope. */
export function runTotals(rows: FinOpsRecommendation[]): RunTotals {
  return {
    validatedSavings: rows.reduce((a, r) => a + pricedSavings(r), 0),
    actionableCount: rows.filter((r) => r.IsActionable).length,
    monthlyCost: rows.reduce((a, r) => a + (r.MonthlyCost ?? 0), 0),
  };
}

/** Counts and PRICED savings per change kind. */
export function changeSummary(rows: ChangeFields[]): ChangeSummary {
  const summary: ChangeSummary = {
    newCount: 0,
    newSavings: 0,
    resolvedCount: 0,
    resolvedSavings: 0,
    actionChangedCount: 0,
    reliabilityChangedCount: 0,
    savingsChangedCount: 0,
    savingsChangedDelta: 0,
  };
  for (const row of rows) {
    switch (row.changeKind) {
      case "new":
        summary.newCount += 1;
        summary.newSavings += row.previousSavings + row.savingsDelta;
        break;
      case "resolved":
        summary.resolvedCount += 1;
        summary.resolvedSavings += row.previousSavings;
        break;
      case "action_changed":
        summary.actionChangedCount += 1;
        break;
      case "reliability_changed":
        summary.reliabilityChangedCount += 1;
        break;
      case "savings_changed":
        summary.savingsChangedCount += 1;
        summary.savingsChangedDelta += row.savingsDelta;
        break;
    }
  }
  return summary;
}
