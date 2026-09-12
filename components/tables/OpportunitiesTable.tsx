"use client";

// Client table for actionable optimization opportunities. Columns and search
// keys are module level constants so DataTable keeps its memoized work stable.

import { formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ConfidenceBadge, MetricStatusBadge, PriorityBadge, ReliabilityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { ResourceSummary } from "@/types/finops";

const SEARCH_KEYS: Array<keyof ResourceSummary> = [
  "ResourceName",
  "SubscriptionName",
  "ActionLabel",
  "TagOwner",
];

const COLUMNS: Column<ResourceSummary>[] = [
  {
    key: "ResourceName",
    header: "ResourceName",
    render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
  },
  { key: "ServiceType", header: "ServiceType", filterable: true },
  { key: "SubscriptionName", header: "SubscriptionName" },
  { key: "ResourceGroup", header: "ResourceGroup" },
  { key: "ActionLabel", header: "ActionLabel" },
  { key: "ActionSummary", header: "ActionSummary" },
  {
    key: "EstimatedMonthlySavings",
    header: "EstimatedMonthlySavings",
    numeric: true,
    sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
    render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
  },
  {
    key: "SavingsReliability",
    header: "SavingsReliability",
    filterable: true,
    render: (r) => <ReliabilityBadge value={r.SavingsReliability} />,
  },
  { key: "Priority", header: "Priority", filterable: true, render: (r) => <PriorityBadge value={r.Priority} /> },
  { key: "Confidence", header: "Confidence", render: (r) => <ConfidenceBadge value={r.Confidence} /> },
  { key: "TagOwner", header: "TagOwner", filterable: true },
  { key: "TagEnvironment", header: "TagEnvironment", filterable: true },
  {
    key: "MetricCollectionStatus",
    header: "MetricCollectionStatus",
    filterable: true,
    render: (r) => <MetricStatusBadge value={r.MetricCollectionStatus} />,
  },
];

export function OpportunitiesTable({ rows }: { rows: ResourceSummary[] }) {
  return (
    <DataTable<ResourceSummary>
      rows={rows}
      searchKeys={SEARCH_KEYS}
      pageSize={15}
      rowKey={(r) => r.ResourceId}
      columns={COLUMNS}
    />
  );
}
