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

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireModule("tracking");
  if (gate.locked) return gate.locked;
  const tracking = await getDecisionTracking(filtersFromSearchParams(await searchParams));
  const openCount = tracking.rows.length - tracking.decided.length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Savings In Progress"
          value={formatMoney(tracking.savings.inProgress, tracking.currency)}
          hint="PRICED only, accepted or in progress"
          accent="blue"
        />
        <KpiCard
          label="Realized Savings"
          value={formatMoney(tracking.savings.realized, tracking.currency)}
          hint="PRICED only, marked done"
          accent="green"
        />
        <KpiCard
          label="Recommendations Decided"
          value={formatNumber(tracking.savings.decided, false)}
          hint={`${formatNumber(openCount, false)} still open in this scope`}
          accent="teal"
        />
        <KpiCard
          label="Dismissed"
          value={formatNumber(tracking.dismissedCount, false)}
          hint="Excluded from tracked savings"
          accent="amber"
        />
      </div>

      {tracking.decided.length ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Decisions by Status" subtitle="Recommendations with a decision other than open">
              <DonutChart data={tracking.byStatus} />
            </ChartCard>
            <ChartCard title="Tracked Savings by Owner" subtitle="PRICED savings accepted, in progress or done">
              <HorizontalBars data={tracking.byOwner} currency={tracking.currency} />
            </ChartCard>
          </div>

          <section className="card-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Decided recommendations</h3>
            <TrackingTable rows={tracking.decided} />
          </section>
        </>
      ) : (
        <EmptyState
          title="No decisions recorded in this scope yet."
          detail="Open a resource from Opportunities and record what the team decided about its recommendation."
        />
      )}
    </div>
  );
}
