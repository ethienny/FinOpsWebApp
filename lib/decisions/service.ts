// Joins FinOps rows with stored decisions for the pages. Reads both sources on
// the server and hands pages ready to render values.

import type { DecisionSavings, FinOpsFilters, NamedValue, OpportunityRow } from "@/types/finops";
import { getInsightRows } from "@/lib/insights/service";
import { getDecisionRepository } from "./store";
import {
  applyDecisions,
  decidedRows,
  decisionsByResource,
  decisionsByStatus,
  decisionSavings,
  trackedSavingsByOwner,
} from "./metrics";

export interface DecisionTracking {
  currency: string;
  rows: OpportunityRow[];
  decided: OpportunityRow[];
  savings: DecisionSavings;
  dismissedCount: number;
  byStatus: NamedValue[];
  byOwner: NamedValue[];
}

/** Opportunity rows in the current scope with their decisions and the tracking figures. */
export async function getDecisionTracking(filters: FinOpsFilters): Promise<DecisionTracking> {
  const [insights, decisions] = await Promise.all([getInsightRows(filters), getDecisionRepository().list()]);
  const byResource = decisionsByResource(decisions);
  const rows = applyDecisions(insights.rows, byResource);
  const decided = decidedRows(rows);
  return {
    currency: insights.currency,
    rows,
    decided,
    savings: decisionSavings(insights.rows, byResource),
    dismissedCount: decided.filter((r) => r.decisionStatus === "dismissed").length,
    byStatus: decisionsByStatus(decided),
    byOwner: trackedSavingsByOwner(decided),
  };
}
