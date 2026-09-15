// Cost Anomalies page. The weekly report of the anomaly alerting: notified
// and suppressed alerts against the prior week, the top subscriptions, alert
// coverage across subscriptions and the routing governance of each alert.
// The alert scope from the shell narrows everything except the suppression
// figures, which only exist as week totals.

import { requireModule } from "@/lib/entitlements/gate";
import { anomalyFiltersFromSearchParams, getAnomalyDashboard } from "@/lib/anomalies/service";
import { formatDate, formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard, QualityMetricCard } from "@/components/kpi/KpiCard";
import { EmptyState } from "@/components/kpi/States";
import { OutcomeBadge } from "@/components/badges";
import { ChartCard, DonutChart, HorizontalBars, TimelineChart } from "@/components/charts/Charts";
import {
  AlertRoutingTable,
  AnomalyAlertsTable,
  TopSubscriptionsTable,
  UnownedSubscriptionsTable,
} from "@/components/tables/AnomalyTables";
import type { Comparison } from "@/types/anomalies";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionary";

function deltaHint(
  dict: Dictionary,
  c: Comparison,
  label: string,
  format: (n: number) => string = (n) => formatNumber(n, false),
): string {
  const sign = c.delta > 0 ? "+" : c.delta < 0 ? "−" : "";
  const move = c.delta ? `${sign}${format(Math.abs(c.delta))}` : dict.anomalies.noChange;
  return `${move} ${dict.anomalies.vs} ${label} (${format(c.previous)})`;
}

function rateHint(dict: Dictionary, c: Comparison, label: string): string {
  const move = c.delta ? `${c.delta > 0 ? "+" : "−"}${Math.abs(c.delta).toFixed(1)} pp` : dict.anomalies.noChange;
  return `${move} ${dict.anomalies.vs} ${label} (${c.previous.toFixed(1)}%)`;
}

