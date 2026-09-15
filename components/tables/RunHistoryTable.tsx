"use client";

// Client table of engine runs with duration and coverage rates for the Run
// History page.

import { formatDate, formatDuration, formatPercent } from "@/lib/formatters";
import { DataTable } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/badges";
import type { FinOpsRun } from "@/types/finops";

export function RunHistoryTable({ rows }: { rows: FinOpsRun[] }) {
  return (
    <DataTable<FinOpsRun>
      rows={rows}
      columns={[
        { key: "RunId", header: "RunId" },
        { key: "RunStartedAt", header: "RunStartedAt", render: (r) => formatDate(r.RunStartedAt) },
        { key: "RunFinishedAt", header: "RunFinishedAt", render: (r) => formatDate(r.RunFinishedAt) },
        { key: "RunStatus", header: "RunStatus", render: (r) => <StatusBadge value={r.RunStatus} /> },
        { key: "RunScope", header: "RunScope" },
        { key: "DataQualityStatus", header: "DataQualityStatus", render: (r) => <StatusBadge value={r.DataQualityStatus} /> },
        {
          key: "MetricAvailabilityRate",
          header: "MetricAvailabilityRate",
          numeric: true,
          render: (r) => formatPercent(r.MetricAvailabilityRate),
        },
        {
          key: "CostFullCoverageRate",
          header: "CostFullCoverageRate",
          numeric: true,
          render: (r) => formatPercent(r.CostFullCoverageRate),
        },
        { key: "PricedSavingsRows", header: "PricedSavingsRows", numeric: true, sortValue: (r) => r.PricedSavingsRows ?? 0 },
        { key: "HeuristicSavingsRows", header: "HeuristicSavingsRows", numeric: true, sortValue: (r) => r.HeuristicSavingsRows ?? 0 },
        { key: "IsPublishable", header: "IsPublishable", render: (r) => String(r.IsPublishable) },
        { key: "PublishApproved", header: "PublishApproved", render: (r) => String(r.PublishApproved) },
        {
          key: "duration",
          header: "Duration",
          render: (r) => formatDuration(r.RunStartedAt, r.RunFinishedAt),
        },
      ]}
    />
  );
}
