// Showback page. Cost allocation of the current scope by owner, cost center,
// application, environment, subscription and tenant, with the allocation table.

import { requireModule } from "@/lib/entitlements/gate";
import { ShowbackTable } from "@/components/tables/ShowbackTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartCard, DonutChart, HorizontalBars, VerticalBars } from "@/components/charts/Charts";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function ShowbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireModule("showback");
  if (gate.locked) return gate.locked;
  const dict = getDictionary(await getLocale());
  const data = await getRepository().getShowback(filtersFromSearchParams(await searchParams));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={dict.showback.kpis.totalCost} value={formatMoney(data.totalCost, data.currency)} />
        <KpiCard
          label={dict.showback.kpis.allocatedCost}
          value={formatMoney(data.allocatedCost, data.currency)}
          hint={dict.showback.kpis.allocatedHint}
          accent="green"
        />
        <KpiCard
          label={dict.showback.kpis.unallocatedCost}
          value={formatMoney(data.unallocatedCost, data.currency)}
          hint={dict.showback.kpis.unallocatedHint}
          accent="amber"
        />
        <KpiCard label={dict.showback.kpis.totalResources} value={formatNumber(data.totalResources, false)} accent="blue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={dict.showback.charts.costByOwner}>
          <DonutChart data={data.costByOwner} />
        </ChartCard>
        <ChartCard title={dict.showback.charts.savingsByOwner} subtitle={dict.showback.charts.savingsByOwnerSubtitle}>
          <HorizontalBars data={data.savingsByOwner} currency={data.currency} />
        </ChartCard>
        <ChartCard title={dict.showback.charts.costByEnvironment}>
          <HorizontalBars data={data.costByEnvironment} currency={data.currency} />
        </ChartCard>
        <ChartCard title={dict.showback.charts.costByCostCenter}>
          <VerticalBars data={data.costByCostCenter} currency={data.currency} />
        </ChartCard>
        <ChartCard title={dict.showback.charts.costByApplication}>
          <VerticalBars data={data.costByApplication} currency={data.currency} />
        </ChartCard>
        <ChartCard title={dict.showback.charts.costBySubscription}>
          <HorizontalBars data={data.costBySubscription} currency={data.currency} />
        </ChartCard>
        <ChartCard title={dict.showback.charts.costByTenant}>
          <DonutChart data={data.costByTenant} />
        </ChartCard>
      </div>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">{dict.showback.tableHeading}</h3>
        <ShowbackTable rows={data.rows} currency={data.currency} />
      </section>
    </div>
  );
}
