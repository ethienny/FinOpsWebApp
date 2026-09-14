"use client";

import { cn } from "@/lib/cn";

const tones: Record<string, string> = {
  green: "bg-emerald-400/15 text-emerald-300 border-emerald-400/25",
  amber: "bg-amber-400/15 text-amber-300 border-amber-400/25",
  red: "bg-rose-400/15 text-rose-300 border-rose-400/25",
  blue: "bg-sky-400/15 text-sky-300 border-sky-400/25",
  cyan: "bg-cyan-400/15 text-cyan-200 border-cyan-400/25",
  gray: "bg-slate-400/10 text-slate-300 border-slate-400/20",
  purple: "bg-violet-400/15 text-violet-300 border-violet-400/25",
};

function Badge({ value, tone }: { value: string; tone: keyof typeof tones }) {
  if (!value) return <span className="text-slate-500">—</span>;
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", tones[tone])}>
      {value}
    </span>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const v = value.toUpperCase();
  if (["SUCCEEDED", "SUCCESS", "OK", "HEALTHY", "PUBLISHED", "COMPLETE", "FULL", "RESOLVED"].includes(v))
    return <Badge value={value} tone="green" />;
  if (["DEGRADED", "PARTIAL", "WARNING", "HEURISTIC"].includes(v)) return <Badge value={value} tone="amber" />;
  if (["FAILED", "ERROR", "HIGH"].includes(v)) return <Badge value={value} tone="red" />;
  if (["FILTERED", "TEST", "INFORMATIONAL"].includes(v)) return <Badge value={value} tone="blue" />;
  return <Badge value={value} tone="gray" />;
}

export function ReliabilityBadge({ value }: { value: string }) {
  const v = value.toUpperCase();
  if (v === "PRICED") return <Badge value="PRICED" tone="green" />;
  if (v === "HEURISTIC") return <Badge value="HEURISTIC" tone="amber" />;
  if (v === "UNPRICED") return <Badge value="UNPRICED" tone="gray" />;
  return <Badge value={value} tone="gray" />;
}

export function PriorityBadge({ value }: { value: string }) {
  const v = value.toUpperCase();
  if (v === "HIGH") return <Badge value="HIGH" tone="red" />;
  if (v === "MEDIUM") return <Badge value="MEDIUM" tone="amber" />;
  if (v === "LOW") return <Badge value="LOW" tone="blue" />;
  return <Badge value={value} tone="gray" />;
}

export function RiskBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  if (v === "low") return <Badge value={value} tone="green" />;
  if (v === "medium") return <Badge value={value} tone="amber" />;
  if (v === "high") return <Badge value={value} tone="red" />;
  return <Badge value={value} tone="gray" />;
}

export function ConfidenceBadge({ value }: { value: string }) {
  return <PriorityBadge value={value} />;
}

export function MetricStatusBadge({ value }: { value: string }) {
  const v = value.toUpperCase();
  if (v === "COMPLETE") return <Badge value={value} tone="green" />;
  if (v === "PARTIAL") return <Badge value={value} tone="amber" />;
  if (v === "UNAVAILABLE") return <Badge value={value} tone="red" />;
  if (v === "NOT_APPLICABLE") return <Badge value={value} tone="gray" />;
  return <StatusBadge value={value} />;
}

export function DecisionBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  if (v === "done") return <Badge value="Done" tone="green" />;
  if (v === "in_progress") return <Badge value="In progress" tone="cyan" />;
  if (v === "accepted") return <Badge value="Accepted" tone="blue" />;
  if (v === "dismissed") return <Badge value="Dismissed" tone="gray" />;
  return <Badge value="Open" tone="amber" />;
}

export function AgeBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  if (v === "persistent") return <Badge value="Persistent" tone="red" />;
  if (v === "recurring") return <Badge value="Recurring" tone="amber" />;
  if (v === "new") return <Badge value="New" tone="blue" />;
  return <span className="text-slate-500">—</span>;
}

export function ChangeBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  if (v === "new") return <Badge value="New" tone="cyan" />;
  if (v === "resolved") return <Badge value="Resolved" tone="green" />;
  if (v === "action changed") return <Badge value="Action changed" tone="purple" />;
  if (v === "reliability changed") return <Badge value="Reliability changed" tone="amber" />;
  if (v === "savings changed") return <Badge value="Savings changed" tone="blue" />;
  return <Badge value={value} tone="gray" />;
}

/** Outcome of a lookup or reconciliation step: found, partial, missing, invalid or failed. */
export function OutcomeBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const label = value.replace(/_/g, " ");
  if (["found", "reconciled", "sent", "valid", "owned"].includes(v)) return <Badge value={label} tone="green" />;
  if (["partial", "missing", "pendingsend", "unowned"].includes(v)) return <Badge value={label} tone="amber" />;
  if (["invalid", "lookup_failed", "not_reconciled", "failed"].includes(v)) return <Badge value={label} tone="red" />;
  return <Badge value={label} tone="gray" />;
}
