// Executive page. Headline figures for the current scope with links into the
// pages that hold the detail: Tracking for decisions, Insights for aging and
// quick wins, Engine Health for run quality.

import Link from "next/link";
import { ExecutiveResourcesTable } from "@/components/tables/ExecutiveResourcesTable";
import { agingSummary } from "@/lib/insights/metrics";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { getDecisionTracking } from "@/lib/decisions/service";
import { getEntitlements } from "@/lib/entitlements/store";
import { hasModule } from "@/lib/entitlements/catalog";
import { formatMoney, formatNumber, formatDate } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { StatusBadge } from "@/components/badges";
import { ChartCard, GroupedBars, HorizontalBars } from "@/components/charts/Charts";

export default async function ExecutivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = filtersFromSearchParams(sp);
  const [data, tracking, entitlements] = await Promise.all([
    getRepository().getExecutiveData(filters),
    getDecisionTracking(filters),
    getEntitlements(),
  ]);
  const showTracking = hasModule(entitlements, "tracking");
  const showInsights = hasModule(entitlements, "insights");
  const run = data.publishedRun;
  const aging = agingSummary(tracking.rows);
  const quickWinCount = tracking.rows.filter(
    (r) => r.isQuickWin && r.decisionStatus !== "done" && r.decisionStatus !== "dismissed",
  ).length;

  return (
    <div className="space-y-6">
      {run ? (
        <section className="card-surface flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-xs uppercase tracking-[0.16em] text-cyan-300">Latest Published Run</span>
            <span className="text-white">{run.RunId}</span>
            <span className="text-slate-400">Engine {run.EngineVersion}</span>
            <span className="text-slate-400">Published {formatDate(run.PublishedAt)}</span>
            <StatusBadge value={run.DataQualityStatus} />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/report" className="text-xs text-cyan-200 hover:text-white">
              Executive report
            </Link>
            <Link href="/engine-health" className="text-xs text-cyan-200 hover:text-white">
              Engine health
            </Link>
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
          hint="Directional only, not official priced savings"
          accent="amber"
        />
        <KpiCard
          label="Actionable Resources"
          value={formatNumber(data.actionableResources, false)}
          hint="COUNT where IsActionable = true"
          accent="blue"
        />
      </div>

      {showTracking || showInsights ? (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {showTracking ? (
        <KpiCard
          label="Realized Savings"
          value={formatMoney(tracking.savings.realized, data.currency)}
          hint="PRICED recommendations marked done"
          accent="green"
          href="/tracking"
          linkLabel="Open tracking"
        />
        ) : null}
        {showTracking ? (
        <KpiCard
          label="Savings In Progress"
          value={formatMoney(tracking.savings.inProgress, data.currency)}
          hint="Accepted or in progress"
          accent="teal"
          href="/tracking"
          linkLabel="Open tracking"
        />
        ) : null}
        {showInsights ? (
        <KpiCard
          label="Missed Savings To Date"
          value={formatMoney(aging.missedSavings, data.currency)}
          hint={`${formatNumber(aging.persistentCount, false)} recommendations open for 5 or more runs`}
          accent="amber"
          href="/insights"
          linkLabel="Open insights"
        />
        ) : null}
        {showInsights ? (
        <KpiCard
          label="Quick Wins Available"
          value={formatNumber(quickWinCount, false)}
          hint="High value, low execution risk, not yet done"
          accent="cyan"
          href="/insights"
          linkLabel="Open insights"
        />
        ) : null}
      </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Cost vs Savings by Service Type" subtitle="Cost from latest run vs PRICED savings">
          <GroupedBars data={data.costVsSavingsByService} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Savings by Action Category">
          <HorizontalBars data={data.savingsByAction} currency={data.currency} />
        </ChartCard>
      </div>

      <section className="card-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Top 10 Resources by Validated Savings</h3>
          <Link href="/opportunities" className="text-xs text-cyan-200 hover:text-white">
            All opportunities
          </Link>
        </div>
        <ExecutiveResourcesTable rows={data.topResources} />
      </section>
    </div>
  );
}
