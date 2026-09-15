"use client";

// Client table of the target options of the selected sizing profile.

import { formatMoney } from "@/lib/formatters";
import { DataTable } from "@/components/tables/DataTable";
import { RiskBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import { useDictionary } from "@/lib/i18n/LocaleProvider";
import type { SizingRow } from "@/types/finops";

export function SizingTable({ rows, currency }: { rows: SizingRow[]; currency: string }) {
  const dict = useDictionary();
  return (
    <DataTable<SizingRow>
      rows={rows}
      searchKeys={["ResourceName", "CurrentSku", "TargetSku", "ServiceType"]}
      pageSize={15}
      columns={[
        {
          key: "ResourceName",
          header: dict.sizing.table.resource,
          render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
        },
        { key: "ServiceType", header: dict.sizing.table.service, filterable: true },
        { key: "CurrentSku", header: dict.sizing.table.currentSku },
        { key: "CurrentVCpus", header: dict.sizing.table.currentVcpu, numeric: true, sortValue: (r) => r.CurrentVCpus ?? 0 },
        { key: "CurrentMemoryGB", header: dict.sizing.table.currentMemory, numeric: true, sortValue: (r) => r.CurrentMemoryGB ?? 0 },
        { key: "TargetSku", header: dict.sizing.table.targetSku },
        { key: "TargetVCpus", header: dict.sizing.table.targetVcpu, numeric: true, sortValue: (r) => r.TargetVCpus ?? 0 },
        { key: "TargetMemoryGB", header: dict.sizing.table.targetMemory, numeric: true, sortValue: (r) => r.TargetMemoryGB ?? 0 },
        {
          key: "ProjectedPeakPct",
          header: dict.sizing.table.projectedPeak,
          numeric: true,
          sortValue: (r) => r.ProjectedPeakPct ?? 0,
          render: (r) => (r.ProjectedPeakPct != null ? `${r.ProjectedPeakPct}%` : "—"),
        },
        {
          key: "MonthlySavings",
          header: dict.sizing.table.monthlySavings,
          numeric: true,
          sortValue: (r) => r.MonthlySavings ?? 0,
          render: (r) => formatMoney(r.MonthlySavings, currency),
        },
        { key: "PerformanceRisk", header: dict.sizing.table.performanceRisk, filterable: true, render: (r) => <RiskBadge value={r.PerformanceRisk} /> },
      ]}
    />
  );
}
