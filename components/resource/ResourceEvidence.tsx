import type { FinOpsRecommendation } from "@/types/finops";
import { formatMoney, formatPercent } from "@/lib/formatters";

const missing = "Not provided";

function display(value: unknown): string {
  if (value == null || value === "") return missing;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function Facts({ items }: { items: Array<[string, unknown]> }) {
  return <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(([label, value]) => (
    <div key={label} className="rounded-xl border border-white/10 p-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-100">{display(value)}</dd>
    </div>
  ))}</dl>;
}

// Preserve supplied field names and nested structure; do not infer units or thresholds.
function EvidenceValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) return value.length ? <div className="space-y-3">{value.map((item, index) => (
    <div key={index} className="rounded-lg border border-white/10 p-3"><EvidenceValue value={item} /></div>
  ))}</div> : <p className="text-sm text-slate-400">No entries supplied.</p>;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    return entries.length ? <dl className="space-y-2">{entries.map(([key, item]) => (
      <div key={key} className="grid gap-1 border-b border-white/5 pb-2 sm:grid-cols-[minmax(120px,1fr)_3fr]">
        <dt className="break-words text-xs text-slate-400">{key}</dt>
        <dd className="min-w-0 break-words text-sm text-slate-100"><EvidenceValue value={item} /></dd>
      </div>
    ))}</dl> : <p className="text-sm text-slate-400">No details supplied.</p>;
  }
  return <span className="whitespace-pre-wrap">{display(value)}</span>;
}

function Evidence({ title, value }: { title: string; value: unknown }) {
  return <section className="rounded-xl border border-white/10 p-4">
    <h4 className="mb-3 text-sm font-semibold text-white">{title}</h4>
    <EvidenceValue value={value} />
  </section>;
}

export function RecommendationEvidence({ r }: { r: FinOpsRecommendation }) {
  const money = (value: number | null) => value == null ? missing : r.CostCurrency ? formatMoney(value, r.CostCurrency, false) : `${value} (currency not provided)`;
  return <section className="card-surface space-y-4 p-5">
    <div>
      <p className="text-xs uppercase tracking-wide text-cyan-300">Recommended action</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{r.ActionLabel || r.RecommendationAction || missing}</h3>
      <p className="mt-2 text-sm text-slate-200">{r.ActionSummary || missing}</p>
      <p className="mt-2 text-sm text-slate-400">Reason: {r.RecommendationReason || missing}</p>
    </div>
    <Facts items={[
      ["Priority", r.Priority], ["Confidence", r.Confidence], ["Actionable", r.IsActionable],
      ["Monthly savings", money(r.EstimatedMonthlySavings)], ["Annual savings", money(r.EstimatedAnnualSavings)],
      ["Savings reliability", r.SavingsReliability], ["Calculation method", r.SavingsCalculationMethod],
      ["Potential monthly cost increase", money(r.EstimatedMonthlyCostIncrease)], ["Destructive action flag", r.IsDestructive],
      ["Withheld reason", r.WithheldReason], ["Target status", r.TargetSkuStatus],
    ]} />
    <p className="text-xs text-slate-400">PRICED: priced savings. HEURISTIC: directional estimate. UNPRICED: no priced savings available. The destructive flag does not describe all execution risks.</p>
    <h4 className="text-sm font-semibold text-white">Current → recommended configuration</h4>
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="text-slate-400"><tr><th scope="col" className="p-2">Setting</th><th scope="col">Current</th><th scope="col">Recommended</th></tr></thead>
      <tbody>{[["SKU", r.CurrentSku, r.TargetSku], ["vCPU", r.CurrentVCpus, r.TargetVCpus], ["Memory (GB)", r.CurrentMemoryGB, r.TargetMemoryGB]].map(([name, current, target]) => (
        <tr key={String(name)} className="border-t border-white/10"><th scope="row" className="p-2 font-normal">{name}</th><td className="p-2">{display(current)}</td><td className="p-2">{display(target)}</td></tr>
      ))}</tbody>
    </table></div>
    <p className="text-xs text-slate-400">Execution prerequisites, approval requirements and a step-by-step procedure were not supplied in the recommendation fields. Profile-specific performance risk is available under Sizing when provided.</p>
  </section>;
}

export function MetricEvidence({ r, detailed = false }: { r: FinOpsRecommendation; detailed?: boolean }) {
  return <section className="card-surface space-y-4 p-5">
    <h3 className="text-base font-semibold text-white">Observed metrics & decision evidence</h3>
    <Facts items={[
      ["Primary metric", r.PrimaryMetric], ["Observed value", r.PrimaryMetricValue],
      ["Average", r.MetricAverage], ["Observed peak", r.ObservedPeak],
      ["Collection status", r.MetricCollectionStatus], ["Coverage", r.MetricCoverageRatio == null ? missing : formatPercent(r.MetricCoverageRatio)],
      ["Collection interval (source value)", r.MetricInterval], ["Metric source", r.MetricSource],
      ["Observed samples", r.MetricDataPoints], ["Expected samples", r.MetricExpectedDataPoints],
      ["Available metrics", r.AvailableMetricCount], ["Missing metrics count", r.MissingMetricCount],
      ["Missing metrics", r.MissingMetrics], ["Analysis run", r.RunId],
    ]} />
    <p className="text-xs text-slate-400">Zero is an observed value; “Not provided” means the field is absent. Collection status identifies incomplete or unavailable collection. The interval is not the analysis window. Units, percentiles, time windows and rule thresholds are shown below only when included in the source evidence.</p>
    <Evidence title="Metric analysis — values supplied by the engine" value={r.MetricAnalysis} />
    <Evidence title="Triggered metric rules — conditions and results supplied by the engine" value={r.TriggeredMetricRules} />
    {detailed ? <>
      <Facts items={[["Standard deviation", r.MetricStandardDeviation], ["Coefficient of variation", r.MetricCoefficientOfVariation], ["Pattern", r.MetricPattern], ["Configured metrics", r.ConfiguredMetricCount], ["Primary property", r.PrimaryProperty], ["Observed property value", r.PrimaryPropertyValue], ["Property condition", r.PropertyCondition], ["Primary property rule", r.PrimaryPropertyRule]]} />
      <Evidence title="All triggered rules" value={r.TriggeredRules} />
      <Evidence title="Property analysis" value={r.PropertyAnalysis} />
      <Evidence title="Triggered property rules" value={r.TriggeredPropertyRules} />
    </> : null}
  </section>;
}
