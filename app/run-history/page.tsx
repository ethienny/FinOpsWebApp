// Run History page. Trends across engine runs (savings, metric availability,
// cost coverage, duration) and a side by side comparison of two runs chosen
// in the query string.

import { requireModule } from "@/lib/entitlements/gate";
import { RunHistoryTable } from "@/components/tables/RunHistoryTable";
import { Suspense } from "react";
import { getRepository } from "@/lib/repositories";
import { formatNumber, formatPercent } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartCard, AreaTrend, DonutChart, DualLine } from "@/components/charts/Charts";
import { StatusBadge } from "@/components/badges";
import { RunComparePicker } from "@/components/filters/RunComparePicker";
import type { FinOpsRun } from "@/types/finops";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Dictionary } from "@/lib/i18n/dictionary";

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function CompareCard({ title, run, dict }: { title: string; run: FinOpsRun | null; dict: Dictionary }) {
  const t = dict.runHistory.comparison;
  if (!run) {
    return (
      <article className="card-surface p-5">
        <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
        <p className="mt-3 text-sm text-slate-500">{t.selectToCompare}</p>
      </article>
    );
  }
  return (
    <article className="card-surface p-5 space-y-2 text-sm">
      <p className="text-xs uppercase tracking-wide text-cyan-300">{title}</p>
      <p className="text-lg font-semibold text-white">{run.RunId}</p>
      <p>
        {t.rowsProduced}: {formatNumber(run.RowsProduced, false)}
      </p>
      <p>
        {t.metricAvailability}: {formatPercent(run.MetricAvailabilityRate)}
      </p>
      <p>
        {t.costCoverage}: {formatPercent(run.CostFullCoverageRate)}
      </p>
      <p>
        {t.pricedSavingsRows}: {formatNumber(run.PricedSavingsRows, false)}
      </p>
      <p>
        {t.heuristicSavingsRows}: {formatNumber(run.HeuristicSavingsRows, false)}
      </p>
      <p>
        {t.dataQuality}: <StatusBadge value={run.DataQualityStatus} />
      </p>
      <p>
        {t.publication}: <StatusBadge value={run.PublishApproved ? "PUBLISHED" : "UNPUBLISHED"} />
      </p>
    </article>
  );
}

export default async function RunHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireModule("governance");
  if (gate.locked) return gate.locked;
  const dict = getDictionary(await getLocale());
  const t = dict.runHistory;
  const sp = await searchParams;
  const runA = one(sp.runA);
  const runB = one(sp.runB);
  const data = await getRepository().getRunHistory(runA, runB);
  const published = data.runs.filter((r) => r.PublishApproved).length;
  const avgMetric =
    data.runs.reduce((a, r) => a + (r.MetricAvailabilityRate ?? 0), 0) / Math.max(data.runs.length, 1);
  const avgCost =
    data.runs.reduce((a, r) => a + (r.CostFullCoverageRate ?? 0), 0) / Math.max(data.runs.length, 1);

  const evolution = data.savingsEvolution.map((p) => ({
    name: p.runId.replace("run-", "").slice(0, 14),
    validated: p.validatedSavings,
    heuristic: p.estimatedOpportunity,
    cost: p.monthlyCost,
  }));

  const metricTrend = data.runs
    .slice()
    .sort((a, b) => a.RunStartedAt.localeCompare(b.RunStartedAt))
    .map((r) => ({ name: r.RunId.slice(-12), value: (r.MetricAvailabilityRate ?? 0) * 100 }));
  const costTrend = data.runs
    .slice()
    .sort((a, b) => a.RunStartedAt.localeCompare(b.RunStartedAt))
    .map((r) => ({ name: r.RunId.slice(-12), value: (r.CostFullCoverageRate ?? 0) * 100 }));
  const durationTrend = data.runs
    .slice()
    .sort((a, b) => a.RunStartedAt.localeCompare(b.RunStartedAt))
    .map((r) => ({
      name: r.RunId.slice(-12),
      value: Math.round((new Date(r.RunFinishedAt).getTime() - new Date(r.RunStartedAt).getTime()) / 60000),
    }));
  const pubDist = [
    { name: t.charts.published, value: published },
    { name: t.charts.notPublished, value: data.runs.length - published },
  ];

  const currency = "USD";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t.kpi.totalRuns} value={formatNumber(data.runs.length, false)} />
        <KpiCard label={t.kpi.publishedRuns} value={formatNumber(published, false)} accent="green" />
        <KpiCard label={t.kpi.avgMetricAvailability} value={formatPercent(avgMetric)} />
        <KpiCard label={t.kpi.avgCostCoverage} value={formatPercent(avgCost)} accent="teal" />
      </div>

      <ChartCard title={t.charts.savingsEvolutionTitle} subtitle={t.charts.savingsEvolutionSubtitle}>
        <DualLine data={evolution} currency={currency} />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={t.charts.metricAvailabilityTrend}>
          <AreaTrend data={metricTrend} dataKey="value" />
        </ChartCard>
        <ChartCard title={t.charts.costCoverageTrend}>
          <AreaTrend data={costTrend} dataKey="value" color="#38bdf8" />
        </ChartCard>
        <ChartCard title={t.charts.publishedVsNotPublished}>
          <DonutChart data={pubDist} />
        </ChartCard>
        <ChartCard title={t.charts.runDurationTrend}>
          <AreaTrend data={durationTrend} dataKey="value" color="#818cf8" />
        </ChartCard>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h3 className="text-sm font-semibold text-white">{t.comparison.heading}</h3>
          <Suspense fallback={null}>
            <RunComparePicker runs={data.runs} runA={runA} runB={runB} />
          </Suspense>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <CompareCard title={t.comparison.runA} run={data.comparison?.a ?? null} dict={dict} />
          <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-500">{t.comparison.vs}</p>
          <CompareCard title={t.comparison.runB} run={data.comparison?.b ?? null} dict={dict} />
        </div>
      </section>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">{t.comparison.tableHeading}</h3>
        <RunHistoryTable rows={data.runs} />
      </section>
    </div>
  );
}
