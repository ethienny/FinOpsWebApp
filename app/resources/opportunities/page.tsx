import { OpportunitiesTable } from "@/components/tables/OpportunitiesTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getRepository().getOpportunities(filtersFromSearchParams(await searchParams));

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

      <section className="card-surface p-5">
        <p className="mb-4 text-xs text-slate-400">
          SecondaryAction is shown as an alternative only and is never added to primary savings totals.
        </p>
        <OpportunitiesTable rows={data.rows} />
      </section>
    </div>
  );
}
