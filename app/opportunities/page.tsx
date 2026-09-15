// Opportunities page. Loads the recommendation rows for the current scope,
// overlays the team decisions and hides dismissed rows unless requested.

import Link from "next/link";
import { OpportunitiesTable } from "@/components/tables/OpportunitiesTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { getDecisionTracking } from "@/lib/decisions/service";
import { getEntitlements } from "@/lib/entitlements/store";
import { hasModule } from "@/lib/entitlements/catalog";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartCard, DonutChart } from "@/components/charts/Charts";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { decisionLabelsFromDict } from "@/lib/i18n/decision-labels";

function toggleDismissedHref(sp: Record<string, string | string[] | undefined>, show: boolean): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v && key !== "showDismissed") next.set(key, v);
  }
  if (show) next.set("showDismissed", "1");
  const qs = next.toString();
  return qs ? `/opportunities?${qs}` : "/opportunities";
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = getDictionary(await getLocale());
  const sp = await searchParams;
  const filters = filtersFromSearchParams(sp);
  const showDismissed = sp.showDismissed === "1";
  const [data, tracking, entitlements] = await Promise.all([
    getRepository().getOpportunities(filters),
    getDecisionTracking(filters, decisionLabelsFromDict(dict)),
    getEntitlements(),
  ]);
  const showTracking = hasModule(entitlements, "tracking");
  const rows = showDismissed || !showTracking ? tracking.rows : tracking.rows.filter((r) => r.decisionStatus !== "dismissed");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={dict.opportunities.kpi.totalOpportunities} value={formatNumber(data.totalOpportunities, false)} />
        <KpiCard label={dict.opportunities.kpi.validatedSavingsPriced} value={formatMoney(data.validatedSavings, data.currency)} accent="green" />
        <KpiCard label={dict.opportunities.kpi.estimatedOpportunityHeuristic} value={formatMoney(data.estimatedOpportunity, data.currency)} accent="amber" />
        <KpiCard
          label={dict.opportunities.kpi.avgSavingsPerActionable}
          value={formatMoney(data.averageSavingsPerActionable, data.currency)}
          hint={dict.opportunities.kpi.avgSavingsHint}
          accent="blue"
        />
      </div>

      {showTracking ? (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={dict.opportunities.kpi.savingsInProgress}
          value={formatMoney(tracking.savings.inProgress, data.currency)}
          hint={dict.opportunities.kpi.savingsInProgressHint}
          accent="blue"
        />
        <KpiCard
          label={dict.opportunities.kpi.realizedSavings}
          value={formatMoney(tracking.savings.realized, data.currency)}
          hint={dict.opportunities.kpi.realizedSavingsHint}
          accent="green"
        />
        <KpiCard
          label={dict.opportunities.kpi.recommendationsDecided}
          value={formatNumber(tracking.savings.decided, false)}
          hint={dict.opportunities.kpi.recommendationsDecidedHint}
          accent="teal"
        />
      </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={dict.opportunities.charts.reliabilityTitle} subtitle={dict.opportunities.charts.reliabilitySubtitle}>
          <DonutChart data={data.reliabilityDistribution} />
        </ChartCard>
        <ChartCard title={dict.opportunities.charts.priorityTitle}>
          <DonutChart data={data.priorityDistribution} />
        </ChartCard>
      </div>

      <section className="card-surface p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">{dict.opportunities.secondaryActionNote}</p>
          {showTracking && tracking.dismissedCount ? (
            <Link href={toggleDismissedHref(sp, !showDismissed)} className="text-xs text-cyan-200 hover:text-white">
              {showDismissed
                ? dict.opportunities.hideDismissed
                : dict.opportunities.showDismissed.replace("{count}", String(tracking.dismissedCount))}
            </Link>
          ) : null}
        </div>
        <OpportunitiesTable rows={rows} modules={entitlements.modules} />
      </section>
    </div>
  );
}
