import Link from "next/link";
import { ExecutiveResourcesTable } from "@/components/tables/ExecutiveResourcesTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { getDecisionTracking } from "@/lib/decisions/service";
import { formatMoney, formatNumber, formatPercent, formatDate } from "@/lib/formatters";
import { KpiCard, QualityMetricCard } from "@/components/kpi/KpiCard";
import { ChartCard, DonutChart, GroupedBars, HorizontalBars, VerticalBars } from "@/components/charts/Charts";

export default async function ExecutivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = filtersFromSearchParams(sp);
  const [data, tracking] = await Promise.all([
    getRepository().getExecutiveData(filters),
    getDecisionTracking(filters),
  ]);
  const run = data.publishedRun;

  return (
    <div className="space-y-6">
      {run ? (
        <section className="card-surface overflow-hidden p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Latest Published Run</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Run completed successfully and published</h2>
              <p className="mt-2 text-sm text-slate-400">
                {run.RunId} · Engine {run.EngineVersion} · Published {formatDate(run.PublishedAt)}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QualityMetricCard label="Metrics Availability" value={formatPercent(run.MetricAvailabilityRate)} />
            <QualityMetricCard label="Metrics Completeness" value={formatPercent(run.MetricCompletenessRate)} />
            <QualityMetricCard label="Cost Availability" value={formatPercent(run.CostAvailabilityRate)} />
            <QualityMetricCard label="Full Cost Coverage" value={formatPercent(run.CostFullCoverageRate)} />
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100">
          No official execution currently published.
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Monthly Cost Analyzed" value={formatMoney(data.monthlyCost, data.currency)} hint="SUM(MonthlyCost) on latest complete run" />
        <KpiCard
          label="Validated Savings (PRICED)"
          value={formatMoney(data.validatedSavings, data.currency)}
          hint="Never combined with heuristic savings"
          accent="green"
        />
        <KpiCard
          label="Estimated Opportunity (HEURISTIC)"
          value={formatMoney(data.estimatedOpportunity, data.currency)}
          hint="Directional only — not official priced savings"
          accent="amber"
        />
        <KpiCard
          label="Actionable Resources"
          value={formatNumber(data.actionableResources, false)}
          hint="COUNT where IsActionable = true"
          accent="blue"
        />
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recommendation Tracking</h3>
            <p className="text-xs text-slate-400">What the teams decided and delivered on the current scope. PRICED savings only.</p>
          </div>
          <Link href="/tracking" className="text-xs text-cyan-200 hover:text-white">
            Open tracking
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Savings In Progress"
            value={formatMoney(tracking.savings.inProgress, data.currency)}
            hint="Accepted or in progress"
            accent="blue"
          />
          <KpiCard
            label="Realized Savings"
            value={formatMoney(tracking.savings.realized, data.currency)}
            hint="Recommendations marked done"
            accent="green"
          />
          <KpiCard
            label="Recommendations Decided"
            value={formatNumber(tracking.savings.decided, false)}
            hint="Any status other than open"
            accent="teal"
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Cloud Cost by Service Type">
          <VerticalBars data={data.costByService} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Savings by Service Type" subtitle="PRICED savings only">
          <VerticalBars data={data.savingsByService} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Savings by Owner" subtitle="PRICED savings only">
          <HorizontalBars data={data.savingsByOwner} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Savings by Action Category">
          <HorizontalBars data={data.savingsByAction} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Savings Reliability Distribution">
          <DonutChart data={data.reliabilityDistribution} />
        </ChartCard>
        <ChartCard title="Priority Distribution">
          <DonutChart data={data.priorityDistribution} />
        </ChartCard>
      </div>

      <ChartCard title="Cost vs Savings by Service Type" subtitle="Cost from latest run vs PRICED savings">
        <GroupedBars data={data.costVsSavingsByService} currency={data.currency} />
      </ChartCard>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Top 10 Resources by Validated Savings</h3>
        <ExecutiveResourcesTable rows={data.topResources} />
      </section>
    </div>
  );
}
