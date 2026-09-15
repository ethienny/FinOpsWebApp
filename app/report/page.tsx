// Executive report. A printable document for the current scope: headline
// figures, where the savings are, cost of inaction, quick wins, tracking and
// data quality. Sections follow the modules in the plan. The browser print
// dialog turns it into a PDF, so no server side rendering is needed.

import { PrintButton } from "@/components/report/PrintButton";
import { filtersFromSearchParams } from "@/lib/aggregations/filters";
import { getRepository } from "@/lib/repositories";
import { getDecisionTracking } from "@/lib/decisions/service";
import { getEntitlements } from "@/lib/entitlements/store";
import { hasModule } from "@/lib/entitlements/catalog";
import { agingSummary, metricCoverageSummary, savingsByAge, topQuickWins } from "@/lib/insights/metrics";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/formatters";
import type { FinOpsFilters, NamedValue } from "@/types/finops";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionary";
import { decisionLabelsFromDict } from "@/lib/i18n/decision-labels";

function scopeDescription(filters: FinOpsFilters, dict: Dictionary): string {
  const labels = dict.report.filterLabels;
  const active = (Object.keys(labels) as Array<keyof FinOpsFilters>)
    .filter((k) => filters[k])
    .map((k) => `${labels[k]}: ${filters[k]}`);
  return active.length ? active.join(" · ") : dict.report.allTenantsAndSubscriptions;
}

function Figure({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="report-figure">
      <p className="report-label">{label}</p>
      <p className="report-value">{value}</p>
      {note ? <p className="report-note">{note}</p> : null}
    </div>
  );
}

