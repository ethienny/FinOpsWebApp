"use client";

// Compact strip on the resource detail page with how long the recommendation
// has been open, what was missed meanwhile, and the quick win score.

import { AgeBadge, RiskBadge } from "@/components/badges";
import { formatDate, formatMoney } from "@/lib/formatters";
import type { InsightRow } from "@/types/finops";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-1 text-sm text-slate-100">{children}</div>
    </div>
  );
}

export function InsightStrip({ insight, currency }: { insight: InsightRow | null; currency: string }) {
  const dict = useDictionary();
  const i = dict.resources.insight;
  if (!insight || !insight.IsActionable || insight.runsOpen === 0) {
    return <section className="card-surface p-4 text-sm text-slate-400">{i.noActionable}</section>;
  }
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Tile label={i.recommendationAge}>
        <span className="inline-flex flex-wrap items-center gap-2">
          <AgeBadge value={insight.ageLabel} />
          <span>{i.runsAndDays.replace("{runs}", String(insight.runsOpen)).replace("{days}", String(insight.daysOpen))}</span>
        </span>
        <p className="mt-1 text-xs text-slate-400">
          {i.since.replace("{runId}", insight.firstDetectedRunId).replace("{date}", formatDate(insight.firstDetectedAt))}
        </p>
      </Tile>
      <Tile label={i.missedSoFar}>
        <span className="text-lg font-semibold text-amber-200">{formatMoney(insight.missedSavings, currency, false)}</span>
        <p className="mt-1 text-xs text-slate-400">{i.pricedAccrued}</p>
      </Tile>
      <Tile label={i.quickWinScore}>
        <span className="text-lg font-semibold text-white">{insight.quickWinScore}</span>
        <span className="text-xs text-slate-400"> / 100</span>
        {insight.isQuickWin ? (
          <p className="mt-1 text-xs text-cyan-200">{i.quickWin}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-400">{i.valueRank.replace("{percentile}", String(Math.round(insight.valueRank * 100)))}</p>
        )}
      </Tile>
      <Tile label={i.executionRisk}>
        <RiskBadge value={insight.riskLabel} />
        <p className="mt-1 text-xs text-slate-400">
          {insight.IsDestructive ? i.destructiveActionPrefix : ""}
          {i.confidenceCoverage
            .replace("{confidence}", insight.Confidence.toLowerCase())
            .replace("{coverage}", insight.MetricCoverageRatio !== null ? `${Math.round(insight.MetricCoverageRatio * 100)}%` : "n/a")}
        </p>
      </Tile>
    </section>
  );
}
