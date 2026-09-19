"use client";

// Client table for the resources whose recommendation changed since the
// previous complete run.

import { DataTable, type Column } from "@/components/tables/DataTable";
import { ChangeBadge, DecisionBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { ChangeRow, DecisionFields } from "@/types/finops";
import { useDictionary, useFormatters } from "@/lib/i18n/LocaleProvider";
import type { Formatters } from "@/lib/formatters";
import type { Dictionary } from "@/lib/i18n/dictionary";

export type ChangeTableRow = ChangeRow & DecisionFields;

const SEARCH_KEYS: Array<keyof ChangeTableRow> = ["ResourceName", "ServiceType", "ActionLabel", "previousActionLabel", "TagOwner"];

function delta(row: ChangeTableRow, formatMoney: Formatters["formatMoney"]): string {
  if (!row.savingsDelta) return "—";
  const sign = row.savingsDelta > 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(row.savingsDelta), row.CostCurrency)}`;
}

function columns(dict: Dictionary, fmt: Formatters): Column<ChangeTableRow>[] {
  const { formatMoney } = fmt;
  const t = dict.changes.table.columns;
  return [
    {
      key: "ResourceName",
      header: t.resource,
      render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
    },
    { key: "ServiceType", header: t.service, filterable: true },
    { key: "changeLabel", header: t.change, filterable: true, render: (r) => <ChangeBadge value={r.changeLabel} /> },
    { key: "previousActionLabel", header: t.previousAction },
    { key: "ActionLabel", header: t.currentAction },
    {
      key: "previousSavings",
      header: t.previousSavings,
      numeric: true,
      sortValue: (r) => r.previousSavings,
      render: (r) => (r.previousReliability === "PRICED" ? formatMoney(r.previousSavings, r.CostCurrency) : "—"),
    },
    {
      key: "EstimatedMonthlySavings",
      header: t.currentSavings,
      numeric: true,
      sortValue: (r) => (r.SavingsReliability === "PRICED" ? r.EstimatedMonthlySavings ?? 0 : 0),
      render: (r) => (r.SavingsReliability === "PRICED" ? formatMoney(r.EstimatedMonthlySavings, r.CostCurrency) : "—"),
    },
    {
      key: "savingsDelta",
      header: t.delta,
      numeric: true,
      sortValue: (r) => r.savingsDelta,
      render: (r) => (
        <span className={r.savingsDelta > 0 ? "text-emerald-300" : r.savingsDelta < 0 ? "text-rose-300" : "text-slate-500"}>{delta(r, formatMoney)}</span>
      ),
    },
    { key: "TagOwner", header: t.owner, filterable: true },
    { key: "decisionLabel", header: t.decision, filterable: true, render: (r) => <DecisionBadge value={r.decisionStatus} /> },
  ];
}

export function ChangesTable({ rows }: { rows: ChangeTableRow[] }) {
  const dict = useDictionary();
  const fmt = useFormatters();
  return <DataTable<ChangeTableRow> rows={rows} searchKeys={SEARCH_KEYS} pageSize={15} rowKey={(r) => r.ResourceId} columns={columns(dict, fmt)} />;
}
