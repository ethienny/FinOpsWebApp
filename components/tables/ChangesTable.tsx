"use client";

// Client table for the resources whose recommendation changed since the
// previous complete run.

import { formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ChangeBadge, DecisionBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { ChangeRow, DecisionFields } from "@/types/finops";

export type ChangeTableRow = ChangeRow & DecisionFields;

const SEARCH_KEYS: Array<keyof ChangeTableRow> = ["ResourceName", "ServiceType", "ActionLabel", "previousActionLabel", "TagOwner"];

function delta(row: ChangeTableRow): string {
  if (!row.savingsDelta) return "—";
  const sign = row.savingsDelta > 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(row.savingsDelta), row.CostCurrency)}`;
}

const COLUMNS: Column<ChangeTableRow>[] = [
  {
    key: "ResourceName",
    header: "Resource",
    render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
  },
  { key: "ServiceType", header: "Service", filterable: true },
  { key: "changeLabel", header: "Change", filterable: true, render: (r) => <ChangeBadge value={r.changeLabel} /> },
  { key: "previousActionLabel", header: "Previous action" },
  { key: "ActionLabel", header: "Current action" },
  {
    key: "previousSavings",
    header: "Previous savings",
    numeric: true,
    sortValue: (r) => r.previousSavings,
    render: (r) => (r.previousReliability === "PRICED" ? formatMoney(r.previousSavings, r.CostCurrency) : "—"),
  },
  {
    key: "EstimatedMonthlySavings",
    header: "Current savings",
    numeric: true,
    sortValue: (r) => (r.SavingsReliability === "PRICED" ? r.EstimatedMonthlySavings ?? 0 : 0),
    render: (r) => (r.SavingsReliability === "PRICED" ? formatMoney(r.EstimatedMonthlySavings, r.CostCurrency) : "—"),
  },
  {
    key: "savingsDelta",
    header: "Delta",
    numeric: true,
    sortValue: (r) => r.savingsDelta,
    render: (r) => (
      <span className={r.savingsDelta > 0 ? "text-emerald-300" : r.savingsDelta < 0 ? "text-rose-300" : "text-slate-500"}>{delta(r)}</span>
    ),
  },
  { key: "TagOwner", header: "Owner", filterable: true },
  { key: "decisionLabel", header: "Decision", filterable: true, render: (r) => <DecisionBadge value={r.decisionStatus} /> },
];

export function ChangesTable({ rows }: { rows: ChangeTableRow[] }) {
  return <DataTable<ChangeTableRow> rows={rows} searchKeys={SEARCH_KEYS} pageSize={15} rowKey={(r) => r.ResourceId} columns={COLUMNS} />;
}
