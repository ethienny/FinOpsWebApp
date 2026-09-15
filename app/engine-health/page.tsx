// Engine Health page. Latest run of the FinOps engine with its quality
// metrics, processing figures and the list of every run.

import { requireModule } from "@/lib/entitlements/gate";
import { EngineHealthRunsTable } from "@/components/tables/EngineHealthRunsTable";
import { getRepository } from "@/lib/repositories";
import { formatDate, formatDuration, formatNumber, formatPercent } from "@/lib/formatters";
import { KpiCard } from "@/components/kpi/KpiCard";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";

function splitServices(value: string) {
  if (!value) return [];
  return value.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

export default async function EngineHealthPage() {
  const gate = await requireModule("governance");
  if (gate.locked) return gate.locked;
  const dict = getDictionary(await getLocale());
  const t = dict.engineHealth;
  const data = await getRepository().getEngineHealth();
  const run = data.latestRun;
  const degraded = splitServices(run?.DegradedServices ?? "");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t.kpi.latestRun} value={run?.RunId ?? "—"} hint={run ? formatDate(run.RunStartedAt) : undefined} />
        <KpiCard label={t.kpi.engineVersion} value={run?.EngineVersion ?? "—"} accent="blue" />
        <KpiCard label={t.kpi.runDuration} value={run ? formatDuration(run.RunStartedAt, run.RunFinishedAt) : "—"} />
        <KpiCard label={t.kpi.runStatus} value={run?.RunStatus ?? "—"} accent={run?.RunStatus === "SUCCEEDED" ? "green" : "amber"} />
        <KpiCard label={t.kpi.metricAvailability} value={formatPercent(run?.MetricAvailabilityRate)} />
        <KpiCard label={t.kpi.metricCompleteness} value={formatPercent(run?.MetricCompletenessRate)} accent="amber" />
        <KpiCard label={t.kpi.costAvailability} value={formatPercent(run?.CostAvailabilityRate)} accent="teal" />
        <KpiCard label={t.kpi.fullCostCoverage} value={formatPercent(run?.CostFullCoverageRate)} accent="green" />
      </div>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">{t.processingMetrics.heading}</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
          {[
            [t.processingMetrics.rowsProduced, formatNumber(run?.RowsProduced, false)],
            [t.processingMetrics.rowsPersisted, formatNumber(run?.RowsPersisted, false)],
            [t.processingMetrics.rowsFailed, formatNumber(run?.RowsFailed, false)],
            [t.processingMetrics.tenantsExpected, formatNumber(run?.TenantsExpected, false)],
            [t.processingMetrics.tenantsSucceeded, formatNumber(run?.TenantsSucceeded, false)],
            [t.processingMetrics.tenantsFailed, formatNumber(run?.TenantsFailed, false)],
            [t.processingMetrics.pricedSavingsRows, formatNumber(run?.PricedSavingsRows, false)],
            [t.processingMetrics.heuristicSavingsRows, formatNumber(run?.HeuristicSavingsRows, false)],
            [t.processingMetrics.unpricedSavingsRows, formatNumber(run?.UnpricedSavingsRows, false)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">{t.degradedServices.heading}</h3>
        {degraded.length ? (
          <ul className="space-y-2">
            {degraded.map((svc) => (
              <li key={svc} className="flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm">
                <span className="text-amber-100">{svc}</span>
                <span className="text-xs text-amber-200">{t.degradedServices.impact}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">{t.degradedServices.none}</p>
        )}
      </section>

      <section className="card-surface p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">{t.runHistorySection.heading}</h3>
        <EngineHealthRunsTable rows={data.runs} />
      </section>
    </div>
  );
}
