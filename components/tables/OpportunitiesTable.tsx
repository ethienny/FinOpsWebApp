"use client";

// Client table for actionable optimization opportunities. Columns and search
// keys are module level constants so DataTable keeps its memoized work stable.

import { formatMoney } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { AgeBadge, ConfidenceBadge, DecisionBadge, MetricStatusBadge, PriorityBadge, ReliabilityBadge, RiskBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { OpportunityRow } from "@/types/finops";
import type { Module } from "@/types/entitlements";
import { useDictionary } from "@/lib/i18n/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

/** Columns that only make sense when their module is in the plan. */
const COLUMN_MODULE: Partial<Record<string, Module>> = {
  decisionLabel: "tracking",
  decisionOwner: "tracking",
  ageLabel: "insights",
  missedSavings: "insights",
  quickWinScore: "insights",
  riskLabel: "insights",
};

const SEARCH_KEYS: Array<keyof OpportunityRow> = [
  "ResourceName",
  "SubscriptionName",
  "ActionLabel",
  "TagOwner",
  "decisionOwner",
];

function columns(dict: Dictionary): Column<OpportunityRow>[] {
  const t = dict.opportunities.table;
  return [
    {
      key: "ResourceName",
      header: t.resourceName,
      render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
    },
    {
      key: "decisionLabel",
      header: t.decision,
      filterable: true,
      render: (r) => <DecisionBadge value={r.decisionStatus} />,
    },
    { key: "decisionOwner", header: t.assignedTo },
    { key: "ServiceType", header: t.serviceType, filterable: true },
    { key: "SubscriptionName", header: t.subscriptionName },
    { key: "ResourceGroup", header: t.resourceGroup },
    { key: "ActionLabel", header: t.actionLabel },
    {
      key: "ageLabel",
      header: t.age,
      filterable: true,
      sortValue: (r) => r.runsOpen,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <AgeBadge value={r.ageLabel} />
          {r.runsOpen ? (
            <span className="text-xs text-slate-400">
              {r.runsOpen} {t.runsSuffix}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "missedSavings",
      header: t.missedSoFar,
      numeric: true,
      sortValue: (r) => r.missedSavings,
      render: (r) => (r.runsOpen > 1 ? formatMoney(r.missedSavings, r.CostCurrency) : "—"),
    },
    {
      key: "quickWinScore",
      header: t.quickWinScore,
      numeric: true,
      sortValue: (r) => r.quickWinScore,
      render: (r) => (r.IsActionable ? String(r.quickWinScore) : "—"),
    },
    {
      key: "riskLabel",
      header: t.executionRisk,
      filterable: true,
      render: (r) => (r.IsActionable ? <RiskBadge value={r.riskLabel} /> : <span className="text-slate-500">—</span>),
    },
    {
      key: "EstimatedMonthlySavings",
      header: t.estimatedMonthlySavings,
      numeric: true,
      sortValue: (r) => r.EstimatedMonthlySavings ?? 0,
      render: (r) => formatMoney(r.EstimatedMonthlySavings, r.CostCurrency),
    },
    {
      key: "SavingsReliability",
      header: t.savingsReliability,
      filterable: true,
      render: (r) => <ReliabilityBadge value={r.SavingsReliability} />,
    },
    { key: "Priority", header: t.priority, filterable: true, render: (r) => <PriorityBadge value={r.Priority} /> },
    { key: "Confidence", header: t.confidence, render: (r) => <ConfidenceBadge value={r.Confidence} /> },
    { key: "TagOwner", header: t.tagOwner, filterable: true },
    { key: "TagEnvironment", header: t.tagEnvironment, filterable: true },
    {
      key: "MetricCollectionStatus",
      header: t.metricCollectionStatus,
      filterable: true,
      render: (r) => <MetricStatusBadge value={r.MetricCollectionStatus} />,
    },
  ];
}

function columnsFor(dict: Dictionary, modules: Module[]): Column<OpportunityRow>[] {
  return columns(dict).filter((c) => {
    const required = COLUMN_MODULE[c.key];
    return !required || modules.includes(required);
  });
}

export function OpportunitiesTable({ rows, modules }: { rows: OpportunityRow[]; modules: Module[] }) {
  const dict = useDictionary();
  return (
    <DataTable<OpportunityRow>
      rows={rows}
      searchKeys={SEARCH_KEYS}
      pageSize={15}
      rowKey={(r) => r.ResourceId}
      columns={columnsFor(dict, modules)}
    />
  );
}
