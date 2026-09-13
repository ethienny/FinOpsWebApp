// Insights page. Cost of inaction across engine runs and the quick wins
// ranking for the current scope. Done and dismissed recommendations are left
// out of the quick wins.

import { requireModule } from "@/lib/entitlements/gate";
import { QuickWinsTable } from "@/components/tables/QuickWinsTable";
import { agingSummary, savingsByAge, topQuickWins } from "@/lib/insights/metrics";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getDecisionTracking } from "@/lib/decisions/service";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartCard, ScatterQuadrant, VerticalBars } from "@/components/charts/Charts";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireModule("insights");
  if (gate.locked) return gate.locked;
  const tracking = await getDecisionTracking(filtersFromSearchParams(await searchParams));
  const currency = tracking.currency;
  const aging = agingSummary(tracking.rows);
  const openRows = tracking.rows.filter((r) => r.decisionStatus !== "done" && r.decisionStatus !== "dismissed");
  const quickWins = topQuickWins(openRows, 10);
  const quadrant = openRows
    .filter((r) => r.IsActionable && r.SavingsReliability === "PRICED")
    .map((r) => ({
      name: r.ResourceName,
      risk: r.executionRiskScore,
      savings: r.RiskAdjustedMonthlySavings ?? r.EstimatedMonthlySavings ?? 0,
      quickWin: r.isQuickWin,
    }));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Cost of Inaction</h3>
          <p className="text-xs text-slate-400">
            How long the current recommendations have been open across complete engine runs, and the PRICED savings already missed while they waited.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Missed Savings To Date"
            value={formatMoney(aging.missedSavings, currency)}
            hint="PRICED savings accrued since first detection"
            accent="amber"
          />
          <KpiCard
            label="Persistent Recommendations"
            value={formatNumber(aging.persistentCount, false)}
            hint="Same recommendation for 5 or more runs"
            accent="amber"
          />
          <KpiCard
            label="Average Age"
            value={`${aging.averageRunsOpen.toFixed(1)} runs`}
            hint={`Across ${formatNumber(aging.actionableCount, false)} actionable recommendations`}
            accent="blue"
          />
          <KpiCard
            label="New This Run"
            value={formatNumber(aging.newCount, false)}
            hint="Recommendations first detected on the latest run"
            accent="cyan"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Quick Wins</h3>
          <p className="text-xs text-slate-400">
            PRICED actions ranked by value and execution safety: confidence, performance risk, metric coverage and whether the action is destructive.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Value vs Execution Risk" subtitle="Quick wins sit top left">
            <ScatterQuadrant data={quadrant} currency={currency} />
          </ChartCard>
          <ChartCard title="Validated Savings by Age" subtitle="PRICED savings of open recommendations, oldest deserve attention first">
            <VerticalBars data={savingsByAge(tracking.rows)} currency={currency} />
          </ChartCard>
        </div>
        <section className="card-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Top 10 Quick Wins</h3>
          <QuickWinsTable rows={quickWins} />
        </section>
      </section>
    </div>
  );
}
