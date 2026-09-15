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
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { decisionLabelsFromDict } from "@/lib/i18n/decision-labels";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireModule("insights");
  if (gate.locked) return gate.locked;
  const dict = getDictionary(await getLocale());
  const tracking = await getDecisionTracking(filtersFromSearchParams(await searchParams), decisionLabelsFromDict(dict));
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
          <h3 className="text-sm font-semibold text-white">{dict.insights.costOfInaction.heading}</h3>
          <p className="text-xs text-slate-400">{dict.insights.costOfInaction.description}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label={dict.insights.kpi.missedSavingsToDate}
            value={formatMoney(aging.missedSavings, currency)}
            hint={dict.insights.kpi.missedSavingsHint}
            accent="amber"
          />
          <KpiCard
            label={dict.insights.kpi.persistentRecommendations}
            value={formatNumber(aging.persistentCount, false)}
            hint={dict.insights.kpi.persistentRecommendationsHint}
            accent="amber"
          />
          <KpiCard
            label={dict.insights.kpi.averageAge}
            value={`${aging.averageRunsOpen.toFixed(1)} ${dict.insights.kpi.runsUnit}`}
            hint={dict.insights.kpi.averageAgeHint.replace("{count}", formatNumber(aging.actionableCount, false))}
            accent="blue"
          />
          <KpiCard
            label={dict.insights.kpi.newThisRun}
            value={formatNumber(aging.newCount, false)}
            hint={dict.insights.kpi.newThisRunHint}
            accent="cyan"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{dict.insights.quickWins.heading}</h3>
          <p className="text-xs text-slate-400">{dict.insights.quickWins.description}</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title={dict.insights.quickWins.valueVsRisk.title} subtitle={dict.insights.quickWins.valueVsRisk.subtitle}>
            <ScatterQuadrant data={quadrant} currency={currency} />
          </ChartCard>
          <ChartCard
            title={dict.insights.quickWins.validatedSavingsByAge.title}
            subtitle={dict.insights.quickWins.validatedSavingsByAge.subtitle}
          >
            <VerticalBars data={savingsByAge(tracking.rows)} currency={currency} />
          </ChartCard>
        </div>
        <section className="card-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">{dict.insights.quickWins.top10Heading}</h3>
          <QuickWinsTable rows={quickWins} />
        </section>
      </section>
    </div>
  );
}
