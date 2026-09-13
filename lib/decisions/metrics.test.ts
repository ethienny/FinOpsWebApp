// Rules for the decision tracking KPIs. These guard the README promise that
// PRICED and HEURISTIC savings never mix, extended to tracked savings.

import { describe, expect, it } from "vitest";
import type { RecommendationDecision, ResourceSummary } from "@/types/finops";
import { applyDecisions, decidedRows, decisionsByResource, decisionsByStatus, decisionSavings, trackedSavingsByOwner } from "./metrics";

function row(id: string, reliability: string, savings: number | null): ResourceSummary {
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
    SavingsReliability: reliability,
    EstimatedMonthlySavings: savings,
    MetricCollectionStatus: "COMPLETE",
    TagOwner: "",
    TagEnvironment: "",
  };
}

function decision(resourceId: string, status: RecommendationDecision["status"], owner = ""): RecommendationDecision {
  return { resourceId, runId: "run-1", status, owner, note: "", updatedAt: "2026-09-13T00:00:00Z", updatedBy: "test" };
}

describe("decisionSavings", () => {
  it("sums PRICED savings into in progress for accepted and in_progress", () => {
    const rows = [row("a", "PRICED", 100), row("b", "PRICED", 50)];
    const decisions = decisionsByResource([decision("a", "accepted"), decision("b", "in_progress")]);
    expect(decisionSavings(rows, decisions)).toEqual({ inProgress: 150, realized: 0, decided: 2 });
  });

  it("sums PRICED savings into realized only when done", () => {
    const rows = [row("a", "PRICED", 100), row("b", "PRICED", 40)];
    const decisions = decisionsByResource([decision("a", "done"), decision("b", "accepted")]);
    expect(decisionSavings(rows, decisions)).toEqual({ inProgress: 40, realized: 100, decided: 2 });
  });

  it("never counts HEURISTIC or UNPRICED savings, whatever the status", () => {
    const rows = [row("h", "HEURISTIC", 500), row("u", "UNPRICED", 300)];
    const decisions = decisionsByResource([decision("h", "done"), decision("u", "in_progress")]);
    expect(decisionSavings(rows, decisions)).toEqual({ inProgress: 0, realized: 0, decided: 2 });
  });

  it("ignores dismissed savings but still counts the decision", () => {
    const rows = [row("a", "PRICED", 100)];
    const decisions = decisionsByResource([decision("a", "dismissed")]);
    expect(decisionSavings(rows, decisions)).toEqual({ inProgress: 0, realized: 0, decided: 1 });
  });

  it("treats open and missing decisions as not decided", () => {
    const rows = [row("a", "PRICED", 100), row("b", "PRICED", 100)];
    const decisions = decisionsByResource([decision("a", "open")]);
    expect(decisionSavings(rows, decisions)).toEqual({ inProgress: 0, realized: 0, decided: 0 });
  });

  it("only counts decisions for rows in the given scope", () => {
    const rows = [row("a", "PRICED", 100)];
    const decisions = decisionsByResource([decision("a", "done"), decision("outside", "done")]);
    expect(decisionSavings(rows, decisions)).toEqual({ inProgress: 0, realized: 100, decided: 1 });
  });

  it("treats null savings as zero", () => {
    const rows = [row("a", "PRICED", null)];
    const decisions = decisionsByResource([decision("a", "done")]);
    expect(decisionSavings(rows, decisions)).toEqual({ inProgress: 0, realized: 0, decided: 1 });
  });
});

describe("applyDecisions", () => {
  it("defaults rows without a decision to open", () => {
    const [result] = applyDecisions([row("a", "PRICED", 1)], new Map());
    expect(result.decisionStatus).toBe("open");
    expect(result.decisionLabel).toBe("Open");
    expect(result.decisionOwner).toBe("");
  });

  it("copies status, label and owner from the decision", () => {
    const decisions = decisionsByResource([decision("a", "in_progress", "platform-team")]);
    const [result] = applyDecisions([row("a", "PRICED", 1)], decisions);
    expect(result.decisionStatus).toBe("in_progress");
    expect(result.decisionLabel).toBe("In progress");
    expect(result.decisionOwner).toBe("platform-team");
  });
});

describe("tracking breakdowns", () => {
  const rows = applyDecisions(
    [row("a", "PRICED", 100), row("b", "PRICED", 50), row("h", "HEURISTIC", 900), row("o", "PRICED", 10), row("d", "PRICED", 70)],
    decisionsByResource([
      decision("a", "done", "platform"),
      decision("b", "accepted", "platform"),
      decision("h", "done", "data"),
      decision("d", "dismissed", "data"),
    ]),
  );

  it("decidedRows drops open rows and sorts newest first", () => {
    const decided = decidedRows(rows.map((r, i) => ({ ...r, decisionUpdatedAt: r.decisionStatus === "open" ? "" : `2026-09-1${i}` })));
    expect(decided.map((r) => r.ResourceId)).toEqual(["d", "h", "b", "a"]);
  });

  it("decisionsByStatus counts decided rows per label and omits empty statuses", () => {
    expect(decisionsByStatus(decidedRows(rows))).toEqual([
      { name: "Accepted", value: 1 },
      { name: "Done", value: 2 },
      { name: "Dismissed", value: 1 },
    ]);
  });

  it("trackedSavingsByOwner sums PRICED savings under way or done per owner", () => {
    expect(trackedSavingsByOwner(decidedRows(rows))).toEqual([{ name: "platform", value: 150 }]);
  });
});
