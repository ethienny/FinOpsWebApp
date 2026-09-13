// Rules for the quick win score and execution risk.

import { describe, expect, it } from "vitest";
import type { ResourceSummary } from "@/types/finops";
import { executionRisk, safetyScore, scoreRows } from "./score";

function row(id: string, overrides: Partial<ResourceSummary> = {}): ResourceSummary {
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
    ...overrides,
  };
}

describe("safetyScore and executionRisk", () => {
  it("is 1 for a high confidence, low risk, fully covered, non destructive action", () => {
    expect(safetyScore(row("a"))).toBe(1);
    expect(executionRisk(1)).toBe("low");
  });

  it("drops with destructive actions, low confidence and poor coverage", () => {
    const risky = row("a", { IsDestructive: true, Confidence: "LOW", MetricCoverageRatio: 0.2, PerformanceRisk: "High" });
    const safety = safetyScore(risky);
    expect(safety).toBeCloseTo((0.3 + 0.2 + 0.2 + 0.4) / 4, 6);
    expect(executionRisk(safety)).toBe("high");
  });

  it("uses a neutral coverage when the ratio is missing", () => {
    expect(safetyScore(row("a", { MetricCoverageRatio: null, MetricCollectionStatus: "NOT_APPLICABLE" }))).toBeCloseTo(0.95, 6);
    expect(safetyScore(row("a", { MetricCoverageRatio: null, MetricCollectionStatus: "PARTIAL" }))).toBeCloseTo(0.875, 6);
  });
});

describe("scoreRows", () => {
  it("ranks value among PRICED actionable rows and flags quick wins in the safe upper half", () => {
    const rows = scoreRows([
      row("low", { RiskAdjustedMonthlySavings: 10 }),
      row("mid", { RiskAdjustedMonthlySavings: 50 }),
      row("high", { RiskAdjustedMonthlySavings: 500 }),
    ]);
    const byId = Object.fromEntries(rows.map((r) => [r.ResourceId, r]));
    expect(byId.low.valueRank).toBe(0);
    expect(byId.mid.valueRank).toBe(0.5);
    expect(byId.high.valueRank).toBe(1);
    expect(byId.high.quickWinScore).toBe(100);
    expect(byId.low.isQuickWin).toBe(false);
    expect(byId.mid.isQuickWin).toBe(true);
    expect(byId.high.isQuickWin).toBe(true);
  });

  it("never flags HEURISTIC, non actionable or risky rows as quick wins", () => {
    // Three PRICED actionable candidates rank the value: risky (top), ok (middle), low (bottom).
    const rows = scoreRows([
      row("h", { SavingsReliability: "HEURISTIC", RiskAdjustedMonthlySavings: 99999 }),
      row("n", { IsActionable: false, RiskAdjustedMonthlySavings: 99999 }),
      row("risky", { IsDestructive: true, Confidence: "LOW", RiskAdjustedMonthlySavings: 9999 }),
      row("ok", { RiskAdjustedMonthlySavings: 5000 }),
      row("low", { RiskAdjustedMonthlySavings: 10 }),
    ]);
    const byId = Object.fromEntries(rows.map((r) => [r.ResourceId, r]));
    expect(byId.h.valueRank).toBe(0);
    expect(byId.h.isQuickWin).toBe(false);
    expect(byId.n.isQuickWin).toBe(false);
    expect(byId.risky.valueRank).toBe(1);
    expect(byId.risky.isQuickWin).toBe(false);
    expect(byId.ok.valueRank).toBe(0.5);
    expect(byId.ok.isQuickWin).toBe(true);
    expect(byId.low.isQuickWin).toBe(false);
  });

  it("falls back to the estimated savings when the risk adjusted value is missing", () => {
    const [only] = scoreRows([row("a", { RiskAdjustedMonthlySavings: null, EstimatedMonthlySavings: 40 })]);
    expect(only.valueRank).toBe(1);
    expect(only.isQuickWin).toBe(true);
  });
});
