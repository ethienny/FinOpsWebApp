// Evidence blocks of the resource detail: the facts behind the recommendation
// and the metric analysis, rendered as label and value lists.

"use client";

import type { FinOpsRecommendation } from "@/types/finops";
import { formatMoney, formatPercent } from "@/lib/formatters";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

function display(value: unknown, missing: string): string {
  if (value == null || value === "") return missing;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function Facts({ items, missing }: { items: Array<[string, unknown]>; missing: string }) {
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => (
    <div key={label} className="rounded-xl border border-white/10 p-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-100">{display(value, missing)}</dd>
    </div>
  ))}</dl>;
}

// Preserve supplied field names and nested structure; do not infer units or thresholds.
function EvidenceValue({ value, missing, noEntries, noDetails }: { value: unknown; missing: string; noEntries: string; noDetails: string }) {
  if (Array.isArray(value)) return value.length ? <div className="space-y-3">{value.map((item, index) => (
    <div key={index} className="rounded-lg border border-white/10 p-3"><EvidenceValue value={item} missing={missing} noEntries={noEntries} noDetails={noDetails} /></div>
  ))}</div> : <p className="text-sm text-slate-400">{noEntries}</p>;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    return entries.length ? <dl className="space-y-2">{entries.map(([key, item]) => (
      <div key={key} className="grid gap-1 border-b border-white/5 pb-2 sm:grid-cols-[minmax(120px,1fr)_3fr]">
        <dt className="break-words text-xs text-slate-400">{key}</dt>
        <dd className="min-w-0 break-words text-sm text-slate-100"><EvidenceValue value={item} missing={missing} noEntries={noEntries} noDetails={noDetails} /></dd>
      </div>
    ))}</dl> : <p className="text-sm text-slate-400">{noDetails}</p>;
  }
  return <span className="whitespace-pre-wrap">{display(value, missing)}</span>;
}

function Evidence({ title, value, missing, noEntries, noDetails }: { title: string; value: unknown; missing: string; noEntries: string; noDetails: string }) {
  return <section className="rounded-xl border border-white/10 p-4">
    <h4 className="mb-3 text-sm font-semibold text-white">{title}</h4>
    <EvidenceValue value={value} missing={missing} noEntries={noEntries} noDetails={noDetails} />
  </section>;
}

export function RecommendationEvidence({ r }: { r: FinOpsRecommendation }) {
  const dict = useDictionary();
  const e = dict.resources.evidence;
  const missing = dict.resources.detail.notProvided;
  const money = (value: number | null) => value == null ? missing : r.CostCurrency ? formatMoney(value, r.CostCurrency, false) : `${value} (currency not provided)`;
  return <section className="card-surface space-y-4 p-5">
    <div>
      <p className="text-xs uppercase tracking-wide text-cyan-300">{e.recommendedAction}</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{r.ActionLabel || r.RecommendationAction || missing}</h3>
      <p className="mt-2 text-sm text-slate-200">{r.ActionSummary || missing}</p>
      <p className="mt-2 text-sm text-slate-400">{e.reason}: {r.RecommendationReason || missing}</p>
    </div>
    <Facts
      missing={missing}
      items={[
        [e.priority, r.Priority], [e.confidence, r.Confidence], [e.actionable, r.IsActionable],
        [e.monthlySavings, money(r.EstimatedMonthlySavings)], [e.annualSavings, money(r.EstimatedAnnualSavings)],
        [e.savingsReliability, r.SavingsReliability], [e.calculationMethod, r.SavingsCalculationMethod],
        [e.potentialMonthlyCostIncrease, money(r.EstimatedMonthlyCostIncrease)], [e.destructiveActionFlag, r.IsDestructive],
        [e.withheldReason, r.WithheldReason], [e.targetStatus, r.TargetSkuStatus],
      ]}
    />
    <p className="text-xs text-slate-400">{e.reliabilityLegend}</p>
    <h4 className="text-sm font-semibold text-white">{e.currentToRecommended}</h4>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="text-slate-400"><tr><th scope="col" className="p-2">{e.setting}</th><th scope="col">{e.current}</th><th scope="col">{e.recommended}</th></tr></thead>
      <tbody>{[[e.sku, r.CurrentSku, r.TargetSku], [e.vcpu, r.CurrentVCpus, r.TargetVCpus], [e.memoryGb, r.CurrentMemoryGB, r.TargetMemoryGB]].map(([name, current, target]) => (
        <tr key={String(name)} className="border-t border-white/10"><th scope="row" className="p-2 font-normal">{name}</th><td className="p-2">{display(current, missing)}</td><td className="p-2">{display(target, missing)}</td></tr>
      ))}</tbody>
    </table></div>
    <p className="text-xs text-slate-400">{e.executionCaveat}</p>
  </section>;
}

export function MetricEvidence({ r, detailed = false }: { r: FinOpsRecommendation; detailed?: boolean }) {
  const dict = useDictionary();
  const e = dict.resources.evidence;
  const missing = dict.resources.detail.notProvided;
  return <section className="card-surface space-y-4 p-5">
    <h3 className="text-base font-semibold text-white">{e.observedMetricsHeading}</h3>
    <Facts
      missing={missing}
      items={[
        [e.primaryMetric, r.PrimaryMetric], [e.observedValue, r.PrimaryMetricValue],
        [e.average, r.MetricAverage], [e.observedPeak, r.ObservedPeak],
        [e.collectionStatus, r.MetricCollectionStatus], [e.coverage, r.MetricCoverageRatio == null ? missing : formatPercent(r.MetricCoverageRatio)],
        [e.collectionInterval, r.MetricInterval], [e.metricSource, r.MetricSource],
        [e.observedSamples, r.MetricDataPoints], [e.expectedSamples, r.MetricExpectedDataPoints],
        [e.availableMetrics, r.AvailableMetricCount], [e.missingMetricsCount, r.MissingMetricCount],
        [e.missingMetrics, r.MissingMetrics], [e.analysisRun, r.RunId],
      ]}
    />
    <p className="text-xs text-slate-400">{e.metricsCaveat}</p>
    <Evidence title={e.metricAnalysisTitle} value={r.MetricAnalysis} missing={missing} noEntries={e.noEntriesSupplied} noDetails={e.noDetailsSupplied} />
    <Evidence title={e.triggeredMetricRulesTitle} value={r.TriggeredMetricRules} missing={missing} noEntries={e.noEntriesSupplied} noDetails={e.noDetailsSupplied} />
    {detailed ? <>
      <Facts
        missing={missing}
        items={[
          [e.standardDeviation, r.MetricStandardDeviation], [e.coefficientOfVariation, r.MetricCoefficientOfVariation],
          [e.pattern, r.MetricPattern], [e.configuredMetrics, r.ConfiguredMetricCount],
          [e.primaryProperty, r.PrimaryProperty], [e.observedPropertyValue, r.PrimaryPropertyValue],
          [e.propertyCondition, r.PropertyCondition], [e.primaryPropertyRule, r.PrimaryPropertyRule],
        ]}
      />
      <Evidence title={e.allTriggeredRulesTitle} value={r.TriggeredRules} missing={missing} noEntries={e.noEntriesSupplied} noDetails={e.noDetailsSupplied} />
      <Evidence title={e.propertyAnalysisTitle} value={r.PropertyAnalysis} missing={missing} noEntries={e.noEntriesSupplied} noDetails={e.noDetailsSupplied} />
      <Evidence title={e.triggeredPropertyRulesTitle} value={r.TriggeredPropertyRules} missing={missing} noEntries={e.noEntriesSupplied} noDetails={e.noDetailsSupplied} />
    </> : null}
  </section>;
}
