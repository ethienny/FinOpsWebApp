// Quick win scoring. Combines how much a recommendation is worth with how safe
// it is to execute, so the most valuable low risk actions surface first.
// Pure functions, unit tested.

import type { ExecutionRisk, ResourceSummary } from "@/types/finops";

export interface ScoreFields {
  valueRank: number;
  quickWinScore: number;
  executionRisk: ExecutionRisk;
  executionRiskScore: number;
  riskLabel: string;
  isQuickWin: boolean;
}

export const RISK_LABELS: Record<ExecutionRisk, string> = { low: "Low", medium: "Medium", high: "High" };

function confidenceFactor(confidence: string): number {
  const v = confidence.toUpperCase();
  if (v === "HIGH") return 1;
  if (v === "MEDIUM") return 0.6;
  if (v === "LOW") return 0.3;
  return 0.5;
}

function performanceFactor(risk: string): number {
  const v = risk.toLowerCase();
  if (v === "low") return 1;
  if (v === "medium") return 0.6;
  if (v === "high") return 0.2;
  return 0.7;
}

function coverageFactor(row: ResourceSummary): number {
  if (row.MetricCoverageRatio !== null && row.MetricCoverageRatio !== undefined) {
    return Math.min(1, Math.max(0, row.MetricCoverageRatio));
  }
  return row.MetricCollectionStatus === "NOT_APPLICABLE" ? 0.8 : 0.5;
}

/** Share of execution safety, 0 to 1, from confidence, performance risk, metric coverage and destructiveness. */
export function safetyScore(row: ResourceSummary): number {
  const destructive = row.IsDestructive ? 0.4 : 1;
  return (confidenceFactor(row.Confidence) + performanceFactor(row.PerformanceRisk) + coverageFactor(row) + destructive) / 4;
}

export function executionRisk(safety: number): ExecutionRisk {
  if (safety >= 0.75) return "low";
  if (safety >= 0.5) return "medium";
  return "high";
}

function valueOf(row: ResourceSummary): number {
  return row.RiskAdjustedMonthlySavings ?? row.EstimatedMonthlySavings ?? 0;
}

function isCandidate(row: ResourceSummary): boolean {
  return row.IsActionable && row.SavingsReliability === "PRICED" && valueOf(row) > 0;
}

/**
 * Scores every row in the scope. The value rank is the percentile of the risk
 * adjusted savings among PRICED actionable rows, so the score is relative to
 * the current scope. Rows that are not PRICED candidates rank at zero.
 */
export function scoreRows<T extends ResourceSummary>(rows: T[]): Array<T & ScoreFields> {
  const values = rows.filter(isCandidate).map(valueOf).sort((a, b) => a - b);
  const n = values.length;
  const rankOf = (value: number): number => {
    if (n <= 1) return n === 1 ? 1 : 0;
    let below = 0;
    while (below < n && values[below] < value) below += 1;
    return below / (n - 1);
  };
  return rows.map((row) => {
    const candidate = isCandidate(row);
    const valueRank = candidate ? Math.min(1, rankOf(valueOf(row))) : 0;
    const safety = safetyScore(row);
    const risk = executionRisk(safety);
    return {
      ...row,
      valueRank,
      quickWinScore: Math.round(100 * (0.5 * valueRank + 0.5 * safety)),
      executionRisk: risk,
      executionRiskScore: Math.round(100 * (1 - safety)),
      riskLabel: RISK_LABELS[risk],
      isQuickWin: candidate && risk === "low" && valueRank >= 0.5,
    };
  });
}
