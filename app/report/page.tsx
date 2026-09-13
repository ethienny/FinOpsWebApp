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

const FILTER_LABELS: Record<keyof FinOpsFilters, string> = {
  tenant: "Tenant",
  subscription: "Subscription",
  serviceType: "Service type",
  priority: "Priority",
  owner: "Owner",
  environment: "Environment",
  costCenter: "Cost center",
  search: "Search",
};

function scopeDescription(filters: FinOpsFilters): string {
  const active = (Object.keys(FILTER_LABELS) as Array<keyof FinOpsFilters>)
    .filter((k) => filters[k])
    .map((k) => `${FILTER_LABELS[k]}: ${filters[k]}`);
  return active.length ? active.join(" · ") : "All tenants and subscriptions";
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

function NamedTable({ rows, valueLabel, currency }: { rows: NamedValue[]; valueLabel: string; currency: string }) {
  return (
    <table className="report-table">
      <thead>
        <tr>
          <th>Name</th>
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
  const filters = filtersFromSearchParams(await searchParams);
  const [data, tracking, entitlements] = await Promise.all([
    getRepository().getExecutiveData(filters),
    getDecisionTracking(filters),
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
        <p className="text-sm text-slate-400">
          Printable executive report for the current scope. Use the browser print dialog and choose &quot;Save as PDF&quot;.
        </p>
        <PrintButton />
      </div>

      <article className="report-paper">
        <header className="report-header">
          <div>
            <p className="report-eyebrow">FinOps Insight Engine</p>
            <h1>Executive Report</h1>
            <p className="report-note">Scope: {scopeDescription(filters)}</p>
          </div>
          <div className="report-meta">
            {run ? (
              <>
                <p>Run {run.RunId}</p>
                <p>Engine {run.EngineVersion}</p>
                <p>Published {formatDate(run.PublishedAt)}</p>
              </>
            ) : (
              <p>No official run published</p>
            )}
            <p>Generated {formatDate(generatedAt)}</p>
          </div>
        </header>

        <section className="report-section">
          <h2>Headline</h2>
          <div className="report-figures">
            <Figure label="Monthly cost analyzed" value={formatMoney(data.monthlyCost, currency, false)} />
            <Figure
              label="Validated savings (PRICED)"
              value={formatMoney(data.validatedSavings, currency, false)}
              note={`${formatMoney(data.validatedSavings * 12, currency, false)} per year`}
            />
            <Figure
              label="Estimated opportunity (HEURISTIC)"
              value={formatMoney(data.estimatedOpportunity, currency, false)}
              note="Directional, never added to validated savings"
            />
            <Figure label="Actionable resources" value={formatNumber(data.actionableResources, false)} />
          </div>
          <p className="report-text">
            Validated savings come from recommendations priced against the real cost of each resource. Heuristic values are
            indicative and are reported separately. Alternative recommendations are never added to the primary total.
          </p>
        </section>

        <section className="report-section">
          <h2>Where the savings are</h2>
          <div className="report-columns">
            <div>
              <h3>By service type</h3>
              <NamedTable rows={data.savingsByService} valueLabel="Validated savings / month" currency={currency} />
            </div>
            <div>
              <h3>By action category</h3>
              <NamedTable rows={data.savingsByAction} valueLabel="Savings / month" currency={currency} />
            </div>
          </div>
        </section>

        {showInsights ? (
          <section className="report-section">
            <h2>Cost of inaction</h2>
            <div className="report-figures">
              <Figure
                label="Missed savings to date"
                value={formatMoney(aging.missedSavings, currency, false)}
                note="PRICED savings accrued since first detection"
              />
              <Figure label="Persistent recommendations" value={formatNumber(aging.persistentCount, false)} note="Same recommendation for 5 or more runs" />
              <Figure label="Average age" value={`${aging.averageRunsOpen.toFixed(1)} runs`} note={`Across ${formatNumber(aging.actionableCount, false)} actionable recommendations`} />
              <Figure label="New this run" value={formatNumber(aging.newCount, false)} />
            </div>
            <NamedTable rows={savingsByAge(tracking.rows)} valueLabel="Validated savings / month" currency={currency} />
          </section>
        ) : null}

        {showInsights ? (
          <section className="report-section">
            <h2>Quick wins</h2>
            <p className="report-text">
              PRICED actions with low execution risk in the upper half of value. Risk combines confidence, sizing performance risk,
              metric coverage and whether the action is destructive. Done and dismissed recommendations are left out.
            </p>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Service</th>
                  <th>Action</th>
                  <th className="report-num">Savings / month</th>
                  <th className="report-num">Score</th>
                  <th>Age</th>
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
            <h2>Decisions and realized savings</h2>
            <div className="report-figures">
              <Figure label="Realized savings" value={formatMoney(tracking.savings.realized, currency, false)} note="PRICED recommendations marked done" />
              <Figure label="Savings in progress" value={formatMoney(tracking.savings.inProgress, currency, false)} note="Accepted or in progress" />
              <Figure label="Recommendations decided" value={formatNumber(tracking.savings.decided, false)} />
              <Figure label="Dismissed" value={formatNumber(tracking.dismissedCount, false)} />
            </div>
          </section>
        ) : null}

        <section className="report-section">
          <h2>Top 10 resources by validated savings</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Service</th>
                <th>Subscription</th>
                <th>Action</th>
                <th className="report-num">Savings / month</th>
                <th>Priority</th>
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
          <h2>Data quality</h2>
          <div className="report-figures">
            {run ? (
              <>
                <Figure label="Metrics availability" value={formatPercent(run.MetricAvailabilityRate)} />
                <Figure label="Metrics completeness" value={formatPercent(run.MetricCompletenessRate)} />
                <Figure label="Cost coverage" value={formatPercent(run.CostFullCoverageRate)} />
              </>
            ) : null}
            <Figure
              label="Resources with partial metrics"
              value={formatNumber(coverage.partial, false)}
              note={`${formatPercent(coverage.pricedOnPartialShare)} of validated savings rest on partial metrics`}
            />
          </div>
          <p className="report-text">
            Recommendations backed by partial metrics are still priced against real cost, but enabling full monitoring on those
            resources raises confidence and can unlock further savings on the next run.
          </p>
        </section>

        <footer className="report-footer">
          Generated by FinOps Insight Engine. Figures reflect the latest official run and the scope above. Validated and heuristic
          savings are never combined.
        </footer>
      </article>
    </div>
  );
}
