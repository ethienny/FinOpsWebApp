// Joins FinOps rows with stored decisions for the pages. Reads both sources on
// the server and hands pages ready to render values.

import type { DecisionSavings, FinOpsFilters, NamedValue, OpportunityRow } from "@/types/finops";
import { getRepository } from "@/lib/repositories";
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
  const [opportunities, decisions] = await Promise.all([
    getRepository().getOpportunities(filters),
    getDecisionRepository().list(),
  ]);
  const byResource = decisionsByResource(decisions);
  const rows = applyDecisions(opportunities.rows, byResource);
  const decided = decidedRows(rows);
  return {
    currency: opportunities.currency,
    rows,
    decided,
    savings: decisionSavings(opportunities.rows, byResource),
    dismissedCount: decided.filter((r) => r.decisionStatus === "dismissed").length,
    byStatus: decisionsByStatus(decided),
    byOwner: trackedSavingsByOwner(decided),
  };
}