function NamedTable({ rows, valueLabel, currency, nameLabel }: { rows: NamedValue[]; valueLabel: string; currency: string; nameLabel: string }) {
  return (
    <table className="report-table">
      <thead>
        <tr>
          <th>{nameLabel}</th>
          <th className="report-num">{valueLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td>{r.name}</td>
            <td className="report-num">{formatMoney(r.value, currency, false)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const dict = getDictionary(await getLocale());
  const filters = filtersFromSearchParams(await searchParams);
  const [data, tracking, entitlements] = await Promise.all([
    getRepository().getExecutiveData(filters),
    getDecisionTracking(filters, decisionLabelsFromDict(dict)),
    getEntitlements(),
  ]);
  const currency = data.currency;
  const run = data.publishedRun;
  const showTracking = hasModule(entitlements, "tracking");
  const showInsights = hasModule(entitlements, "insights");
  const aging = agingSummary(tracking.rows);
  const coverage = metricCoverageSummary(tracking.rows);
  const openRows = tracking.rows.filter((r) => r.decisionStatus !== "done" && r.decisionStatus !== "dismissed");
  const quickWins = topQuickWins(openRows, 10);
  const generatedAt = new Date().toISOString();

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">{dict.report.toolbar.instructions}</p>
        <PrintButton />
      </div>

      <article className="report-paper">
        <header className="report-header">
          <div>
            <p className="report-eyebrow">{dict.report.header.brand}</p>
            <h1>{dict.report.header.title}</h1>
            <p className="report-note">{dict.report.header.scope.replace("{value}", scopeDescription(filters, dict))}</p>
          </div>
          <div className="report-meta">
            {run ? (
              <>
                <p>{dict.report.header.run.replace("{value}", run.RunId)}</p>
                <p>{dict.report.header.engine.replace("{value}", run.EngineVersion)}</p>
                <p>{dict.report.header.published.replace("{value}", formatDate(run.PublishedAt))}</p>
              </>
            ) : (
              <p>{dict.report.header.noOfficialRun}</p>
            )}
            <p>{dict.report.header.generated.replace("{value}", formatDate(generatedAt))}</p>
          </div>
        </header>

        <section className="report-section">
          <h2>{dict.report.headline.heading}</h2>
          <div className="report-figures">
            <Figure label={dict.report.headline.monthlyCostAnalyzed} value={formatMoney(data.monthlyCost, currency, false)} />
            <Figure
              label={dict.report.headline.validatedSavingsPriced}
              value={formatMoney(data.validatedSavings, currency, false)}
              note={dict.report.headline.perYear.replace("{value}", formatMoney(data.validatedSavings * 12, currency, false))}
            />
            <Figure
              label={dict.report.headline.estimatedOpportunityHeuristic}
              value={formatMoney(data.estimatedOpportunity, currency, false)}
              note={dict.report.headline.directionalNote}
            />
            <Figure label={dict.report.headline.actionableResources} value={formatNumber(data.actionableResources, false)} />
          </div>
          <p className="report-text">{dict.report.headline.text}</p>
        </section>

        <section className="report-section">
          <h2>{dict.report.whereSavingsAre.heading}</h2>
          <div className="report-columns">
            <div>
              <h3>{dict.report.whereSavingsAre.byServiceType}</h3>
              <NamedTable
                rows={data.savingsByService}
                valueLabel={dict.report.whereSavingsAre.validatedSavingsPerMonth}
                currency={currency}
                nameLabel={dict.report.whereSavingsAre.name}
              />
            </div>
            <div>
              <h3>{dict.report.whereSavingsAre.byActionCategory}</h3>
              <NamedTable
                rows={data.savingsByAction}
                valueLabel={dict.report.whereSavingsAre.savingsPerMonth}
                currency={currency}
                nameLabel={dict.report.whereSavingsAre.name}
              />
            </div>
          </div>
        </section>

        {showInsights ? (
          <section className="report-section">
            <h2>{dict.report.costOfInaction.heading}</h2>
            <div className="report-figures">
              <Figure
                label={dict.report.costOfInaction.missedSavingsToDate}
                value={formatMoney(aging.missedSavings, currency, false)}
                note={dict.report.costOfInaction.missedSavingsNote}
              />
              <Figure
                label={dict.report.costOfInaction.persistentRecommendations}
                value={formatNumber(aging.persistentCount, false)}
                note={dict.report.costOfInaction.persistentNote}
              />
              <Figure
                label={dict.report.costOfInaction.averageAge}
                value={dict.report.costOfInaction.averageAgeValue.replace("{value}", aging.averageRunsOpen.toFixed(1))}
                note={dict.report.costOfInaction.averageAgeNote.replace("{value}", formatNumber(aging.actionableCount, false))}
              />
              <Figure label={dict.report.costOfInaction.newThisRun} value={formatNumber(aging.newCount, false)} />
            </div>
            <NamedTable
              rows={savingsByAge(tracking.rows)}
              valueLabel={dict.report.whereSavingsAre.validatedSavingsPerMonth}
              currency={currency}
              nameLabel={dict.report.whereSavingsAre.name}
            />
          </section>
        ) : null}

        {showInsights ? (
          <section className="report-section">
            <h2>{dict.report.quickWins.heading}</h2>
            <p className="report-text">{dict.report.quickWins.text}</p>
            <table className="report-table">
              <thead>
                <tr>
                  <th>{dict.report.quickWins.columns.resource}</th>
                  <th>{dict.report.quickWins.columns.service}</th>
                  <th>{dict.report.quickWins.columns.action}</th>
                  <th className="report-num">{dict.report.quickWins.columns.savingsPerMonth}</th>
                  <th className="report-num">{dict.report.quickWins.columns.score}</th>
                  <th>{dict.report.quickWins.columns.age}</th>
                </tr>
              </thead>
              <tbody>
                {quickWins.map((r) => (
                  <tr key={r.ResourceId}>
                    <td>{r.ResourceName}</td>
                    <td>{r.ServiceType}</td>
                    <td>{r.ActionLabel}</td>
                    <td className="report-num">{formatMoney(r.EstimatedMonthlySavings, r.CostCurrency, false)}</td>
                    <td className="report-num">{r.quickWinScore}</td>
                    <td>{r.ageLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {showTracking ? (
          <section className="report-section">
            <h2>{dict.report.decisions.heading}</h2>
            <div className="report-figures">
              <Figure
                label={dict.report.decisions.realizedSavings}
                value={formatMoney(tracking.savings.realized, currency, false)}
                note={dict.report.decisions.realizedSavingsNote}
              />
              <Figure
                label={dict.report.decisions.savingsInProgress}
                value={formatMoney(tracking.savings.inProgress, currency, false)}
                note={dict.report.decisions.savingsInProgressNote}
              />
              <Figure label={dict.report.decisions.recommendationsDecided} value={formatNumber(tracking.savings.decided, false)} />
              <Figure label={dict.report.decisions.dismissed} value={formatNumber(tracking.dismissedCount, false)} />
            </div>
          </section>
        ) : null}

        <section className="report-section">
          <h2>{dict.report.topResources.heading}</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>{dict.report.topResources.columns.resource}</th>
                <th>{dict.report.topResources.columns.service}</th>
                <th>{dict.report.topResources.columns.subscription}</th>
                <th>{dict.report.topResources.columns.action}</th>
                <th className="report-num">{dict.report.topResources.columns.savingsPerMonth}</th>
                <th>{dict.report.topResources.columns.priority}</th>
              </tr>
            </thead>
            <tbody>
              {data.topResources.map((r) => (
                <tr key={r.ResourceId}>
                  <td>{r.ResourceName}</td>
                  <td>{r.ServiceType}</td>
                  <td>{r.SubscriptionName}</td>
                  <td>{r.ActionLabel}</td>
                  <td className="report-num">{formatMoney(r.EstimatedMonthlySavings, r.CostCurrency, false)}</td>
                  <td>{r.Priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="report-section">
          <h2>{dict.report.dataQuality.heading}</h2>
          <div className="report-figures">
            {run ? (
              <>
                <Figure label={dict.report.dataQuality.metricsAvailability} value={formatPercent(run.MetricAvailabilityRate)} />
                <Figure label={dict.report.dataQuality.metricsCompleteness} value={formatPercent(run.MetricCompletenessRate)} />
                <Figure label={dict.report.dataQuality.costCoverage} value={formatPercent(run.CostFullCoverageRate)} />
              </>
            ) : null}
            <Figure
              label={dict.report.dataQuality.resourcesWithPartialMetrics}
              value={formatNumber(coverage.partial, false)}
              note={dict.report.dataQuality.partialMetricsNote.replace("{value}", formatPercent(coverage.pricedOnPartialShare))}
            />
          </div>
          <p className="report-text">{dict.report.dataQuality.text}</p>
        </section>

        <footer className="report-footer">{dict.report.footer}</footer>
      </article>
    </div>
  );
}
