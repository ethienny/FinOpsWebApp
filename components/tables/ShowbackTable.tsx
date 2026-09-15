"use client";

// Client table of the cost allocation rows for the Showback page.

import { formatMoney, formatPercent } from "@/lib/formatters";
import { DataTable } from "@/components/tables/DataTable";
import type { ShowbackRow } from "@/types/finops";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

export function ShowbackTable({ rows, currency }: { rows: ShowbackRow[]; currency: string }) {
  const dict = useDictionary();
  const t = dict.showback.columns;
  return (
    <DataTable<ShowbackRow>
      rows={rows}
      searchKeys={["owner", "costCenter", "application", "environment"]}
      columns={[
        { key: "owner", header: t.owner, filterable: true },
        { key: "costCenter", header: t.costCenter, filterable: true },
        { key: "application", header: t.application, filterable: true },
        { key: "environment", header: t.environment, filterable: true },
        {
          key: "monthlyCost",
          header: t.monthlyCost,
          numeric: true,
          sortValue: (r) => r.monthlyCost,
          render: (r) => formatMoney(r.monthlyCost, currency, false),
        },
        { key: "resourceCount", header: t.resourceCount, numeric: true, sortValue: (r) => r.resourceCount },
        {
          key: "percentage",
          header: t.percentOfTotal,
          numeric: true,
          sortValue: (r) => r.percentage,
          render: (r) => formatPercent(r.percentage),
        },
      ]}
    />
  );
}
