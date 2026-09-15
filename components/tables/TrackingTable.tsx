"use client";

// Client table listing every recommendation with a decision, newest first,
// with owner, run and date. Used by the Tracking page.

import { formatDate, formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { DecisionBadge, ReliabilityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { OpportunityRow } from "@/types/finops";
import { useDictionary } from "@/lib/i18n/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

const SEARCH_KEYS: Array<keyof OpportunityRow> = ["ResourceName", "decisionOwner", "SubscriptionName", "ActionLabel"];

function columns(dict: Dictionary): Column<OpportunityRow>[] {
  const t = dict.tracking.table;
  return [
    {
      key: "ResourceName",
      header: t.resource,
      render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
    },
    { key: "decisionLabel", header: t.decision, filterable: true, render: (r) => <DecisionBadge value={r.decisionStatus} /> },
    { key: "decisionOwner", header: t.assignedTo, filterable: true },
    { key: "ServiceType", header: t.service, filterable: true },
    { key: "SubscriptionName", header: t.subscription },
    { key: "ActionLabel", header: t.recommendation },
    {
      key: "EstimatedMonthlySavings",
      header: t.monthlySavings,
      numeric: true,
      sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
      render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
    },
    { key: "SavingsReliability", header: t.reliability, filterable: true, render: (r) => <ReliabilityBadge value={r.SavingsReliability} /> },
    { key: "decisionRunId", header: t.run, filterable: true },
    { key: "decisionUpdatedAt", header: t.updated, sortValue: (r) => r.decisionUpdatedAt, render: (r) => formatDate(r.decisionUpdatedAt) },
  ];
}

export function TrackingTable({ rows }: { rows: OpportunityRow[] }) {
  const dict = useDictionary();
  return (
    <DataTable<OpportunityRow> rows={rows} searchKeys={SEARCH_KEYS} pageSize={15} rowKey={(r) => r.ResourceId} columns={columns(dict)} />
  );
}
