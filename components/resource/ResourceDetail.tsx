"use client";

// Resource detail view. Summary of the recommendation, savings, insight strip,
// decision panel and the evidence tabs (metrics, properties, sizing, history).

import { MetricEvidence, RecommendationEvidence } from "./ResourceEvidence";
import { useState } from "react";
import type { InsightRow, RecommendationDecision, ResourceDetailData } from "@/types/finops";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { Breadcrumbs } from "@/components/resource/Breadcrumbs";
import {
  ConfidenceBadge,
  PriorityBadge,
  ReliabilityBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/badges";
import { JsonViewer } from "@/components/resource/JsonViewer";
import { ChartCard, DualLine, VerticalBars } from "@/components/charts/Charts";
import { DataTable } from "@/components/tables/DataTable";
import { DecisionPanel } from "@/components/resource/DecisionPanel";
import { InsightStrip } from "@/components/resource/InsightStrip";
import { cn } from "@/lib/cn";
import type { TargetOptionHistory } from "@/types/finops";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

const TAB_KEYS = ["overview", "costUsage", "recommendation", "sizing", "metrics", "history", "json"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const dict = useDictionary();
  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/40 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-all text-sm text-slate-100">
        {value == null || value === "" ? dict.resources.detail.notProvided : typeof value === "boolean" ? String(value) : value}
      </p>
    </div>
  );
}

