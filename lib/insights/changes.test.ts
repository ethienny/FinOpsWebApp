// Rules for the run to run comparison: which run is the previous one, how a
// resource is classified and how the summary adds up.

import { describe, expect, it } from "vitest";
import type { ChangeFields, FinOpsRecommendation, FinOpsRun } from "@/types/finops";
import { changeSummary, diffRuns, previousEligibleRun, runTotals } from "./changes";

function run(id: string, day: number, extra: Partial<FinOpsRun> = {}): FinOpsRun {
  return {
    RunId: id,
    RunStatus: "SUCCEEDED",
    RunScope: "FULL",
    RunStartedAt: `2026-09-${String(day).padStart(2, "0")}T00:00:00Z`,
    ...extra,
  } as FinOpsRun;
}

function rec(
  resourceId: string,
  action: string,
  savings: number,
  reliability = "PRICED",
  actionable = true,
  cost = 100,
): FinOpsRecommendation {
  return {
    ResourceId: resourceId,
    RecommendationAction: action,
    EstimatedMonthlySavings: savings,
    SavingsReliability: reliability,
    IsActionable: actionable,
    MonthlyCost: cost,
  } as FinOpsRecommendation;
}

describe("previousEligibleRun", () => {
  it("returns the complete full scope run right before the latest", () => {
    const runs = [run("r1", 1), run("filtered", 2, { RunScope: "FILTERED" }), run("failed", 3, { RunStatus: "FAILED" }), run("r4", 4)];
    expect(previousEligibleRun(runs, "r4")?.RunId).toBe("r1");
  });

  it("returns null when the latest run is the only eligible one", () => {
    expect(previousEligibleRun([run("r1", 1)], "r1")).toBeNull();
    expect(previousEligibleRun([run("r1", 1)], "missing")).toBeNull();
  });
});

describe("diffRuns", () => {
  it("flags a resource that became actionable as new", () => {
    const [change] = diffRuns([rec("a", "Downsize", 50)], [rec("a", "No-Action", 0, "UNPRICED", false)]);
    expect(change).toMatchObject({ kind: "new", currentSavings: 50, previousSavings: 0, savingsDelta: 50 });
  });

  it("treats a resource absent from the previous run as new", () => {
    expect(diffRuns([rec("a", "Downsize", 50)], [])[0].kind).toBe("new");
  });

  it("flags a resource that stopped being actionable or disappeared as resolved", () => {
    const changes = diffRuns([rec("a", "No-Action", 0, "UNPRICED", false)], [rec("a", "Downsize", 50), rec("b", "Downsize", 20)]);
    expect(changes.map((c) => [c.resourceId, c.kind, c.savingsDelta])).toEqual([
      ["a", "resolved", -50],
      ["b", "resolved", -20],
    ]);
  });

  it("flags action, reliability and material savings changes in that order", () => {
    const current = [rec("a", "Downsize", 50), rec("b", "Downsize", 50, "HEURISTIC"), rec("c", "Downsize", 60)];
    const previous = [rec("a", "Evaluate-Idle", 50), rec("b", "Downsize", 50), rec("c", "Downsize", 50)];
    expect(diffRuns(current, previous).map((c) => [c.resourceId, c.kind])).toEqual([
      ["a", "action_changed"],
      ["b", "reliability_changed"],
      ["c", "savings_changed"],
    ]);
  });

  it("ignores stable rows, small savings moves and resources that were never actionable", () => {
    const current = [rec("a", "Downsize", 51), rec("b", "Downsize", 50.5), rec("c", "No-Action", 0, "UNPRICED", false)];
    const previous = [rec("a", "Downsize", 50), rec("b", "Downsize", 50), rec("c", "No-Action", 0, "UNPRICED", false)];
    expect(diffRuns(current, previous)).toEqual([]);
  });

  it("never compares heuristic estimates", () => {
    const current = [rec("a", "Downsize", 500, "HEURISTIC")];
    const previous = [rec("a", "Downsize", 50, "HEURISTIC")];
    expect(diffRuns(current, previous)).toEqual([]);
  });
});

describe("runTotals", () => {
  it("adds PRICED savings, actionable rows and cost", () => {
    const rows = [rec("a", "Downsize", 50, "PRICED", true, 100), rec("b", "Downsize", 30, "HEURISTIC", true, 200), rec("c", "No-Action", 0, "UNPRICED", false, 50)];
    expect(runTotals(rows)).toEqual({ validatedSavings: 50, actionableCount: 2, monthlyCost: 350 });
  });
});

describe("changeSummary", () => {
  function change(kind: ChangeFields["changeKind"], previousSavings: number, savingsDelta: number): ChangeFields {
    return { changeKind: kind, previousSavings, savingsDelta } as ChangeFields;
  }

  it("counts each kind and adds the savings that matter for it", () => {
    const summary = changeSummary([
      change("new", 0, 40),
      change("new", 0, 10),
      change("resolved", 25, -25),
      change("action_changed", 10, 5),
      change("reliability_changed", 10, -10),
      change("savings_changed", 100, 20),
      change("savings_changed", 100, -5),
    ]);
    expect(summary).toEqual({
      newCount: 2,
      newSavings: 50,
      resolvedCount: 1,
      resolvedSavings: 25,
      actionChangedCount: 1,
      reliabilityChangedCount: 1,
      savingsChangedCount: 2,
      savingsChangedDelta: 15,
    });
  });
});
