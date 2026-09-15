// What Changed page. Compares the latest complete run with the previous one:
// scope totals side by side, the changes by kind and the resource list with
// the team decision on each row.

import { requireModule } from "@/lib/entitlements/gate";
import { ChangesTable } from "@/components/tables/ChangesTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRunChanges } from "@/lib/insights/service";
import { CHANGE_KINDS } from "@/lib/insights/changes";
import { formatDate, formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { EmptyState } from "@/components/kpi/States";
import { StatusBadge } from "@/components/badges";
import { ChartCard, CompareBars, VerticalBars } from "@/components/charts/Charts";
import type { RunTotals } from "@/types/finops";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionary";

function signed(value: number, format: (n: number) => string, noChange: string): string {
  if (!value) return noChange;
  return `${value > 0 ? "+" : "−"}${format(Math.abs(value))}`;
}

function deltaHint(
  current: RunTotals,
  previous: RunTotals,
  key: keyof RunTotals,
  format: (n: number) => string,
  dict: Dictionary,
): string {
  return `${signed(current[key] - previous[key], format, dict.changes.noChange)} ${dict.changes.hints.vsPreviousRun} (${format(previous[key])})`;
}

export default async function ChangesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireModule("insights");
  if (gate.locked) return gate.locked;
  const dict = getDictionary(await getLocale());
  const data = await getRunChanges(filtersFromSearchParams(await searchParams));
  const { currency, summary } = data;
  const money = (n: number) => formatMoney(n, currency);
  const count = (n: number) => formatNumber(n, false);

  if (!data.currentRun || !data.previousRun) {
    return <EmptyState title={dict.changes.emptyCompareTitle} detail={dict.changes.emptyCompareDetail} />;
  }

  const changeKindLabel: Record<string, string> = {
    new: dict.common.badges.change.new,
    resolved: dict.common.badges.change.resolved,
    action_changed: dict.common.badges.change.actionChanged,
    reliability_changed: dict.common.badges.change.reliabilityChanged,
    savings_changed: dict.common.badges.change.savingsChanged,
  };
  const byKind = CHANGE_KINDS.map((kind) => ({
    name: changeKindLabel[kind],
    value: data.rows.filter((r) => r.changeKind === kind).length,
  }));
  const savingsMoves = [
    { name: dict.common.badges.change.new, current: 0, target: summary.newSavings },
    { name: dict.common.badges.change.resolved, current: summary.resolvedSavings, target: 0 },
    { name: dict.changes.charts.validatedTotal, current: data.previous.validatedSavings, target: data.current.validatedSavings },
  ];
  const unchanged = Math.max(
    data.current.actionableCount - summary.newCount - summary.actionChangedCount - summary.reliabilityChangedCount - summary.savingsChangedCount,
    0,
  );

  return (
    <div className="space-y-6">
      <section className="card-surface flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs uppercase tracking-[0.16em] text-cyan-300">{dict.changes.currentRunLabel}</span>
          <span className="text-white">{data.currentRun.RunId}</span>
          <span className="text-slate-400">{formatDate(data.currentRun.RunStartedAt)}</span>
          <StatusBadge value={data.currentRun.DataQualityStatus} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{dict.changes.previousRunLabel}</span>
          <span className="text-slate-200">{data.previousRun.RunId}</span>
          <span className="text-slate-400">{formatDate(data.previousRun.RunStartedAt)}</span>
          <StatusBadge value={data.previousRun.DataQualityStatus} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={dict.changes.kpis.validatedSavingsPriced}
          value={money(data.current.validatedSavings)}
          hint={deltaHint(data.current, data.previous, "validatedSavings", money, dict)}
          accent="green"
        />
        <KpiCard
          label={dict.changes.kpis.actionableResources}
          value={count(data.current.actionableCount)}
          hint={deltaHint(data.current, data.previous, "actionableCount", count, dict)}
          accent="blue"
        />
        <KpiCard
          label={dict.changes.kpis.newRecommendations}
          value={count(summary.newCount)}
          hint={`${money(summary.newSavings)} ${dict.changes.hints.pricedSavingsNotSeen}`}
          accent="cyan"
        />
        <KpiCard
          label={dict.changes.kpis.resolved}
          value={count(summary.resolvedCount)}
          hint={`${money(summary.resolvedSavings)} ${dict.changes.hints.pricedSavingsNoLonger}`}
          accent="teal"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={dict.changes.kpis.monthlyCostAnalyzed}
          value={money(data.current.monthlyCost)}
          hint={deltaHint(data.current, data.previous, "monthlyCost", money, dict)}
        />
        <KpiCard
          label={dict.changes.kpis.savingsMoved}
          value={count(summary.savingsChangedCount)}
          hint={`${dict.changes.hints.net} ${signed(summary.savingsChangedDelta, money, dict.changes.noChange)} ${dict.changes.hints.onRecommendationsKept}`}
          accent="blue"
        />
        <KpiCard
          label={dict.changes.kpis.actionOrReliabilityChanged}
          value={count(summary.actionChangedCount + summary.reliabilityChangedCount)}
          hint={`${count(summary.actionChangedCount)} ${dict.changes.hints.newAction}, ${count(summary.reliabilityChangedCount)} ${dict.changes.hints.movedBetween}`}
          accent="amber"
        />
        <KpiCard label={dict.changes.kpis.unchanged} value={count(unchanged)} hint={dict.changes.hints.sameActionReliabilityEstimate} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={dict.changes.charts.byKindTitle} subtitle={dict.changes.charts.byKindSubtitle}>
          <VerticalBars data={byKind} />
        </ChartCard>
        <ChartCard title={dict.changes.charts.savingsCompareTitle} subtitle={dict.changes.charts.savingsCompareSubtitle}>
          <CompareBars
            data={savingsMoves}
            labels={{ current: dict.changes.charts.previousRun, target: dict.changes.charts.currentRun }}
            currency={currency}
          />
        </ChartCard>
      </div>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">{dict.changes.table.heading}</h3>
        {data.rows.length ? (
          <ChangesTable rows={data.rows} />
        ) : (
          <EmptyState title={dict.changes.table.noChangesTitle} detail={dict.changes.table.noChangesDetail} />
        )}
      </section>
    </div>
  );
}
