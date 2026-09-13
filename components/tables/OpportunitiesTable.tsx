"use client";

// Client table for actionable optimization opportunities. Columns and search
// keys are module level constants so DataTable keeps its memoized work stable.

import { formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { AgeBadge, ConfidenceBadge, DecisionBadge, MetricStatusBadge, PriorityBadge, ReliabilityBadge, RiskBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { OpportunityRow } from "@/types/finops";

const SEARCH_KEYS: Array<keyof OpportunityRow> = [
  "ResourceName",
  "SubscriptionName",
  "ActionLabel",
  "TagOwner",
  "decisionOwner",
];

const COLUMNS: Column<OpportunityRow>[] = [
  {
    key: "ResourceName",
    header: "ResourceName",
    render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
  },
  {
    key: "decisionLabel",
    header: "Decision",
    filterable: true,
    render: (r) => <DecisionBadge value={r.decisionStatus} />,
  },
  { key: "decisionOwner", header: "Assigned to" },
  { key: "ServiceType", header: "ServiceType", filterable: true },
  { key: "SubscriptionName", header: "SubscriptionName" },
  { key: "ResourceGroup", header: "ResourceGroup" },
  { key: "ActionLabel", header: "ActionLabel" },
  {
    key: "ageLabel",
    header: "Age",
    filterable: true,
    sortValue: (r) => r.runsOpen,
    render: (r) => (
      <span className="inline-flex items-center gap-2">
        <AgeBadge value={r.ageLabel} />
        {r.runsOpen ? <span className="text-xs text-slate-400">{r.runsOpen} runs</span> : null}
      </span>
    ),
  },
  {
    key: "missedSavings",
    header: "Missed so far",
    numeric: true,
    sortValue: (r) => r.missedSavings,
    render: (r) => (r.runsOpen > 1 ? formatMoney(r.missedSavings, r.CostCurrency) : "—"),
  },
  {
    key: "quickWinScore",
    header: "Quick win score",
    numeric: true,
    sortValue: (r) => r.quickWinScore,
    render: (r) => (r.IsActionable ? String(r.quickWinScore) : "—"),
  },
  {
    key: "riskLabel",
    header: "Execution risk",
    filterable: true,
    render: (r) => (r.IsActionable ? <RiskBadge value={r.riskLabel} /> : <span className="text-slate-500">—</span>),
  },
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
];

export function OpportunitiesTable({ rows }: { rows: OpportunityRow[] }) {
  return (
    <DataTable<OpportunityRow>
      rows={rows}
      searchKeys={SEARCH_KEYS}
      pageSize={15}
      rowKey={(r) => r.ResourceId}
      columns={COLUMNS}
    />
  );
}