export function ResourceDetail({
  data,
  decision,
  insight,
  showDecision = true,
  showInsight = true,
}: {
  data: ResourceDetailData;
  decision: RecommendationDecision | null;
  insight: InsightRow | null;
  showDecision?: boolean;
  showInsight?: boolean;
}) {
  const dict = useDictionary();
  const [tab, setTab] = useState<TabKey>("overview");
  const r = data.recommendation;
  const currency = r.CostCurrency || "USD";

  const historyByRun = new Map<string, TargetOptionHistory[]>();
  for (const row of data.history) {
    const list = historyByRun.get(row.RunId) ?? [];
    list.push(row);
    historyByRun.set(row.RunId, list);
  }
  const historyChart = [...historyByRun.entries()].map(([runId, rows]) => {
    const conservative = rows.find((x) => x.Profile === "Conservative") ?? rows[0];
    return {
      name: runId.replace("run-", "").slice(0, 12),
      validated: conservative?.MonthlySavings ?? 0,
      heuristic: 0,
      cost: conservative?.MonthlyCost ?? 0,
    };
  });

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: dict.resources.detail.breadcrumbResources, href: "/resources" }, { label: r.ResourceName }]} />
      <div className="card-surface p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">{r.ServiceType}</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">{r.ResourceName}</h2>
        <p className="mt-2 break-all text-xs text-slate-400">{r.ResourceId}</p>
      </div>

      {showInsight ? <InsightStrip insight={insight} currency={currency} /> : null}

      {showDecision ? <DecisionPanel resourceId={r.ResourceId} runId={r.RunId} decision={decision} /> : null}

      <div className="flex gap-2 overflow-x-auto">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "whitespace-nowrap rounded-xl px-3 py-2 text-sm",
              tab === key ? "bg-cyan-400/15 text-cyan-100" : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            {dict.resources.detail.tabs[key]}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-5">
        <RecommendationEvidence r={r} />
        <MetricEvidence r={r} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="ResourceName" value={r.ResourceName} />
          <Field label="ResourceType" value={r.ResourceType} />
          <Field label="ServiceType" value={r.ServiceType} />
          <Field label="TenantName" value={r.TenantName} />
          <Field label="SubscriptionName" value={r.SubscriptionName} />
          <Field label="ResourceGroup" value={r.ResourceGroup} />
          <Field label="Location" value={r.Location} />
          <Field label="CurrentSku" value={r.CurrentSku} />
          <Field label="PowerState" value={r.PowerState} />
          <Field label="TagOwner" value={r.TagOwner} />
          <Field label="TagApplication" value={r.TagApplication} />
          <Field label="TagEnvironment" value={r.TagEnvironment} />
          <Field label="TagCostCenter" value={r.TagCostCenter} />
        </div>
        </div>
      ) : null}

      {tab === "costUsage" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="MonthlyCost" value={formatMoney(r.MonthlyCost, currency, false)} />
          <Field label="AnnualCost" value={formatMoney(r.AnnualCost, currency, false)} />
          <Field label="CurrentMonthToDateCost" value={formatMoney(r.CurrentMonthToDateCost, currency, false)} />
          <Field label="DailyRunRate" value={formatMoney(r.DailyRunRate, currency, false)} />
          <Field label="CostSource" value={r.CostSource} />
          <Field label="MonthsAvailable" value={formatNumber(r.MonthsAvailable, false)} />
          <Field label="CostCoverageStatus" value={<StatusBadge value={r.CostCoverageStatus} />} />
        </div>
      ) : null}

      {tab === "recommendation" ? (
        <div className="space-y-4">
          <RecommendationEvidence r={r} />
          <MetricEvidence r={r} detailed />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="ActionLabel" value={r.ActionLabel} />
            <Field label="ActionSummary" value={r.ActionSummary} />
            <Field label="RecommendationReason" value={r.RecommendationReason} />
            <Field label="Priority" value={<PriorityBadge value={r.Priority} />} />
            <Field label="Confidence" value={<ConfidenceBadge value={r.Confidence} />} />
            <Field label="SavingsReliability" value={<ReliabilityBadge value={r.SavingsReliability} />} />
            <Field label="EstimatedMonthlySavings" value={formatMoney(r.EstimatedMonthlySavings, currency, false)} />
            <Field label="EstimatedAnnualSavings" value={formatMoney(r.EstimatedAnnualSavings, currency, false)} />
            <Field label="RiskAdjustedMonthlySavings" value={formatMoney(r.RiskAdjustedMonthlySavings, currency, false)} />
            <Field label="RiskAdjustedAnnualSavings" value={formatMoney(r.RiskAdjustedAnnualSavings, currency, false)} />
            <Field label="SavingsCalculationMethod" value={r.SavingsCalculationMethod} />
            <Field label="SavingsMethod" value={r.SavingsMethod} />
          </div>
          {r.SecondaryAction ? (
            <div className="rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4">
              <p className="text-xs uppercase tracking-wide text-violet-200">{dict.resources.detail.alternativeRecommendation}</p>
              <p className="mt-2 text-sm text-white">{r.SecondaryActionLabel || r.SecondaryAction}</p>
              <p className="mt-1 text-xs text-slate-300">
                {dict.resources.detail.secondaryMonthlySavings.replace("{value}", formatMoney(r.SecondaryMonthlySavings, currency))}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "sizing" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {(["Conservative", "Moderate", "Aggressive"] as const).map((profile) => {
            const row = data.sizing.find((s) => s.Profile === profile);
            const profileLabel =
              profile === "Conservative"
                ? dict.resources.detail.profiles.conservative
                : profile === "Moderate"
                  ? dict.resources.detail.profiles.moderate
                  : dict.resources.detail.profiles.aggressive;
            return (
              <article key={profile} className="card-surface p-4">
                <p className="text-xs uppercase tracking-wide text-cyan-300">{profileLabel}</p>
                {row ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      {dict.resources.detail.targetSku}: {row.TargetSku || "—"}
                    </p>
                    <p>
                      {dict.resources.detail.targetVCpu}: {row.TargetVCpus ?? "—"}
                    </p>
                    <p>
                      {dict.resources.detail.targetMemoryGb}: {row.TargetMemoryGB ?? "—"}
                    </p>
                    <p>
                      {dict.resources.detail.projectedPeak}: {row.ProjectedPeakPct != null ? `${row.ProjectedPeakPct}%` : "—"}
                    </p>
                    <p>
                      {dict.resources.detail.monthlySavingsLabel}: {formatMoney(row.MonthlySavings, currency)}
                    </p>
                    <p>
                      {dict.resources.detail.performanceRisk}: <RiskBadge value={row.PerformanceRisk} />
                    </p>
                    <p>
                      {dict.resources.detail.statusLabel}: <StatusBadge value={row.Status} />
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">{dict.resources.detail.noSizingOption}</p>
                )}
              </article>
            );
          })}
        </div>
      ) : null}

      {tab === "metrics" ? <MetricEvidence r={r} detailed /> : null}

      {tab === "history" ? (
        <div className="space-y-4">
          <ChartCard title={dict.resources.detail.chartSizingSavings}>
            <DualLine data={historyChart} currency={currency} />
          </ChartCard>
          <ChartCard title={dict.resources.detail.chartOfficialConservative}>
            <VerticalBars
              data={data.history.map((h) => ({ name: `${h.RunId.slice(-12)}/${h.Profile}`, value: h.MonthlySavings ?? 0 }))}
              currency={currency}
            />
          </ChartCard>
          <DataTable<TargetOptionHistory>
            rows={data.history}
            columns={[
              { key: "RunId", header: "RunId" },
              { key: "RunStatus", header: "RunStatus", render: (x) => <StatusBadge value={x.RunStatus} /> },
              { key: "RunScope", header: "RunScope" },
              { key: "DataQualityStatus", header: "DataQualityStatus", render: (x) => <StatusBadge value={x.DataQualityStatus} /> },
              { key: "IsPublishable", header: "IsPublishable", render: (x) => String(x.IsPublishable) },
              { key: "Profile", header: "Profile", filterable: true },
              { key: "TargetSku", header: "TargetSku" },
              {
                key: "MonthlySavings",
                header: "MonthlySavings",
                numeric: true,
                sortValue: (x) => x.MonthlySavings ?? 0,
                render: (x) => formatMoney(x.MonthlySavings, currency),
              },
            ]}
          />
        </div>
      ) : null}

      {tab === "json" ? (
        <div className="space-y-3">
          <JsonViewer title="TriggeredRules" value={r.TriggeredRules} />
          <JsonViewer title="TriggeredMetricRules" value={r.TriggeredMetricRules} />
          <JsonViewer title="TriggeredPropertyRules" value={r.TriggeredPropertyRules} />
          <JsonViewer title="MetricAnalysis" value={r.MetricAnalysis} />
          <JsonViewer title="PropertyAnalysis" value={r.PropertyAnalysis} />
        </div>
      ) : null}
    </div>
  );
}
