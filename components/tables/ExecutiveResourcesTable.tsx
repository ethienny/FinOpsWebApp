"use client";

import { formatMoney } from "@/lib/formatters";
import { DataTable } from "@/components/tables/DataTable";
import { PriorityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { FinOpsRecommendation } from "@/types/finops";

export function ExecutiveResourcesTable({ rows }: { rows: FinOpsRecommendation[] }) {
  return (
    <DataTable<FinOpsRecommendation>
      rows={rows}
      searchKeys={["ResourceName", "SubscriptionName", "ServiceType"]}
      columns={[
        {
          key: "ResourceName",
          header: "Resource",
          render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
        },
        { key: "ServiceType", header: "Service" },
        { key: "SubscriptionName", header: "Subscription" },
        { key: "ActionLabel", header: "Action" },
        {
          key: "EstimatedMonthlySavings",
          header: "Savings",
          numeric: true,
          sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
          render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
        },
        { key: "Priority", header: "Priority", render: (r) => <PriorityBadge value={r.Priority} /> },
      ]}
    />
  );
}
