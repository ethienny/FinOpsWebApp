// Rules for recommendation aging: which runs count, when a streak breaks and
// how missed savings accrue. PRICED only, as everywhere else.

import { describe, expect, it } from "vitest";
import type { FinOpsRecommendation, FinOpsRun } from "@/types/finops";
import { ageBucket, buildAgingIndex, eligibleRuns } from "./aging";

function run(id: string, day: number, extra: Partial<FinOpsRun> = {}): FinOpsRun {
  return {
    RunId: id,
    RunStatus: "SUCCEEDED",
    RunScope: "FULL",
    RunStartedAt: `2026-09-${String(day).padStart(2, "0")}T00:00:00Z`,
    RunFinishedAt: "",
    IsPublishable: true,
    PublishApproved: true,
    ...extra,
  } as FinOpsRun;
}

function rec(
  runId: string,
  resourceId: string,
  action: string,
  savings: number,
  reliability = "PRICED",
  actionable = true,
): FinOpsRecommendation {
  return {
    RunId: runId,
    ResourceId: resourceId,
    RecommendationAction: action,
    EstimatedMonthlySavings: savings,
    SavingsReliability: reliability,
    IsActionable: actionable,
  } as FinOpsRecommendation;
}

const RUNS = [run("r1", 1), run("r2", 2), run("r3", 3), run("r4", 4), run("r5", 5)];

describe("eligibleRuns", () => {
  it("keeps complete full scope runs up to the latest one, oldest first", () => {
    const runs = [
      run("r3", 3),
      run("r1", 1),
      run("filtered", 2, { RunScope: "FILTERED" }),
      run("failed", 2, { RunStatus: "FAILED" }),
      run("degraded", 2, { RunStatus: "DEGRADED" }),
      run("later", 9),
    ];
    expect(eligibleRuns(runs, "r3").map((r) => r.RunId)).toEqual(["r1", "degraded", "r3"]);
  });

  it("returns nothing when the latest run is unknown", () => {
    expect(eligibleRuns(RUNS, "missing")).toEqual([]);
  });
});

describe("ageBucket", () => {
  it("maps runs open to buckets", () => {
    expect(ageBucket(1)).toBe("new");
    expect(ageBucket(2)).toBe("recurring");
    expect(ageBucket(4)).toBe("recurring");
    expect(ageBucket(5)).toBe("persistent");
  });
});

describe("buildAgingIndex", () => {
  it("counts the streak of the same actionable recommendation ending at the latest run", () => {
    const history = ["r1", "r2", "r3", "r4", "r5"].map((id) => rec(id, "a", "Rightsize", 300));
    const [aging] = buildAgingIndex(history, RUNS, "r5");
    expect(aging.runsOpen).toBe(5);
    expect(aging.firstDetectedRunId).toBe("r1");
    expect(aging.daysOpen).toBe(4);
    expect(aging.ageBucket).toBe("persistent");
  });

  it("breaks the streak when the recommendation changed or was not actionable", () => {
    const history = [
      rec("r1", "a", "Rightsize", 300),
      rec("r2", "a", "No-Action", 0, "PRICED", false),
      rec("r3", "a", "Rightsize", 300),
      rec("r4", "a", "Rightsize", 300),
      rec("r5", "a", "Rightsize", 300),
    ];
    const [aging] = buildAgingIndex(history, RUNS, "r5");
    expect(aging.runsOpen).toBe(3);
    expect(aging.firstDetectedRunId).toBe("r3");
  });

  it("breaks the streak when the resource was absent from a full run", () => {
    const history = [rec("r1", "a", "Rightsize", 300), rec("r3", "a", "Rightsize", 300), rec("r4", "a", "Rightsize", 300), rec("r5", "a", "Rightsize", 300)];
    const [aging] = buildAgingIndex(history, RUNS, "r5");
    expect(aging.runsOpen).toBe(3);
  });

  it("accrues missed savings per interval using the PRICED estimate of each run", () => {
    // Daily runs: each interval is 1 day, so one month of savings accrues 1/30.4375 per day.
    const history = [
      rec("r1", "a", "Rightsize", 304.375),
      rec("r2", "a", "Rightsize", 608.75),
      rec("r3", "a", "Rightsize", 999, "HEURISTIC"),
      rec("r4", "a", "Rightsize", 304.375),
      rec("r5", "a", "Rightsize", 1),
    ];
    const [aging] = buildAgingIndex(history, RUNS, "r5");
    // r1 -> 10, r2 -> 20, r3 heuristic -> 0, r4 -> 10; the latest run has not accrued anything yet.
    expect(aging.missedSavings).toBeCloseTo(40, 6);
  });

  it("ignores resources that are not actionable in the latest run and runs outside the eligible set", () => {
    const history = [
      rec("r4", "a", "Rightsize", 100),
      rec("r5", "a", "Rightsize", 100, "PRICED", false),
      rec("r5", "b", "Delete", 50),
      rec("r6", "b", "Delete", 50),
    ];
    const index = buildAgingIndex(history, [...RUNS, run("r6", 6)], "r5");
    expect(index.map((a) => a.resourceId)).toEqual(["b"]);
    expect(index[0].runsOpen).toBe(1);
    expect(index[0].missedSavings).toBe(0);
    expect(index[0].ageBucket).toBe("new");
  });
});
