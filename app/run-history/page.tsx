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

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function CompareCard({ title, run }: { title: string; run: FinOpsRun | null }) {
  if (!run) {
    return (
      <article className="card-surface p-5">
        <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
        <p className="mt-3 text-sm text-slate-500">Select a run to compare.</p>
      </article>
    );
  }
  return (
    <article className="card-surface p-5 space-y-2 text-sm">
      <p className="text-xs uppercase tracking-wide text-cyan-300">{title}</p>
      <p className="text-lg font-semibold text-white">{run.RunId}</p>
      <p>Rows produced: {formatNumber(run.RowsProduced, false)}</p>
      <p>Metric availability: {formatPercent(run.MetricAvailabilityRate)}</p>
      <p>Cost coverage: {formatPercent(run.CostFullCoverageRate)}</p>
      <p>Priced savings rows: {formatNumber(run.PricedSavingsRows, false)}</p>
      <p>Heuristic savings rows: {formatNumber(run.HeuristicSavingsRows, false)}</p>
      <p>
        Data quality: <StatusBadge value={run.DataQualityStatus} />
      </p>
      <p>
        Publication: <StatusBadge value={run.PublishApproved ? "PUBLISHED" : "UNPUBLISHED"} />
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
    { name: "Published", value: published },
    { name: "Not published", value: data.runs.length - published },
  ];

  const currency = "USD";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Runs" value={formatNumber(data.runs.length, false)} />
        <KpiCard label="Published Runs" value={formatNumber(published, false)} accent="green" />
        <KpiCard label="Average Metric Availability" value={formatPercent(avgMetric)} />
        <KpiCard label="Average Cost Coverage" value={formatPercent(avgCost)} accent="teal" />
      </div>

      <ChartCard title="Savings Evolution Across Runs" subtitle="PRICED and HEURISTIC kept as separate series">
        <DualLine data={evolution} currency={currency} />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Metric Availability Trend">
          <AreaTrend data={metricTrend} dataKey="value" />
        </ChartCard>
        <ChartCard title="Cost Coverage Trend">
          <AreaTrend data={costTrend} dataKey="value" color="#38bdf8" />
        </ChartCard>
        <ChartCard title="Published vs Non-Published Runs">
          <DonutChart data={pubDist} />
        </ChartCard>
        <ChartCard title="Run Duration Trend (minutes)">
          <AreaTrend data={durationTrend} dataKey="value" color="#818cf8" />
        </ChartCard>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h3 className="text-sm font-semibold text-white">Run comparison</h3>
          <Suspense fallback={null}>
            <RunComparePicker runs={data.runs} runA={runA} runB={runB} />
          </Suspense>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <CompareCard title="Run A" run={data.comparison?.a ?? null} />
          <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-500">vs</p>
          <CompareCard title="Run B" run={data.comparison?.b ?? null} />
        </div>
      </section>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Run comparison table</h3>
        <RunHistoryTable rows={data.runs} />
      </section>
    </div>
  );
}
