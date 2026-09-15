"use client";

// Client table for the top quick wins on the executive page.

import { formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { AgeBadge, RiskBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import { useDictionary } from "@/lib/i18n/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";
import type { OpportunityRow } from "@/types/finops";

const SEARCH_KEYS: Array<keyof OpportunityRow> = ["ResourceName", "ServiceType", "ActionLabel"];

function columns(dict: Dictionary): Column<OpportunityRow>[] {
  return [
    {
      key: "ResourceName",
      header: dict.insights.table.resource,
      render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
    },
    { key: "ServiceType", header: dict.insights.table.service },
    { key: "ActionLabel", header: dict.insights.table.action },
    {
      key: "EstimatedMonthlySavings",
      header: dict.insights.table.savings,
      numeric: true,
      sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
      render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
    },
    { key: "quickWinScore", header: dict.insights.table.score, numeric: true, sortValue: (r) => r.quickWinScore },
    { key: "riskLabel", header: dict.insights.table.risk, render: (r) => <RiskBadge value={r.riskLabel} /> },
    { key: "ageLabel", header: dict.insights.table.age, render: (r) => <AgeBadge value={r.ageLabel} /> },
  ];
}

export function QuickWinsTable({ rows }: { rows: OpportunityRow[] }) {
  const dict = useDictionary();
  return <DataTable<OpportunityRow> rows={rows} searchKeys={SEARCH_KEYS} pageSize={10} rowKey={(r) => r.ResourceId} columns={columns(dict)} />;
}
