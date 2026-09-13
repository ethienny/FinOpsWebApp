// Builds insight rows for the pages: the opportunity rows of the current scope
// with recommendation aging and quick win scoring overlaid.

import type {
  ChangeRow,
  ChangeSummary,
  DecisionFields,
  FinOpsFilters,
  InsightFields,
  InsightRow,
  RecommendationAging,
  RunDeltaData,
} from "@/types/finops";
import { getRepository } from "@/lib/repositories";
import { getDecisionRepository } from "@/lib/decisions/store";
import { applyDecisions, decisionsByResource } from "@/lib/decisions/metrics";
import { AGE_LABELS } from "./aging";
import { changeSummary } from "./changes";
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

export interface RunChanges extends Omit<RunDeltaData, "rows"> {
  rows: Array<ChangeRow & DecisionFields>;
  summary: ChangeSummary;
}

/** What changed since the previous complete run, biggest savings moves first, with the team decisions overlaid. */
export async function getRunChanges(filters: FinOpsFilters): Promise<RunChanges> {
  const [delta, decisions] = await Promise.all([getRepository().getRunDelta(filters), getDecisionRepository().list()]);
  const rows = applyDecisions(delta.rows, decisionsByResource(decisions)).sort(
    (a, b) => Math.abs(b.savingsDelta) - Math.abs(a.savingsDelta),
  );
  return { ...delta, rows, summary: changeSummary(rows) };
}
