"use client";

// Client table of every engine run for the Engine Health page.

import { DataTable } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/badges";
import type { FinOpsRun } from "@/types/finops";
import { useDictionary, useFormatters } from "@/lib/i18n/LocaleProvider";

export function EngineHealthRunsTable({ rows }: { rows: FinOpsRun[] }) {
  const dict = useDictionary();
  const { formatDate } = useFormatters();
  return (
    <DataTable<FinOpsRun>
      rows={rows}
      columns={[
        { key: "RunId", header: "RunId" },
        { key: "RunStartedAt", header: dict.engineHealth.table.started, render: (r) => formatDate(r.RunStartedAt) },
        { key: "RunFinishedAt", header: dict.engineHealth.table.finished, render: (r) => formatDate(r.RunFinishedAt) },
        { key: "RunScope", header: "RunScope", filterable: true },
        { key: "RunStatus", header: "RunStatus", render: (r) => <StatusBadge value={r.RunStatus} /> },
        { key: "DataQualityStatus", header: "DataQualityStatus", render: (r) => <StatusBadge value={r.DataQualityStatus} /> },
        { key: "IsPublishable", header: "IsPublishable", render: (r) => String(r.IsPublishable) },
        {
          key: "PublishApproved",
          header: "PublishApproved",
          render: (r) => <StatusBadge value={r.PublishApproved ? "PUBLISHED" : "UNPUBLISHED"} />,
        },
        { key: "EngineVersion", header: "EngineVersion" },
        {
          key: "BillingCurrency",
          header: "BillingCurrency",
          filterable: true,
          render: (r) => (r.BillingCurrencyRate && r.BillingCurrency !== "USD" ? `${r.BillingCurrency} (${r.BillingCurrencyRate})` : r.BillingCurrency),
        },
        { key: "RowsProduced", header: "RowsProduced", numeric: true, sortValue: (r) => r.RowsProduced ?? 0 },
      ]}
    />
  );
}
