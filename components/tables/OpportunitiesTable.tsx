"use client";

import { formatMoney } from "@/lib/formatters";
import { DataTable } from "@/components/tables/DataTable";
import { ConfidenceBadge, MetricStatusBadge, PriorityBadge, ReliabilityBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { FinOpsRecommendation } from "@/types/finops";

export function OpportunitiesTable({ rows }: { rows: FinOpsRecommendation[] }) {
  return (
    <DataTable<FinOpsRecommendation>
      rows={rows}
      searchKeys={["ResourceName", "SubscriptionName", "ActionLabel", "TagOwner"]}
      pageSize={15}
      columns={[
        {
          key: "ResourceName",
          header: "ResourceName",
          render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
        },
        { key: "ServiceType", header: "ServiceType", filterable: true },
        { key: "SubscriptionName", header: "SubscriptionName" },
        { key: "ResourceGroup", header: "ResourceGroup" },
        { key: "ActionLabel", header: "ActionLabel" },
        { key: "ActionSummary", header: "ActionSummary" },
        {
          key: "EstimatedMonthlySavings",
          header: "EstimatedMonthlySavings",
          numeric: true,
          sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
          render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
        },
        {
          key: "SavingsReliability",
          header: "SavingsReliability",
          filterable: true,
          render: (r) => <ReliabilityBadge value={r.SavingsReliability} />,
        },
        { key: "Priority", header: "Priority", filterable: true, render: (r) => <PriorityBadge value={r.Priority} /> },
        { key: "Confidence", header: "Confidence", render: (r) => <ConfidenceBadge value={r.Confidence} /> },
        { key: "TagOwner", header: "TagOwner", filterable: true },
        { key: "TagEnvironment", header: "TagEnvironment", filterable: true },
        {
          key: "MetricCollectionStatus",
          header: "MetricCollectionStatus",
          filterable: true,
          render: (r) => <MetricStatusBadge value={r.MetricCollectionStatus} />,
        },
      ]}
    />
  );
}
