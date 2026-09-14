"use client";

// Client table of the target options of the selected sizing profile.

import { formatMoney } from "@/lib/formatters";
import { DataTable } from "@/components/tables/DataTable";
import { RiskBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { SizingRow } from "@/types/finops";

export function SizingTable({ rows, currency }: { rows: SizingRow[]; currency: string }) {
  return (
    <DataTable<SizingRow>
      rows={rows}
      searchKeys={["ResourceName", "CurrentSku", "TargetSku", "ServiceType"]}
      pageSize={15}
      columns={[
        {
          key: "ResourceName",
          header: "Resource",
          render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
        },
        { key: "ServiceType", header: "Service", filterable: true },
        { key: "CurrentSku", header: "Current SKU" },
        { key: "CurrentVCpus", header: "Current vCPU", numeric: true, sortValue: (r) => r.CurrentVCpus ?? 0 },
        { key: "CurrentMemoryGB", header: "Current Memory", numeric: true, sortValue: (r) => r.CurrentMemoryGB ?? 0 },
        { key: "TargetSku", header: "Target SKU" },
        { key: "TargetVCpus", header: "Target vCPU", numeric: true, sortValue: (r) => r.TargetVCpus ?? 0 },
        { key: "TargetMemoryGB", header: "Target Memory", numeric: true, sortValue: (r) => r.TargetMemoryGB ?? 0 },
        {
          key: "ProjectedPeakPct",
          header: "Projected Peak",
          numeric: true,
          sortValue: (r) => r.ProjectedPeakPct ?? 0,
          render: (r) => (r.ProjectedPeakPct != null ? `${r.ProjectedPeakPct}%` : "—"),
        },
        {
          key: "MonthlySavings",
          header: "Monthly Savings",
          numeric: true,
          sortValue: (r) => r.MonthlySavings ?? 0,
          render: (r) => formatMoney(r.MonthlySavings, currency),
        },
        { key: "PerformanceRisk", header: "Performance Risk", filterable: true, render: (r) => <RiskBadge value={r.PerformanceRisk} /> },
      ]}
    />
  );
}