export default async function AnomaliesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = getDictionary(await getLocale());
  const gate = await requireModule("anomalies");
  if (gate.locked) return gate.locked;
  const data = await getAnomalyDashboard(anomalyFiltersFromSearchParams(await searchParams), dict.anomalies.routingLabels);
  const { stats, coverage, weekOverWeek, filtered } = data;

  if (!stats || !weekOverWeek) {
    return <EmptyState title={dict.anomalies.noWeeklyReport.title} detail={dict.anomalies.noWeeklyReport.detail} />;
  }

  const prev = stats.prevWeekLabel || dict.anomalies.priorWeek;
  const ownedByName = new Map(data.ownership.map((o) => [o.subscriptionName, o.owned]));
  const topRows = data.topSubs.map((s) => ({ ...s, owned: ownedByName.get(s.name) ?? null }));
  const increaseBySub = data.topSubs
    .filter((s) => s.observedIncreaseUsd > 0)
    .map((s) => ({ name: s.name, value: s.observedIncreaseUsd }));
  const fallbackNames = new Set(stats.fallbackSubs.map((s) => s.name));
  const unownedNotInFallback = data.unowned.filter((u) => !fallbackNames.has(u.subscriptionName)).length;
  const pct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <section className="card-surface flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs uppercase tracking-[0.16em] text-cyan-300">{dict.anomalies.reportedWeek}</span>
          <span className="text-white">{stats.weekLabel}</span>
          <span className="text-slate-400">{dict.anomalies.generated} {formatDate(stats.generatedAt)}</span>
          <OutcomeBadge value={stats.failedRuns ? "partial" : "found"} />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span>
            {dict.anomalies.logicAppRuns} <span className="text-slate-200">{stats.succeededRuns}/{stats.totalRuns}</span> {dict.anomalies.succeeded}
          </span>
          <span>
            {dict.anomalies.failed} <span className="text-slate-200">{stats.failedRuns}</span>
          </span>
          {data.pending.length ? (
            <span>
              {dict.anomalies.pendingSend} <span className="text-amber-200">{data.pending.length}</span>
            </span>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={dict.anomalies.kpi.alertsNotified}
          value={formatNumber(filtered ? data.alerts.length : stats.totalNotified, false)}
          hint={
            filtered
              ? dict.anomalies.kpi.inScopeOf.replace("{n}", formatNumber(stats.totalNotified, false))
              : deltaHint(dict, weekOverWeek.notified, prev)
          }
          accent="cyan"
        />
        <KpiCard
          label={dict.anomalies.kpi.alertsSuppressed}
          value={formatNumber(stats.totalSuppressed, false)}
          hint={filtered ? dict.anomalies.kpi.weekTotalSuppressed : deltaHint(dict, weekOverWeek.suppressed, prev)}
          accent="amber"
        />
        <KpiCard
          label={dict.anomalies.kpi.suppressionRate}
          value={pct(stats.suppressionRate)}
          hint={filtered ? dict.anomalies.kpi.weekTotal : rateHint(dict, weekOverWeek.suppressionRate, prev)}
          accent="blue"
        />
        <KpiCard
          label={dict.anomalies.kpi.observedIncrease}
          value={formatMoney(data.observedIncreaseTotal, "USD")}
          hint={dict.anomalies.kpi.notReconciledHint.replace("{n}", formatNumber(data.notReconciled, false))}
          accent="green"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title={dict.anomalies.charts.alertsOverYear}
          subtitle={filtered ? dict.anomalies.charts.alertsOverYearSubtitleFiltered : dict.anomalies.charts.alertsOverYearSubtitle}
        >
          <TimelineChart data={data.timeline} />
        </ChartCard>
        <ChartCard title={dict.anomalies.charts.increaseByService} subtitle={dict.anomalies.charts.increaseByServiceSubtitle}>
          <HorizontalBars data={data.byService} currency="USD" labelWidth={130} />
        </ChartCard>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{dict.anomalies.topSubscriptions.heading}</h3>
          <p className="text-xs text-slate-400">
            {dict.anomalies.topSubscriptions.description}
            {filtered
              ? dict.anomalies.topSubscriptions.derivedFromScope
              : stats.topSubsBeyondCap
                ? dict.anomalies.topSubscriptions.moreBeyondCap.replace("{n}", String(stats.topSubsBeyondCap))
                : ""}
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <ChartCard title={dict.anomalies.charts.increaseBySubscription} subtitle={dict.anomalies.charts.increaseBySubscriptionSubtitle}>
            <HorizontalBars data={increaseBySub} currency="USD" labelWidth={160} />
          </ChartCard>
          <section className="card-surface p-5">
            <TopSubscriptionsTable rows={topRows} />
          </section>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{dict.anomalies.coverage.heading}</h3>
          <p className="text-xs text-slate-400">
            {coverage
              ? dict.anomalies.coverage.description
                  .replace("{alertName}", coverage.alertName)
                  .replace("{workspace}", coverage.tfeWorkspace)
                  .replace("{date}", formatDate(coverage.generatedAt))
              : dict.anomalies.coverage.noRunbookRow}
          </p>
        </div>
        {coverage ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              <QualityMetricCard label={dict.anomalies.coverage.covered} value={`${coverage.covered} / ${coverage.totalChecked}`} />
              <QualityMetricCard label={dict.anomalies.coverage.missing} value={formatNumber(coverage.missing, false)} />
              <QualityMetricCard label={dict.anomalies.coverage.skipped} value={formatNumber(coverage.skipped, false)} />
              <QualityMetricCard label={dict.anomalies.coverage.failed} value={formatNumber(coverage.failed, false)} />
            </div>
            <section className="card-surface p-5">
              <h4 className="mb-3 text-sm font-semibold text-white">{dict.anomalies.coverage.subscriptionsWithoutAlert}</h4>
              {coverage.missingSubs.length ? (
                <ul className="divide-y divide-white/5 text-sm">
                  {coverage.missingSubs.map((sub) => (
                    <li key={sub.id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-slate-200">{sub.name}</span>
                      <span className="font-mono text-xs text-slate-400">{sub.id}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">
                  {filtered ? dict.anomalies.coverage.noneMissingInScope : dict.anomalies.coverage.everyCarriesAlert}
                </p>
              )}
            </section>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{dict.anomalies.governance.heading}</h3>
          <p className="text-xs text-slate-400">{dict.anomalies.governance.description}</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr]">
          <ChartCard
            title={dict.anomalies.charts.routingSource}
            subtitle={dict.anomalies.charts.routingSourceSubtitle.replace("{n}", String(stats.routing.overlapAlerts))}
          >
            <DonutChart data={data.routing} />
          </ChartCard>
          <section className="card-surface p-5">
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-semibold text-white">{dict.anomalies.governance.subscriptionsWithoutOwner}</h4>
              <p className="text-xs text-slate-400">
                {dict.anomalies.governance.onFallbackList.replace("{n}", formatNumber(stats.fallbackSubsTotal, false))}
                {unownedNotInFallback ? dict.anomalies.governance.moreWithoutContact.replace("{n}", String(unownedNotInFallback)) : ""}
              </p>
            </div>
            {data.unowned.length ? (
              <UnownedSubscriptionsTable rows={data.unowned} />
            ) : (
              <p className="text-sm text-slate-400">{dict.anomalies.governance.everyHasOwner}</p>
            )}
            {stats.contactSources.length ? (
              <p className="mt-3 text-xs text-slate-500">
                {dict.anomalies.governance.contactsFrom} {stats.contactSources.map((c) => `${c.source} (${c.alerts} ${dict.anomalies.table.alerts.toLowerCase()})`).join(", ")}
              </p>
            ) : null}
          </section>
        </div>
        <section className="card-surface p-5">
          <h4 className="mb-3 text-sm font-semibold text-white">{dict.anomalies.governance.routingPerAlert}</h4>
          <AlertRoutingTable rows={data.alerts} />
        </section>
      </section>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">{dict.anomalies.alertsThisWeek.heading}</h3>
        {data.alerts.length ? (
          <AnomalyAlertsTable rows={data.alerts} />
        ) : (
          <EmptyState title={dict.anomalies.alertsThisWeek.emptyTitle} detail={dict.anomalies.alertsThisWeek.emptyDetail} />
        )}
      </section>
    </div>
  );
}
