// Cost Anomalies page. The weekly report of the anomaly alerting: notified
// and suppressed alerts against the prior week, the top subscriptions, alert
// coverage across subscriptions and the routing governance of each alert.

import { requireModule } from "@/lib/entitlements/gate";
import { getAnomalyDashboard } from "@/lib/anomalies/service";
import { formatDate, formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard, QualityMetricCard } from "@/components/kpi/KpiCard";
import { EmptyState } from "@/components/kpi/States";
import { OutcomeBadge } from "@/components/badges";
import { ChartCard, DonutChart, HorizontalBars } from "@/components/charts/Charts";
import {
  AlertRoutingTable,
  AnomalyAlertsTable,
  TopSubscriptionsTable,
  UnownedSubscriptionsTable,
} from "@/components/tables/AnomalyTables";
import type { Comparison } from "@/types/anomalies";

// No search params, so the page renders on demand to follow the data files.
export const dynamic = "force-dynamic";

function deltaHint(c: Comparison, label: string, format: (n: number) => string = (n) => formatNumber(n, false)): string {
  const sign = c.delta > 0 ? "+" : c.delta < 0 ? "−" : "";
  const move = c.delta ? `${sign}${format(Math.abs(c.delta))}` : "no change";
  return `${move} vs ${label} (${format(c.previous)})`;
}

function rateHint(c: Comparison, label: string): string {
  const move = c.delta ? `${c.delta > 0 ? "+" : "−"}${Math.abs(c.delta).toFixed(1)} pp` : "no change";
  return `${move} vs ${label} (${c.previous.toFixed(1)}%)`;
}

export default async function AnomaliesPage() {
  const gate = await requireModule("anomalies");
  if (gate.locked) return gate.locked;
  const data = await getAnomalyDashboard();
  const { stats, coverage, weekOverWeek } = data;

  if (!stats || !weekOverWeek) {
    return <EmptyState title="No weekly report yet" detail="The stats runbook has not written a WeeklyReport row." />;
  }

  const prev = stats.prevWeekLabel || "prior week";
  const ownedByName = new Map(data.ownership.map((o) => [o.subscriptionName, o.owned]));
  const topRows = stats.topSubs.map((s) => ({ ...s, owned: ownedByName.get(s.name) ?? null }));
  const increaseBySub = stats.topSubs
    .filter((s) => s.observedIncreaseUsd > 0)
    .map((s) => ({ name: s.name, value: s.observedIncreaseUsd }));
  const fallbackNames = new Set(stats.fallbackSubs.map((s) => s.name));
  const unownedNotInFallback = data.unowned.filter((u) => !fallbackNames.has(u.subscriptionName)).length;
  const pct = (n: number) => `${n.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <section className="card-surface flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs uppercase tracking-[0.16em] text-cyan-300">Reported week</span>
          <span className="text-white">{stats.weekLabel}</span>
          <span className="text-slate-400">Generated {formatDate(stats.generatedAt)}</span>
          <OutcomeBadge value={stats.failedRuns ? "partial" : "found"} />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span>
            Logic App runs <span className="text-slate-200">{stats.succeededRuns}/{stats.totalRuns}</span> succeeded
          </span>
          <span>
            Failed <span className="text-slate-200">{stats.failedRuns}</span>
          </span>
          {data.pending.length ? (
            <span>
              Pending send <span className="text-amber-200">{data.pending.length}</span>
            </span>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Alerts Notified" value={formatNumber(stats.totalNotified, false)} hint={deltaHint(weekOverWeek.notified, prev)} accent="cyan" />
        <KpiCard label="Alerts Suppressed" value={formatNumber(stats.totalSuppressed, false)} hint={deltaHint(weekOverWeek.suppressed, prev)} accent="amber" />
        <KpiCard
          label="Suppression Rate"
          value={pct(stats.suppressionRate)}
          hint={rateHint(weekOverWeek.suppressionRate, prev)}
          accent="blue"
        />
        <KpiCard
          label="Observed Increase"
          value={formatMoney(stats.topSubsObservedIncreaseTotal, "USD")}
          hint={`${formatNumber(stats.topSubsNotReconciled, false)} alerts the billed cost could not reproduce`}
          accent="green"
        />
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Top Subscriptions</h3>
          <p className="text-xs text-slate-400">
            Subscriptions with notified alerts in the week, observed increase reconciled against billed cost.
            {stats.topSubsBeyondCap ? ` ${stats.topSubsBeyondCap} more beyond the report cap.` : ""}
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <ChartCard title="Observed Increase by Subscription" subtitle="USD, reconciled and partial attributions">
            <HorizontalBars data={increaseBySub} currency="USD" labelWidth={160} />
          </ChartCard>
          <section className="card-surface p-5">
            <TopSubscriptionsTable rows={topRows} />
          </section>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Alert Coverage</h3>
          <p className="text-xs text-slate-400">
            {coverage
              ? `Result of the coverage runbook for alert "${coverage.alertName}" from workspace ${coverage.tfeWorkspace}, generated ${formatDate(coverage.generatedAt)}.`
              : "The coverage runbook has not written a row for this week."}
          </p>
        </div>
        {coverage ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              <QualityMetricCard label="Covered" value={`${coverage.covered} / ${coverage.totalChecked}`} />
              <QualityMetricCard label="Missing" value={formatNumber(coverage.missing, false)} />
              <QualityMetricCard label="Skipped" value={formatNumber(coverage.skipped, false)} />
              <QualityMetricCard label="Failed" value={formatNumber(coverage.failed, false)} />
            </div>
            <section className="card-surface p-5">
              <h4 className="mb-3 text-sm font-semibold text-white">Subscriptions without the alert</h4>
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
                <p className="text-sm text-slate-400">Every checked subscription carries the alert.</p>
              )}
            </section>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Governance</h3>
          <p className="text-xs text-slate-400">
            How each alert found its recipients: the subscription tag, the contact rows pushed by the data team, or the fallback list when neither resolved.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
          <ChartCard title="Routing Source" subtitle={`${stats.routing.overlapAlerts} alerts where at least one address overlapped`}>
            <DonutChart data={data.routing} />
          </ChartCard>
          <section className="card-surface p-5">
            <h4 className="mb-3 text-sm font-semibold text-white">Routing per alert</h4>
            <AlertRoutingTable rows={data.alerts} />
          </section>
        </div>
        <section className="card-surface p-5">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-sm font-semibold text-white">Subscriptions without an owner</h4>
            <p className="text-xs text-slate-400">
              {formatNumber(stats.fallbackSubsTotal, false)} on the fallback list this week
              {unownedNotInFallback ? `, ${unownedNotInFallback} more without a valid contact` : ""}
              {stats.contactSources.length ? ` · contacts from ${stats.contactSources.map((c) => `${c.source} (${c.alerts} alerts)`).join(", ")}` : ""}
            </p>
          </div>
          {data.unowned.length ? (
            <UnownedSubscriptionsTable rows={data.unowned} />
          ) : (
            <p className="text-sm text-slate-400">Every subscription that alerted has an owner.</p>
          )}
        </section>
      </section>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Alerts Notified This Week</h3>
        <AnomalyAlertsTable rows={data.alerts} />
      </section>
    </div>
  );
}
