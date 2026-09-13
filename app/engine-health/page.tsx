import { requireModule } from "@/lib/entitlements/gate";
import { EngineHealthRunsTable } from "@/components/tables/EngineHealthRunsTable";
import { getRepository } from "@/lib/repositories";
import { formatDate, formatDuration, formatNumber, formatPercent } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";

// The page takes no search params, so Next would prerender it at build time and
// freeze the engine run data. Rendering on demand keeps it in sync with the CSVs.
export const dynamic = "force-dynamic";

function splitServices(value: string) {
  if (!value) return [];
  return value.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

export default async function EngineHealthPage() {
  const gate = await requireModule("governance");
  if (gate.locked) return gate.locked;
  const data = await getRepository().getEngineHealth();
  const run = data.latestRun;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Latest Run" value={run?.RunId ?? "—"} hint={run ? formatDate(run.RunStartedAt) : undefined} />
        <KpiCard label="Engine Version" value={run?.EngineVersion ?? "—"} accent="blue" />
        <KpiCard label="Run Duration" value={run ? formatDuration(run.RunStartedAt, run.RunFinishedAt) : "—"} />
        <KpiCard label="Run Status" value={run?.RunStatus ?? "—"} accent={run?.RunStatus === "SUCCEEDED" ? "green" : "amber"} />
        <KpiCard label="Metric Availability" value={formatPercent(run?.MetricAvailabilityRate)} />
        <KpiCard label="Metric Completeness" value={formatPercent(run?.MetricCompletenessRate)} accent="amber" />
        <KpiCard label="Cost Availability" value={formatPercent(run?.CostAvailabilityRate)} accent="teal" />
        <KpiCard label="Full Cost Coverage" value={formatPercent(run?.CostFullCoverageRate)} accent="green" />
      </div>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Run processing metrics</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          {[
            ["Rows Produced", formatNumber(run?.RowsProduced, false)],
            ["Rows Persisted", formatNumber(run?.RowsPersisted, false)],
            ["Rows Failed", formatNumber(run?.RowsFailed, false)],
            ["Tenants Expected", formatNumber(run?.TenantsExpected, false)],
            ["Tenants Succeeded", formatNumber(run?.TenantsSucceeded, false)],
            ["Tenants Failed", formatNumber(run?.TenantsFailed, false)],
            ["Priced Savings Rows", formatNumber(run?.PricedSavingsRows, false)],
            ["Heuristic Savings Rows", formatNumber(run?.HeuristicSavingsRows, false)],
            ["Unpriced Savings Rows", formatNumber(run?.UnpricedSavingsRows, false)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Degraded services</h3>
        {splitServices(run?.DegradedServices ?? "").length ? (
          <ul className="space-y-2">
            {splitServices(run!.DegradedServices).map((svc) => (
              <li key={svc} className="flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm">
                <span className="text-amber-100">{svc}</span>
                <span className="text-xs text-amber-200">Impact: quality degraded · Status: DEGRADED</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No degraded services reported on the latest run.</p>
        )}
      </section>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Run history</h3>
        <EngineHealthRunsTable rows={data.runs} />
      </section>
    </div>
  );
}
