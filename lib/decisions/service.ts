// Joins FinOps rows with stored decisions for the pages. Reads both sources on
// the server and hands pages ready to render values.

import type { DecisionLogRow, FinOpsFilters, OpportunityRow, DecisionSavings } from "@/types/finops";
import { getRepository } from "@/lib/repositories";
import { getDecisionRepository } from "./store";
import { applyDecisions, DECISION_LABELS, decisionsByResource, decisionSavings } from "./metrics";

export interface DecisionTracking {
  rows: OpportunityRow[];
  savings: DecisionSavings;
  dismissedCount: number;
}

/** Opportunity rows in the current scope with their decisions and the tracking KPIs. */
export async function getDecisionTracking(filters: FinOpsFilters): Promise<DecisionTracking> {
  const [opportunities, decisions] = await Promise.all([
    getRepository().getOpportunities(filters),
    getDecisionRepository().list(),
  ]);
  const byResource = decisionsByResource(decisions);
  const rows = applyDecisions(opportunities.rows, byResource);
  return {
    rows,
    savings: decisionSavings(opportunities.rows, byResource),
    dismissedCount: rows.filter((r) => r.decisionStatus === "dismissed").length,
  };
}

/** Every recorded decision joined with its resource, newest first. */
export async function getDecisionLog(): Promise<DecisionLogRow[]> {
  const [opportunities, decisions] = await Promise.all([
    getRepository().getOpportunities({}),
    getDecisionRepository().list(),
  ]);
  const byId = new Map(opportunities.rows.map((r) => [r.ResourceId, r]));
  return decisions
    .map((d) => {
      const row = byId.get(d.resourceId);
      return {
        resourceId: d.resourceId,
        resourceName: row?.ResourceName ?? d.resourceId,
        serviceType: row?.ServiceType ?? "",
        runId: d.runId,
        status: d.status,
        label: DECISION_LABELS[d.status],
        owner: d.owner,
        updatedAt: d.updatedAt,
        monthlySavings: row?.EstimatedMonthlySavings ?? null,
        savingsReliability: row?.SavingsReliability ?? "",
        currency: row?.CostCurrency ?? opportunities.currency,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
