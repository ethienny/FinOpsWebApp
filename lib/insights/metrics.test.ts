// Aggregations used by the Insights page and the executive report.

import { describe, expect, it } from "vitest";
import type { InsightRow } from "@/types/finops";
import { agingSummary, metricCoverageSummary, savingsByAge, topQuickWins } from "./metrics";

function row(id: string, overrides: Partial<InsightRow> = {}): InsightRow {
  return {
    ResourceId: id,
    ResourceName: id,
    ResourceGroup: "rg",
    ServiceType: "Virtual Machine",
    TenantName: "t",
    SubscriptionName: "s",
    Location: "eastus",
    MonthlyCost: 1000,
    CostCurrency: "USD",
    ActionLabel: "Rightsize",
    ActionSummary: "",
    Priority: "HIGH",
    Confidence: "HIGH",
    SavingsReliability: "PRICED",
    EstimatedMonthlySavings: 100,
    RiskAdjustedMonthlySavings: 100,
    MetricCollectionStatus: "COMPLETE",
    MetricCoverageRatio: 1,
    RecommendationAction: "Rightsize",
    IsActionable: true,
    IsDestructive: false,
    PerformanceRisk: "Low",
    TagOwner: "",
    TagEnvironment: "",
    runsOpen: 1,
    daysOpen: 0,
    missedSavings: 0,
    ageBucket: "new",
    ageLabel: "New",
    firstDetectedRunId: "r1",
    firstDetectedAt: "",
    valueRank: 1,
    quickWinScore: 90,
    executionRisk: "low",
    executionRiskScore: 10,
    riskLabel: "Low",
    isQuickWin: true,
    ...overrides,
  };
}

describe("agingSummary and savingsByAge", () => {
  const rows = [
    row("a", { runsOpen: 6, ageBucket: "persistent", missedSavings: 50 }),
    row("b", { runsOpen: 2, ageBucket: "recurring", missedSavings: 10 }),
    row("c", { runsOpen: 1, ageBucket: "new" }),
    row("n", { IsActionable: false, runsOpen: 0, missedSavings: 999 }),
    row("h", { SavingsReliability: "HEURISTIC", runsOpen: 6, ageBucket: "persistent", EstimatedMonthlySavings: 500 }),
  ];

  it("summarises actionable rows only", () => {
    const s = agingSummary(rows);
    expect(s.actionableCount).toBe(4);
    expect(s.missedSavings).toBe(60);
    expect(s.persistentCount).toBe(2);
    expect(s.newCount).toBe(1);
    expect(s.averageRunsOpen).toBeCloseTo((6 + 2 + 1 + 6) / 4, 6);
  });

  it("buckets PRICED savings by age and ignores heuristic values", () => {
    expect(savingsByAge(rows)).toEqual([
      { name: "New", value: 100 },
      { name: "Recurring", value: 100 },
      { name: "Persistent", value: 100 },
    ]);
  });
});

describe("topQuickWins", () => {
  it("orders quick wins by score, then savings, and respects the limit", () => {
    const rows = [
      row("low", { quickWinScore: 70 }),
      row("tie-small", { quickWinScore: 90, EstimatedMonthlySavings: 10 }),
      row("tie-big", { quickWinScore: 90, EstimatedMonthlySavings: 500 }),
      row("not", { isQuickWin: false, quickWinScore: 99 }),
    ];
    expect(topQuickWins(rows, 2).map((r) => r.ResourceId)).toEqual(["tie-big", "tie-small"]);
  });
});

describe("metricCoverageSummary", () => {
  it("counts collection status and the PRICED share resting on partial metrics", () => {
    const s = metricCoverageSummary([
      row("a", { MetricCollectionStatus: "COMPLETE", EstimatedMonthlySavings: 300 }),
      row("b", { MetricCollectionStatus: "PARTIAL", EstimatedMonthlySavings: 100 }),
      row("c", { MetricCollectionStatus: "NOT_APPLICABLE", EstimatedMonthlySavings: 50, SavingsReliability: "HEURISTIC" }),
    ]);
    expect(s).toEqual({ complete: 1, partial: 1, notApplicable: 1, pricedOnPartialShare: 0.25 });
  });
});
