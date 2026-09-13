// Opportunities page. Loads the recommendation rows for the current scope,
// overlays the team decisions and hides dismissed rows unless requested.

import Link from "next/link";
import { OpportunitiesTable } from "@/components/tables/OpportunitiesTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { getDecisionTracking } from "@/lib/decisions/service";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";

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
  const sp = await searchParams;
  const filters = filtersFromSearchParams(sp);
  const showDismissed = sp.showDismissed === "1";
  const [data, tracking] = await Promise.all([
    getRepository().getOpportunities(filters),
    getDecisionTracking(filters),
  ]);
  const rows = showDismissed ? tracking.rows : tracking.rows.filter((r) => r.decisionStatus !== "dismissed");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Opportunities" value={formatNumber(data.totalOpportunities, false)} />
        <KpiCard label="Validated Savings (PRICED)" value={formatMoney(data.validatedSavings, data.currency)} accent="green" />
        <KpiCard label="Estimated Opportunity (HEURISTIC)" value={formatMoney(data.estimatedOpportunity, data.currency)} accent="amber" />
        <KpiCard
          label="Avg Savings / Actionable"
          value={formatMoney(data.averageSavingsPerActionable, data.currency)}
          hint="Primary recommendation only"
          accent="blue"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Savings In Progress"
          value={formatMoney(tracking.savings.inProgress, data.currency)}
          hint="PRICED only, accepted or in progress"
          accent="blue"
        />
        <KpiCard
          label="Realized Savings"
          value={formatMoney(tracking.savings.realized, data.currency)}
          hint="PRICED only, marked done"
          accent="green"
        />
        <KpiCard
          label="Recommendations Decided"
          value={formatNumber(tracking.savings.decided, false)}
          hint="Any status other than open"
          accent="teal"
        />
      </div>

      <section className="card-surface p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            SecondaryAction is shown as an alternative only and is never added to primary savings totals.
          </p>
          {tracking.dismissedCount ? (
            <Link href={toggleDismissedHref(sp, !showDismissed)} className="text-xs text-cyan-200 hover:text-white">
              {showDismissed ? "Hide dismissed" : `Show dismissed (${tracking.dismissedCount})`}
            </Link>
          ) : null}
        </div>
        <OpportunitiesTable rows={rows} />
      </section>
    </div>
  );
}
