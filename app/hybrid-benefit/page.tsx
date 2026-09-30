// Hybrid Benefit page. Resources still paying a Windows Server, SQL Server,
// RHEL or SQL License meter without Azure Hybrid Benefit or Red Hat Cloud
// Access applied - added with engine 6.6.0 (see lib/repositories/finops-repository.ts).

import { HybridBenefitTable } from "@/components/tables/HybridBenefitTable";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { getFormatters } from "@/lib/i18n/get-formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartCard, HorizontalBars } from "@/components/charts/Charts";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export default async function HybridBenefitPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = getDictionary(await getLocale());
  const { formatMoney, formatNumber } = await getFormatters();
  const sp = await searchParams;
  const filters = filtersFromSearchParams(sp);
  const data = await getRepository().getHybridBenefit(filters);

  return (
    <div className="dense space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={dict.hybridBenefit.kpi.licenseCostWithoutBenefit.label}
          value={formatMoney(data.licenseCostWithoutBenefit, data.currency)}
          hint={dict.hybridBenefit.kpi.licenseCostWithoutBenefit.hint}
        />
        <KpiCard
          label={dict.hybridBenefit.kpi.licenseSavings.label}
          value={formatMoney(data.licenseSavings, data.currency)}
          hint={dict.hybridBenefit.kpi.licenseSavings.hint}
          accent="green"
        />
        <KpiCard
          label={dict.hybridBenefit.kpi.resourcesWithoutHybridBenefit.label}
          value={formatNumber(data.resourcesWithoutHybridBenefit, false)}
          hint={dict.hybridBenefit.kpi.resourcesWithoutHybridBenefit.hint}
          accent="amber"
        />
        <KpiCard
          label={dict.hybridBenefit.kpi.resourcesWithHybridBenefit.label}
          value={formatNumber(data.resourcesWithHybridBenefit, false)}
          hint={dict.hybridBenefit.kpi.resourcesWithHybridBenefit.hint}
          accent="blue"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={dict.hybridBenefit.charts.byProductTitle}>
          <HorizontalBars data={data.savingsByLicenseProduct} currency={data.currency} />
        </ChartCard>
        <ChartCard title={dict.hybridBenefit.charts.bySubscriptionTitle}>
          <HorizontalBars data={data.savingsBySubscription} currency={data.currency} labelWidth={140} />
        </ChartCard>
      </div>

      <section className="card-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{dict.hybridBenefit.table.title}</h3>
        </div>
        <HybridBenefitTable rows={data.rows} currency={data.currency} />
      </section>
    </div>
  );
}
