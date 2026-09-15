// Tracking page. Shows what the teams decided on the recommendations in the
// current scope: tracking KPIs, breakdowns and the list of decided rows.

import { requireModule } from "@/lib/entitlements/gate";
import { TrackingTable } from "@/components/tables/TrackingTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getDecisionTracking } from "@/lib/decisions/service";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { EmptyState } from "@/components/kpi/States";
import { ChartCard, DonutChart, HorizontalBars } from "@/components/charts/Charts";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { decisionLabelsFromDict } from "@/lib/i18n/decision-labels";

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = getDictionary(await getLocale());
  const gate = await requireModule("tracking");
  if (gate.locked) return gate.locked;
  const tracking = await getDecisionTracking(filtersFromSearchParams(await searchParams), decisionLabelsFromDict(dict));
  const openCount = tracking.rows.length - tracking.decided.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={dict.tracking.kpi.savingsInProgress}
          value={formatMoney(tracking.savings.inProgress, tracking.currency)}
          hint={dict.tracking.kpi.savingsInProgressHint}
          accent="blue"
        />
        <KpiCard
          label={dict.tracking.kpi.realizedSavings}
          value={formatMoney(tracking.savings.realized, tracking.currency)}
          hint={dict.tracking.kpi.realizedSavingsHint}
          accent="green"
        />
        <KpiCard
          label={dict.tracking.kpi.recommendationsDecided}
          value={formatNumber(tracking.savings.decided, false)}
          hint={dict.tracking.kpi.decidedHint.replace("{count}", formatNumber(openCount, false))}
          accent="teal"
        />
        <KpiCard
          label={dict.tracking.kpi.dismissed}
          value={formatNumber(tracking.dismissedCount, false)}
          hint={dict.tracking.kpi.dismissedHint}
          accent="amber"
        />
      </div>

      {tracking.decided.length ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title={dict.tracking.charts.byStatusTitle} subtitle={dict.tracking.charts.byStatusSubtitle}>
              <DonutChart data={tracking.byStatus} />
            </ChartCard>
            <ChartCard title={dict.tracking.charts.byOwnerTitle} subtitle={dict.tracking.charts.byOwnerSubtitle}>
              <HorizontalBars data={tracking.byOwner} currency={tracking.currency} />
            </ChartCard>
          </div>

          <section className="card-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">{dict.tracking.decidedRecommendations}</h3>
            <TrackingTable rows={tracking.decided} />
          </section>
        </>
      ) : (
        <EmptyState title={dict.tracking.empty.title} detail={dict.tracking.empty.detail} />
      )}
    </div>
  );
}
