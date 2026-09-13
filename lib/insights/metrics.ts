// Aggregations over insight rows for the pages: aging summary, savings by age
// bucket and the quick wins list. Pure functions.

import type { AgeBucket, AgingSummary, InsightRow, NamedValue } from "@/types/finops";
import { AGE_LABELS } from "./aging";

const BUCKETS: AgeBucket[] = ["new", "recurring", "persistent"];

/** Cost of inaction figures over actionable rows in the scope. */
export function agingSummary(rows: InsightRow[]): AgingSummary {
  const actionable = rows.filter((r) => r.IsActionable && r.runsOpen > 0);
  const runs = actionable.reduce((a, r) => a + r.runsOpen, 0);
  return {
    missedSavings: actionable.reduce((a, r) => a + r.missedSavings, 0),
    persistentCount: actionable.filter((r) => r.ageBucket === "persistent").length,
    newCount: actionable.filter((r) => r.ageBucket === "new").length,
    averageRunsOpen: actionable.length ? runs / actionable.length : 0,
    actionableCount: actionable.length,
  };
}

/** PRICED savings of actionable rows per age bucket, in bucket order. */
export function savingsByAge(rows: InsightRow[]): NamedValue[] {
  return BUCKETS.map((bucket) => ({
    name: AGE_LABELS[bucket],
    value: rows
      .filter((r) => r.IsActionable && r.runsOpen > 0 && r.ageBucket === bucket && r.SavingsReliability === "PRICED")
      .reduce((a, r) => a + (r.EstimatedMonthlySavings ?? 0), 0),
  }));
}

/** Quick wins by score, highest first. */
export function topQuickWins<T extends InsightRow>(rows: T[], limit = 10): T[] {
  return rows
    .filter((r) => r.isQuickWin)
    .sort((a, b) => b.quickWinScore - a.quickWinScore || (b.EstimatedMonthlySavings ?? 0) - (a.EstimatedMonthlySavings ?? 0))
    .slice(0, limit);
}
