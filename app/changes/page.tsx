// What Changed page. Compares the latest complete run with the previous one:
// scope totals side by side, the changes by kind and the resource list with
// the team decision on each row.

import { requireModule } from "@/lib/entitlements/gate";
import { ChangesTable } from "@/components/tables/ChangesTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRunChanges } from "@/lib/insights/service";
import { CHANGE_KINDS, CHANGE_LABELS } from "@/lib/insights/changes";
import { formatDate, formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { EmptyState } from "@/components/kpi/States";
import { StatusBadge } from "@/components/badges";
import { ChartCard, CompareBars, VerticalBars } from "@/components/charts/Charts";
import type { RunTotals } from "@/types/finops";

function signed(value: number, format: (n: number) => string): string {
  if (!value) return "no change";
  return `${value > 0 ? "+" : "−"}${format(Math.abs(value))}`;
}

function deltaHint(current: RunTotals, previous: RunTotals, key: keyof RunTotals, format: (n: number) => string): string {
  return `${signed(current[key] - previous[key], format)} vs previous run (${format(previous[key])})`;
}

export default async function ChangesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireModule("insights");
  if (gate.locked) return gate.locked;
  const data = await getRunChanges(filtersFromSearchParams(await searchParams));
  const { currency, summary } = data;
  const money = (n: number) => formatMoney(n, currency);
  const count = (n: number) => formatNumber(n, false);

  if (!data.currentRun || !data.previousRun) {
    return (
      <EmptyState
        title="Nothing to compare yet"
        detail="The comparison needs two complete full scope runs. It appears after the next official execution."
      />
    );
  }

  const byKind = CHANGE_KINDS.map((kind) => ({
    name: CHANGE_LABELS[kind],
    value: data.rows.filter((r) => r.changeKind === kind).length,
  }));
  const savingsMoves = [
    { name: "New", current: 0, target: summary.newSavings },
    { name: "Resolved", current: summary.resolvedSavings, target: 0 },
    { name: "Validated total", current: data.previous.validatedSavings, target: data.current.validatedSavings },
  ];
  const unchanged = Math.max(
    data.current.actionableCount - summary.newCount - summary.actionChangedCount - summary.reliabilityChangedCount - summary.savingsChangedCount,
    0,
  );

  return (
    <div className="space-y-6">
      <section className="card-surface flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs uppercase tracking-[0.16em] text-cyan-300">Current</span>
          <span className="text-white">{data.currentRun.RunId}</span>
          <span className="text-slate-400">{formatDate(data.currentRun.RunStartedAt)}</span>
          <StatusBadge value={data.currentRun.DataQualityStatus} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Previous</span>
          <span className="text-slate-200">{data.previousRun.RunId}</span>
          <span className="text-slate-400">{formatDate(data.previousRun.RunStartedAt)}</span>
          <StatusBadge value={data.previousRun.DataQualityStatus} />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Validated Savings (PRICED)"
          value={money(data.current.validatedSavings)}
          hint={deltaHint(data.current, data.previous, "validatedSavings", money)}
          accent="green"
        />
        <KpiCard
          label="Actionable Resources"
          value={count(data.current.actionableCount)}
          hint={deltaHint(data.current, data.previous, "actionableCount", count)}
          accent="blue"
        />
        <KpiCard
          label="New Recommendations"
          value={count(summary.newCount)}
          hint={`${money(summary.newSavings)} PRICED savings not seen on the previous run`}
          accent="cyan"
        />
        <KpiCard
          label="Resolved"
          value={count(summary.resolvedCount)}
          hint={`${money(summary.resolvedSavings)} PRICED savings no longer recommended`}
          accent="teal"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Monthly Cost Analyzed" value={money(data.current.monthlyCost)} hint={deltaHint(data.current, data.previous, "monthlyCost", money)} />
        <KpiCard
          label="Savings Moved"
          value={count(summary.savingsChangedCount)}
          hint={`Net ${signed(summary.savingsChangedDelta, money)} on recommendations kept, PRICED both runs`}
          accent="blue"
        />
        <KpiCard
          label="Action or Reliability Changed"
          value={count(summary.actionChangedCount + summary.reliabilityChangedCount)}
          hint={`${count(summary.actionChangedCount)} new action, ${count(summary.reliabilityChangedCount)} moved between PRICED and HEURISTIC`}
          accent="amber"
        />
        <KpiCard label="Unchanged" value={count(unchanged)} hint="Same action, reliability and estimate on both runs" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Changes by Kind" subtitle="Resources whose recommendation differs from the previous run">
          <VerticalBars data={byKind} />
        </ChartCard>
        <ChartCard title="Validated Savings: Previous vs Current" subtitle="PRICED savings that entered, left and the scope total">
          <CompareBars data={savingsMoves} labels={{ current: "Previous run", target: "Current run" }} currency={currency} />
        </ChartCard>
      </div>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Changed Recommendations</h3>
        {data.rows.length ? (
          <ChangesTable rows={data.rows} />
        ) : (
          <EmptyState title="No changes in this scope" detail="Every recommendation kept the same action, reliability and estimate." />
        )}
      </section>
    </div>
  );
}
