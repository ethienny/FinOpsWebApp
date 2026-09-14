import { requireModule } from "@/lib/entitlements/gate";
import { ShowbackTable } from "@/components/tables/ShowbackTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartCard, DonutChart, HorizontalBars, VerticalBars } from "@/components/charts/Charts";

export default async function ShowbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireModule("showback");
  if (gate.locked) return gate.locked;
  const data = await getRepository().getShowback(filtersFromSearchParams(await searchParams));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Cost" value={formatMoney(data.totalCost, data.currency)} />
        <KpiCard label="Allocated Cost" value={formatMoney(data.allocatedCost, data.currency)} hint="Owner or cost center present" accent="green" />
        <KpiCard label="Unallocated Cost" value={formatMoney(data.unallocatedCost, data.currency)} hint="Missing ownership metadata" accent="amber" />
        <KpiCard label="Total Resources" value={formatNumber(data.totalResources, false)} accent="blue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Cost Allocation by Owner">
          <DonutChart data={data.costByOwner} />
        </ChartCard>
        <ChartCard title="Validated Savings by Owner" subtitle="PRICED savings only">
          <HorizontalBars data={data.savingsByOwner} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Cost by Environment">
          <HorizontalBars data={data.costByEnvironment} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Cost by Cost Center">
          <VerticalBars data={data.costByCostCenter} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Cost by Application">
          <VerticalBars data={data.costByApplication} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Cost by Subscription">
          <HorizontalBars data={data.costBySubscription} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Cost by Tenant">
          <DonutChart data={data.costByTenant} />
        </ChartCard>
      </div>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Allocation table</h3>
        <ShowbackTable rows={data.rows} currency={data.currency} />
      </section>
    </div>
  );
}
