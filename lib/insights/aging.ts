// Recommendation aging across engine runs. Pure functions over the multi run
// recommendation history, so the rules can be unit tested without data files.

import type { AgeBucket, FinOpsRecommendation, FinOpsRun, RecommendationAging } from "@/types/finops";

const DAYS_PER_MONTH = 30.4375;
const DAY_MS = 86_400_000;

export const AGE_LABELS: Record<AgeBucket, string> = {
  new: "New",
  recurring: "Recurring",
  persistent: "Persistent",
};

/** Bucket by how many complete runs carried the same recommendation. */
export function ageBucket(runsOpen: number): AgeBucket {
  if (runsOpen >= 5) return "persistent";
  if (runsOpen >= 2) return "recurring";
  return "new";
}

/** Complete full scope runs, oldest first, up to and including the latest official run. */
export function eligibleRuns(runs: FinOpsRun[], latestRunId: string): FinOpsRun[] {
  const sorted = runs
    .filter((r) => r.RunScope === "FULL" && (r.RunStatus === "SUCCEEDED" || r.RunStatus === "DEGRADED"))
    .sort((a, b) => a.RunStartedAt.localeCompare(b.RunStartedAt));
  const end = sorted.findIndex((r) => r.RunId === latestRunId);
  return end === -1 ? [] : sorted.slice(0, end + 1);
}

function daysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms / DAY_MS : 0;
}

/**
 * For every actionable resource in the latest run, walks the eligible runs
 * backwards while the resource carried the same actionable recommendation.
 * Missed savings accrue per interval between runs, only while the estimate
 * was PRICED, so heuristic values never enter the total.
 */
export function buildAgingIndex(
  history: FinOpsRecommendation[],
  runs: FinOpsRun[],
  latestRunId: string,
): RecommendationAging[] {
  const eligible = eligibleRuns(runs, latestRunId);
  if (!eligible.length) return [];
  const eligibleIds = new Set(eligible.map((r) => r.RunId));

  const byResource = new Map<string, Map<string, FinOpsRecommendation>>();
  for (const row of history) {
    if (!eligibleIds.has(row.RunId)) continue;
    let perRun = byResource.get(row.ResourceId);
    if (!perRun) {
      perRun = new Map();
      byResource.set(row.ResourceId, perRun);
    }
    perRun.set(row.RunId, row);
  }

  const latestIndex = eligible.length - 1;
  const result: RecommendationAging[] = [];
  for (const [resourceId, perRun] of byResource) {
    const current = perRun.get(latestRunId);
    if (!current || !current.IsActionable) continue;

    let start = latestIndex;
    while (start > 0) {
      const previous = perRun.get(eligible[start - 1].RunId);
      if (!previous || !previous.IsActionable || previous.RecommendationAction !== current.RecommendationAction) break;
      start -= 1;
    }

    let missed = 0;
    for (let i = start; i < latestIndex; i++) {
      const row = perRun.get(eligible[i].RunId);
      if (!row || row.SavingsReliability !== "PRICED") continue;
      const days = daysBetween(eligible[i].RunStartedAt, eligible[i + 1].RunStartedAt);
      missed += (row.EstimatedMonthlySavings ?? 0) * (days / DAYS_PER_MONTH);
    }

    const runsOpen = latestIndex - start + 1;
    result.push({
      resourceId,
      recommendationAction: current.RecommendationAction,
      firstDetectedRunId: eligible[start].RunId,
      firstDetectedAt: eligible[start].RunStartedAt,
      runsOpen,
      daysOpen: Math.round(daysBetween(eligible[start].RunStartedAt, eligible[latestIndex].RunStartedAt) * 10) / 10,
      missedSavings: missed,
      ageBucket: ageBucket(runsOpen),
    });
  }
  return result;
}
