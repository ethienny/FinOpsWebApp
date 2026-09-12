"use client";

import { formatMoney, formatPercent } from "@/lib/formatters";
import { DataTable } from "@/components/tables/DataTable";
import type { ShowbackRow } from "@/types/finops";

export function ShowbackTable({ rows, currency }: { rows: ShowbackRow[]; currency: string }) {
  return (
    <DataTable<ShowbackRow>
      rows={rows}
      searchKeys={["owner", "costCenter", "application", "environment"]}
      columns={[
        { key: "owner", header: "Owner", filterable: true },
        { key: "costCenter", header: "Cost Center", filterable: true },
        { key: "application", header: "Application", filterable: true },
        { key: "environment", header: "Environment", filterable: true },
        {
          key: "monthlyCost",
          header: "Monthly Cost",
          numeric: true,
          sortValue: (r) => r.monthlyCost,
          render: (r) => formatMoney(r.monthlyCost, currency, false),
        },
        { key: "resourceCount", header: "Resource Count", numeric: true, sortValue: (r) => r.resourceCount },
        {
          key: "percentage",
          header: "% of Total",
          numeric: true,
          sortValue: (r) => r.percentage,
          render: (r) => formatPercent(r.percentage),
        },
      ]}
    />
  );
}
