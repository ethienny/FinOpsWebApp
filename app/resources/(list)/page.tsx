// Resources page. Complete analyzed inventory of the current scope with
// headline figures and the searchable table.

import { ResourcesTable } from "@/components/tables/ResourcesTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = getDictionary(await getLocale());
  const data = await getRepository().getResources(filtersFromSearchParams(await searchParams));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={dict.resources.list.kpi.totalResources} value={formatNumber(data.totalResources, false)} />
        <KpiCard
          label={dict.resources.list.kpi.resourcesWithRecommendations}
          value={formatNumber(data.resourcesWithRecommendations, false)}
          accent="teal"
        />
        <KpiCard label={dict.resources.list.kpi.monthlyCost} value={formatMoney(data.monthlyCost, data.currency)} />
        <KpiCard label={dict.resources.list.kpi.serviceTypesAnalyzed} value={formatNumber(data.serviceTypesAnalyzed, false)} accent="blue" />
      </div>

      <section className="card-surface p-5">
        <ResourcesTable rows={data.rows} />
      </section>
    </div>
  );
}
