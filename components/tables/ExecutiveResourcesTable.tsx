"use client";

// Client table for the top resources by validated savings on the executive page.

import { formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { PriorityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { ResourceSummary } from "@/types/finops";
import { useDictionary } from "@/lib/i18n/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

const SEARCH_KEYS: Array<keyof ResourceSummary> = ["ResourceName", "SubscriptionName", "ServiceType"];

function columns(dict: Dictionary): Column<ResourceSummary>[] {
  return [
    {
      key: "ResourceName",
      header: dict.home.table.resource,
      render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
    },
    { key: "ServiceType", header: dict.home.table.service },
    { key: "SubscriptionName", header: dict.home.table.subscription },
    { key: "ActionLabel", header: dict.home.table.action },
    {
      key: "EstimatedMonthlySavings",
      header: dict.home.table.savings,
      numeric: true,
      sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
      render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
    },
    { key: "Priority", header: dict.home.table.priority, render: (r) => <PriorityBadge value={r.Priority} /> },
  ];
}

export function ExecutiveResourcesTable({ rows }: { rows: ResourceSummary[] }) {
  const dict = useDictionary();
  return (
    <DataTable<ResourceSummary>
      rows={rows}
      searchKeys={SEARCH_KEYS}
      rowKey={(r) => r.ResourceId}
      columns={columns(dict)}
    />
  );
}
