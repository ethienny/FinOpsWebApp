"use client";

// Client table listing every recommendation with a decision, newest first,
// with owner, run and date. Used by the Tracking page.

import { formatDate, formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { DecisionBadge, ReliabilityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { OpportunityRow } from "@/types/finops";

const SEARCH_KEYS: Array<keyof OpportunityRow> = ["ResourceName", "decisionOwner", "SubscriptionName", "ActionLabel"];

const COLUMNS: Column<OpportunityRow>[] = [
  {
    key: "ResourceName",
    header: "Resource",
    render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
  },
  { key: "decisionLabel", header: "Decision", filterable: true, render: (r) => <DecisionBadge value={r.decisionStatus} /> },
  { key: "decisionOwner", header: "Assigned to", filterable: true },
  { key: "ServiceType", header: "Service", filterable: true },
  { key: "SubscriptionName", header: "Subscription" },
  { key: "ActionLabel", header: "Recommendation" },
  {
    key: "EstimatedMonthlySavings",
    header: "Monthly savings",
    numeric: true,
    sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
    render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
  },
  { key: "SavingsReliability", header: "Reliability", filterable: true, render: (r) => <ReliabilityBadge value={r.SavingsReliability} /> },
  { key: "decisionRunId", header: "Run", filterable: true },
  { key: "decisionUpdatedAt", header: "Updated", sortValue: (r) => r.decisionUpdatedAt, render: (r) => formatDate(r.decisionUpdatedAt) },
];

export function TrackingTable({ rows }: { rows: OpportunityRow[] }) {
  return (
    <DataTable<OpportunityRow> rows={rows} searchKeys={SEARCH_KEYS} pageSize={15} rowKey={(r) => r.ResourceId} columns={COLUMNS} />
  );
}
