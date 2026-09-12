import { ResourcesTable } from "@/components/tables/ResourcesTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const data = await getRepository().getResources(filtersFromSearchParams(await searchParams));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Resources" value={formatNumber(data.totalResources, false)} />
        <KpiCard label="Resources With Recommendations" value={formatNumber(data.resourcesWithRecommendations, false)} accent="teal" />
        <KpiCard label="Monthly Cost" value={formatMoney(data.monthlyCost, data.currency)} />
        <KpiCard label="Service Types Analyzed" value={formatNumber(data.serviceTypesAnalyzed, false)} accent="blue" />
      </div>

      <section className="card-surface p-5">
        <ResourcesTable rows={data.rows} />
      </section>
    </div>
  );
}
