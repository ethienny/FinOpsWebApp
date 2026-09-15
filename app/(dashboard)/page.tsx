// Executive page. Headline figures for the current scope with links into the
// pages that hold the detail: Tracking for decisions, Insights for aging and
// quick wins, Engine Health for run quality.

import Link from "next/link";
import { ExecutiveResourcesTable } from "@/components/tables/ExecutiveResourcesTable";
import { agingSummary } from "@/lib/insights/metrics";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { getDecisionTracking } from "@/lib/decisions/service";
import { getRunChanges } from "@/lib/insights/service";
import { getEntitlements } from "@/lib/entitlements/store";
import { hasModule } from "@/lib/entitlements/catalog";
import { formatMoney, formatNumber, formatDate } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { StatusBadge } from "@/components/badges";
import { ChartCard, GroupedBars, HorizontalBars } from "@/components/charts/Charts";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { decisionLabelsFromDict } from "@/lib/i18n/decision-labels";

export default async function ExecutivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = getDictionary(await getLocale());
  const sp = await searchParams;
  const filters = filtersFromSearchParams(sp);
  const [data, tracking, entitlements] = await Promise.all([
    getRepository().getExecutiveData(filters),
    getDecisionTracking(filters, decisionLabelsFromDict(dict)),
    getEntitlements(),
  ]);
  const showTracking = hasModule(entitlements, "tracking");
  const showInsights = hasModule(entitlements, "insights");
  const changes = showInsights ? await getRunChanges(filters) : null;
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
            <span className="text-xs uppercase tracking-[0.16em] text-cyan-300">{dict.home.latestRun.label}</span>
            <span className="text-white">{run.RunId}</span>
            <span className="text-slate-400">{dict.home.latestRun.engine} {run.EngineVersion}</span>
            <span className="text-slate-400">{dict.home.latestRun.published} {formatDate(run.PublishedAt)}</span>
            <StatusBadge value={run.DataQualityStatus} />
          </div>
          <div className="flex items-center gap-4">
            {changes?.previousRun ? (
              <Link href="/changes" className="text-xs text-cyan-200 hover:text-white">
                {dict.home.latestRun.sincePreviousRun
                  .replace("{new}", String(changes.summary.newCount))
                  .replace("{resolved}", String(changes.summary.resolvedCount))}
              </Link>
            ) : null}
            <Link href="/report" className="text-xs text-cyan-200 hover:text-white">
              {dict.home.latestRun.executiveReport}
            </Link>
            <Link href="/engine-health" className="text-xs text-cyan-200 hover:text-white">
              {dict.home.latestRun.engineHealth}
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100">
          {dict.home.latestRun.noPublishedRun}
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={dict.home.kpi.monthlyCostAnalyzed.label}
          value={formatMoney(data.monthlyCost, data.currency)}
          hint={dict.home.kpi.monthlyCostAnalyzed.hint}
        />
        <KpiCard
          label={dict.home.kpi.validatedSavingsPriced.label}
          value={formatMoney(data.validatedSavings, data.currency)}
          hint={dict.home.kpi.validatedSavingsPriced.hint}
          accent="green"
        />
        <KpiCard
          label={dict.home.kpi.estimatedOpportunityHeuristic.label}
          value={formatMoney(data.estimatedOpportunity, data.currency)}
          hint={dict.home.kpi.estimatedOpportunityHeuristic.hint}
          accent="amber"
        />
        <KpiCard
          label={dict.home.kpi.actionableResources.label}
          value={formatNumber(data.actionableResources, false)}
          hint={dict.home.kpi.actionableResources.hint}
          accent="blue"
        />
      </div>

      {showTracking || showInsights ? (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {showTracking ? (
        <KpiCard
          label={dict.home.kpi.realizedSavings.label}
          value={formatMoney(tracking.savings.realized, data.currency)}
          hint={dict.home.kpi.realizedSavings.hint}
          accent="green"
          href="/tracking"
          linkLabel={dict.home.kpi.realizedSavings.link}
        />
        ) : null}
        {showTracking ? (
        <KpiCard
          label={dict.home.kpi.savingsInProgress.label}
          value={formatMoney(tracking.savings.inProgress, data.currency)}
          hint={dict.home.kpi.savingsInProgress.hint}
          accent="teal"
          href="/tracking"
          linkLabel={dict.home.kpi.savingsInProgress.link}
        />
        ) : null}
        {showInsights ? (
        <KpiCard
          label={dict.home.kpi.missedSavingsToDate.label}
          value={formatMoney(aging.missedSavings, data.currency)}
          hint={dict.home.kpi.missedSavingsToDate.hintTemplate.replace("{count}", formatNumber(aging.persistentCount, false))}
          accent="amber"
          href="/insights"
          linkLabel={dict.home.kpi.missedSavingsToDate.link}
        />
        ) : null}
        {showInsights ? (
        <KpiCard
          label={dict.home.kpi.quickWinsAvailable.label}
          value={formatNumber(quickWinCount, false)}
          hint={dict.home.kpi.quickWinsAvailable.hint}
          accent="cyan"
          href="/insights"
          linkLabel={dict.home.kpi.quickWinsAvailable.link}
        />
        ) : null}
      </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={dict.home.charts.costVsSavingsTitle} subtitle={dict.home.charts.costVsSavingsSubtitle}>
          <GroupedBars data={data.costVsSavingsByService} currency={data.currency} />
        </ChartCard>
        <ChartCard title={dict.home.charts.savingsByActionTitle}>
          <HorizontalBars data={data.savingsByAction} currency={data.currency} />
        </ChartCard>
      </div>

      <section className="card-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{dict.home.topResources.title}</h3>
          <Link href="/opportunities" className="text-xs text-cyan-200 hover:text-white">
            {dict.home.topResources.allOpportunities}
          </Link>
        </div>
        <ExecutiveResourcesTable rows={data.topResources} />
      </section>
    </div>
  );
}
