"use client";

// Client table listing every recorded decision, newest first, with the run it
// was taken on. Used by the Run History page.

import { formatDate, formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { DecisionBadge, ReliabilityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { DecisionLogRow } from "@/types/finops";

const SEARCH_KEYS: Array<keyof DecisionLogRow> = ["resourceName", "owner", "runId"];

const COLUMNS: Column<DecisionLogRow>[] = [
  {
    key: "resourceName",
    header: "Resource",
    render: (r) => <ResourceLink resourceId={r.resourceId} name={r.resourceName} />,
  },
  { key: "serviceType", header: "Service", filterable: true },
  { key: "runId", header: "Run", filterable: true },
  { key: "label", header: "Decision", filterable: true, render: (r) => <DecisionBadge value={r.status} /> },
  { key: "owner", header: "Owner" },
  {
    key: "monthlySavings",
    header: "Monthly savings",
    numeric: true,
    sortValue: (r) => r.monthlySavings ?? 0,
    render: (r) => formatMoney(r.monthlySavings, r.currency),
  },
  { key: "savingsReliability", header: "Reliability", render: (r) => <ReliabilityBadge value={r.savingsReliability} /> },
  { key: "updatedAt", header: "Updated", sortValue: (r) => r.updatedAt, render: (r) => formatDate(r.updatedAt) },
];

export function DecisionLogTable({ rows }: { rows: DecisionLogRow[] }) {
  return <DataTable<DecisionLogRow> rows={rows} searchKeys={SEARCH_KEYS} rowKey={(r) => r.resourceId} columns={COLUMNS} />;
}
