"use client";

// Compact strip on the resource detail page with how long the recommendation
// has been open, what was missed meanwhile, and the quick win score.

import { AgeBadge, RiskBadge } from "@/components/badges";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { InsightRow } from "@/types/finops";

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm text-slate-100">{children}</div>
    </div>
  );
}

export function InsightStrip({ insight, currency }: { insight: InsightRow | null; currency: string }) {
  if (!insight || !insight.IsActionable || insight.runsOpen === 0) {
    return (
      <section className="card-surface p-4 text-sm text-slate-400">
        No actionable recommendation on the latest complete run, so there is no age or quick win score for this resource.
      </section>
    );
  }
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Tile label="Recommendation age">
        <span className="inline-flex flex-wrap items-center gap-2">
          <AgeBadge value={insight.ageLabel} />
          <span>
            {insight.runsOpen} runs, {insight.daysOpen} days
          </span>
        </span>
        <p className="mt-1 text-xs text-slate-400">
          Since {insight.firstDetectedRunId} on {formatDate(insight.firstDetectedAt)}
        </p>
      </Tile>
      <Tile label="Missed so far">
        <span className="text-lg font-semibold text-amber-200">{formatMoney(insight.missedSavings, currency, false)}</span>
        <p className="mt-1 text-xs text-slate-400">PRICED savings accrued while open</p>
      </Tile>
      <Tile label="Quick win score">
        <span className="text-lg font-semibold text-white">{insight.quickWinScore}</span>
        <span className="text-xs text-slate-400"> / 100</span>
        {insight.isQuickWin ? <p className="mt-1 text-xs text-cyan-200">Quick win</p> : <p className="mt-1 text-xs text-slate-400">Value rank {Math.round(insight.valueRank * 100)}th percentile</p>}
      </Tile>
      <Tile label="Execution risk">
        <RiskBadge value={insight.riskLabel} />
        <p className="mt-1 text-xs text-slate-400">
          {insight.IsDestructive ? "Destructive action, " : ""}confidence {insight.Confidence.toLowerCase()}, coverage{" "}
          {insight.MetricCoverageRatio !== null ? `${Math.round(insight.MetricCoverageRatio * 100)}%` : "n/a"}
        </p>
      </Tile>
    </section>
  );
}
