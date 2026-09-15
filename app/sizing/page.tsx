// Sizing page. Rightsizing analysis for the profile chosen in the query string
// (conservative, moderate or aggressive) with savings, performance risk and the
// target options table.

import { requireModule } from "@/lib/entitlements/gate";
import { SizingTable } from "@/components/tables/SizingTable";
import { Suspense } from "react";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartCard, CompareBars, DonutChart, VerticalBars } from "@/components/charts/Charts";
import { ProfileSelector } from "@/components/filters/ProfileSelector";
import type { SizingProfile } from "@/types/finops";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";

function asProfile(value: string | string[] | undefined): SizingProfile {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "Moderate" || v === "Aggressive" || v === "Conservative") return v;
  return "Conservative";
}

export default async function SizingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const gate = await requireModule("sizing");
  if (gate.locked) return gate.locked;
  const dict = getDictionary(await getLocale());
  const sp = await searchParams;
  const profile = asProfile(sp.profile);
  const data = await getRepository().getSizing(filtersFromSearchParams(sp), profile);
  const profileLabel = dict.sizing.profiles[profile];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">{dict.sizing.profileNote}</p>
        <Suspense fallback={null}>
          <ProfileSelector value={profile} />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`${dict.sizing.kpi.selectedProfileSavings} (${profileLabel})`}
          value={formatMoney(data.selectedProfileSavings, data.currency)}
        />
        <KpiCard
          label={dict.sizing.kpi.officialConservativeSavings}
          value={formatMoney(data.officialConservativeSavings, data.currency)}
          hint={dict.sizing.kpi.officialConservativeSavingsHint}
          accent="green"
        />
        <KpiCard label={dict.sizing.kpi.resourcesWithSizing} value={formatNumber(data.resourcesWithSizing, false)} accent="blue" />
        <KpiCard
          label={dict.sizing.kpi.averagePerformanceRisk}
          value={data.averagePerformanceRisk}
          hint={dict.sizing.kpi.averagePerformanceRiskHint.replace("{score}", data.averagePerformanceRiskScore.toFixed(2))}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={dict.sizing.charts.savingsByServiceType}>
          <VerticalBars data={data.savingsByService} currency={data.currency} />
        </ChartCard>
        <ChartCard title={dict.sizing.charts.riskDistribution}>
          <DonutChart data={data.riskDistribution} />
        </ChartCard>
        <ChartCard title={dict.sizing.charts.targetProfileDistribution.title} subtitle={dict.sizing.charts.targetProfileDistribution.subtitle}>
          <DonutChart data={data.profileDistribution} />
        </ChartCard>
        <ChartCard title={dict.sizing.charts.currentVsTargetVcpu}>
          <CompareBars data={data.currentVsTargetVcpu} />
        </ChartCard>
      </div>
      <ChartCard title={dict.sizing.charts.currentVsTargetMemory}>
        <CompareBars data={data.currentVsTargetMemory} />
      </ChartCard>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">{dict.sizing.recommendationsHeading.replace("{profile}", profileLabel)}</h3>
        <SizingTable rows={data.rows} currency={data.currency} />
      </section>
    </div>
  );
}
