"use client";

// Client table for the resource inventory. Columns and search keys are module
// level constants (or memoized per locale) so their identity stays stable across renders and DataTable
// can memoize filtering, sorting and column filter options.

import { useMemo } from "react";
import { useFormatters } from "@/lib/i18n/LocaleProvider";
import type { Formatters } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { PriorityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { ResourceSummary } from "@/types/finops";

const SEARCH_KEYS: Array<keyof ResourceSummary> = [
  "ResourceName",
  "SubscriptionName",
  "ResourceGroup",
  "TagOwner",
];

function buildColumns({ formatMoney }: Formatters): Column<ResourceSummary>[] {
  return [
    {
      key: "ResourceName",
      header: "ResourceName",
      render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
    },
    { key: "ServiceType", header: "ServiceType", filterable: true },
    { key: "TenantName", header: "TenantName", filterable: true },
    { key: "SubscriptionName", header: "SubscriptionName" },
    { key: "ResourceGroup", header: "ResourceGroup" },
    { key: "Location", header: "Location", filterable: true },
    {
      key: "MonthlyCost",
      header: "MonthlyCost",
      numeric: true,
      sortValue: (r) => r.MonthlyCost ?? 0,
      render: (r) => formatMoney(r.MonthlyCost, r.CostCurrency, false),
    },
    { key: "ActionLabel", header: "Recommendation" },
    { key: "Priority", header: "Priority", filterable: true, render: (r) => <PriorityBadge value={r.Priority} /> },
    {
      key: "EstimatedMonthlySavings",
      header: "EstimatedMonthlySavings",
      numeric: true,
      sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
      render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
    },
    { key: "TagOwner", header: "TagOwner", filterable: true },
    { key: "TagEnvironment", header: "TagEnvironment", filterable: true },
  ];
}

export function ResourcesTable({ rows }: { rows: ResourceSummary[] }) {
  const fmt = useFormatters();
  const columns = useMemo(() => buildColumns(fmt), [fmt]);
  return (
    <DataTable<ResourceSummary>
      rows={rows}
      searchKeys={SEARCH_KEYS}
      pageSize={15}
      rowKey={(r) => r.ResourceId}
      columns={columns}
    />
  );
}
