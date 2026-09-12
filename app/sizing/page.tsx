import { SizingTable } from "@/components/tables/SizingTable";
import { Suspense } from "react";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { ChartCard, CompareBars, DonutChart, VerticalBars } from "@/components/charts/Charts";
import { ProfileSelector } from "@/components/filters/ProfileSelector";
import type { SizingProfile } from "@/types/finops";

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
  const sp = await searchParams;
  const profile = asProfile(sp.profile);
  const data = await getRepository().getSizing(filtersFromSearchParams(sp), profile);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          Profile is mandatory and single-select. Official conservative savings never come from summing all profiles.
        </p>
        <Suspense fallback={null}>
          <ProfileSelector value={profile} />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={`Selected Profile Savings (${profile})`} value={formatMoney(data.selectedProfileSavings, data.currency)} />
        <KpiCard
          label="Official Conservative Savings"
          value={formatMoney(data.officialConservativeSavings, data.currency)}
          hint="OfficialConservativeSavings, unique resources"
          accent="green"
        />
        <KpiCard label="Resources With Sizing" value={formatNumber(data.resourcesWithSizing, false)} accent="blue" />
        <KpiCard
          label="Average Performance Risk"
          value={data.averagePerformanceRisk}
          hint={`Score ${data.averagePerformanceRiskScore.toFixed(2)} (Low=1 Medium=2 High=3)`}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Savings by Service Type">
          <VerticalBars data={data.savingsByService} currency={data.currency} />
        </ChartCard>
        <ChartCard title="Risk Distribution">
          <DonutChart data={data.riskDistribution} />
        </ChartCard>
        <ChartCard title="Target Profile Distribution" subtitle="Row counts across all profiles">
          <DonutChart data={data.profileDistribution} />
        </ChartCard>
        <ChartCard title="Current vs Target vCPU">
          <CompareBars data={data.currentVsTargetVcpu} />
        </ChartCard>
      </div>
      <ChartCard title="Current vs Target Memory (GB)">
        <CompareBars data={data.currentVsTargetMemory} />
      </ChartCard>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">{profile} sizing recommendations</h3>
        <SizingTable rows={data.rows} currency={data.currency} />
      </section>
    </div>
  );
}
