// Headline figure cards. KpiCard is the large card of the KPI rows, with an
// optional link; QualityMetricCard is the compact tile used inside sections.

import Link from "next/link";
import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  hint,
  accent = "cyan",
  href,
  linkLabel = "View details",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "cyan" | "teal" | "blue" | "amber" | "green";
  href?: string;
  linkLabel?: string;
}) {
  const bar = {
    cyan: "from-cyan-400 to-teal-400",
    teal: "from-teal-400 to-emerald-400",
    blue: "from-sky-400 to-indigo-400",
    amber: "from-amber-400 to-orange-400",
    green: "from-emerald-400 to-teal-400",
  }[accent];

  return (
    <article className="card-surface kpi-card relative overflow-hidden p-5">
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", bar)} />
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-3 kpi-value text-3xl font-semibold tracking-tight text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
      {href ? (
        <Link href={href} className="mt-3 inline-block text-xs text-cyan-200 hover:text-white">
          {linkLabel}
        </Link>
      ) : null}
    </article>
  );
}

export function QualityMetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-cyan-200">{value}</p>
    </div>
  );
}
