"use client";

// Client table for the top quick wins on the executive page.

import { formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { AgeBadge, RiskBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { OpportunityRow } from "@/types/finops";

const SEARCH_KEYS: Array<keyof OpportunityRow> = ["ResourceName", "ServiceType", "ActionLabel"];

const COLUMNS: Column<OpportunityRow>[] = [
  {
    key: "ResourceName",
    header: "Resource",
    render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
  },
  { key: "ServiceType", header: "Service" },
  { key: "ActionLabel", header: "Action" },
  {
    key: "EstimatedMonthlySavings",
    header: "Savings",
    numeric: true,
    sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
    render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
  },
  { key: "quickWinScore", header: "Score", numeric: true, sortValue: (r) => r.quickWinScore },
  { key: "riskLabel", header: "Risk", render: (r) => <RiskBadge value={r.riskLabel} /> },
  { key: "ageLabel", header: "Age", render: (r) => <AgeBadge value={r.ageLabel} /> },
];

export function QuickWinsTable({ rows }: { rows: OpportunityRow[] }) {
  return <DataTable<OpportunityRow> rows={rows} searchKeys={SEARCH_KEYS} pageSize={10} rowKey={(r) => r.ResourceId} columns={COLUMNS} />;
}
