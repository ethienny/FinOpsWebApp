"use client";

// Client table for the top resources by validated savings on the executive page.

import { formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { PriorityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { ResourceSummary } from "@/types/finops";

const SEARCH_KEYS: Array<keyof ResourceSummary> = ["ResourceName", "SubscriptionName", "ServiceType"];

const COLUMNS: Column<ResourceSummary>[] = [
  {
    key: "ResourceName",
    header: "Resource",
    render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
  },
  { key: "ServiceType", header: "Service" },
  { key: "SubscriptionName", header: "Subscription" },
  { key: "ActionLabel", header: "Action" },
  {
    key: "EstimatedMonthlySavings",
    header: "Savings",
    numeric: true,
    sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
    render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
  },
  { key: "Priority", header: "Priority", render: (r) => <PriorityBadge value={r.Priority} /> },
];

export function ExecutiveResourcesTable({ rows }: { rows: ResourceSummary[] }) {
  return (
    <DataTable<ResourceSummary>
      rows={rows}
      searchKeys={SEARCH_KEYS}
      rowKey={(r) => r.ResourceId}
      columns={COLUMNS}
    />
  );
}
