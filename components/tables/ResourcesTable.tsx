"use client";

import { formatMoney } from "@/lib/formatters";
import { DataTable } from "@/components/tables/DataTable";
import { PriorityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { FinOpsRecommendation } from "@/types/finops";

export function ResourcesTable({ rows }: { rows: FinOpsRecommendation[] }) {
  return (
    <DataTable<FinOpsRecommendation>
      rows={rows}
      searchKeys={["ResourceName", "SubscriptionName", "ResourceGroup", "TagOwner"]}
      pageSize={15}
      columns={[
        {
          key: "ResourceName",
          header: "ResourceName",
          render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
        },
        { key: "ServiceType", header: "ServiceType", filterable: true },
        { key: "TenantName", header: "TenantName", filterable: true },
        { key: "SubscriptionName", header: "SubscriptionName" },
        { key: "ResourceGroup", header: "ResourceGroup" },
        { key: "Location", header: "Location", filterable: true },
        {
          key: "MonthlyCost",
          header: "MonthlyCost",
          numeric: true,
          sortValue: (r) => r.MonthlyCost ?? 0,
          render: (r) => formatMoney(r.MonthlyCost, r.CostCurrency, false),
        },
        { key: "ActionLabel", header: "Recommendation" },
        { key: "Priority", header: "Priority", filterable: true, render: (r) => <PriorityBadge value={r.Priority} /> },
        {
          key: "EstimatedMonthlySavings",
          header: "EstimatedMonthlySavings",
          numeric: true,
          sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
          render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
        },
        { key: "TagOwner", header: "TagOwner", filterable: true },
        { key: "TagEnvironment", header: "TagEnvironment", filterable: true },
      ]}
    />
  );
}
