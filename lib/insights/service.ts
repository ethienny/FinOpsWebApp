// Builds insight rows for the pages: the opportunity rows of the current scope
// with recommendation aging and quick win scoring overlaid.

import type { FinOpsFilters, InsightFields, InsightRow, RecommendationAging } from "@/types/finops";
import { getRepository } from "@/lib/repositories";
import { AGE_LABELS } from "./aging";
import { scoreRows } from "./score";

export interface InsightRows {
  currency: string;
  rows: InsightRow[];
}

function agingFields(aging: RecommendationAging | undefined): Omit<InsightFields, keyof import("./score").ScoreFields> {
  if (!aging) {
    return { runsOpen: 0, daysOpen: 0, missedSavings: 0, ageBucket: "new", ageLabel: "", firstDetectedRunId: "", firstDetectedAt: "" };
  }
  return {
    runsOpen: aging.runsOpen,
    daysOpen: aging.daysOpen,
    missedSavings: aging.missedSavings,
    ageBucket: aging.ageBucket,
    ageLabel: AGE_LABELS[aging.ageBucket],
    firstDetectedRunId: aging.firstDetectedRunId,
    firstDetectedAt: aging.firstDetectedAt,
  };
}

export async function getInsightRows(filters: FinOpsFilters): Promise<InsightRows> {
  const repo = getRepository();
  const [opportunities, aging] = await Promise.all([repo.getOpportunities(filters), repo.getRecommendationAging()]);
  const byResource = new Map(aging.map((a) => [a.resourceId, a]));
  const rows = scoreRows(opportunities.rows.map((r) => ({ ...r, ...agingFields(byResource.get(r.ResourceId)) })));
  return { currency: opportunities.currency, rows };
}

/** Insight fields of one resource, scored against the whole inventory. */
export async function getResourceInsight(resourceId: string): Promise<InsightRow | null> {
  const { rows } = await getInsightRows({});
  return rows.find((r) => r.ResourceId === resourceId) ?? null;
}
