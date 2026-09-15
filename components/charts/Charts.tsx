"use client";

// Recharts wrappers used by every page. ChartCard gives the frame, the other
// exports are the chart shapes with the palette, tooltips and legends already
// configured so pages only pass data.

import type { ReactNode } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { formatMoney, formatNumber } from "@/lib/formatters";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

const COLORS = ["#22d3ee", "#4895ff", "#818cf8", "#fbbf24", "#34d399", "#f472b6", "#94a3b8", "#22d3ee"];

// Bar colors and their hover tones. The default Recharts tooltip cursor paints a
// gray block over the whole category, so it is turned off and the hovered bar is
// brightened through activeBar instead.
const CYAN = "#22d3ee";
const CYAN_ACTIVE = "#7ce9fb";
const BLUE = "#4895ff";
const BLUE_ACTIVE = "#8fbcff";

/** Card frame of every chart: title, optional subtitle and a fixed height body. */
export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="card-surface chart-panel p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="h-64">{children}</div>
    </section>
  );
}

function Tip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-slate-200">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {currency ? formatMoney(p.value, currency) : formatNumber(p.value, false)}
        </p>
      ))}
    </div>
  );
}

/** Single series as vertical bars, one bar per category. */
export function VerticalBars<T extends { name: string; value: number }>({
  data,
  currency,
  dataKey = "value",
}: {
  data: T[];
  currency?: string;
  dataKey?: keyof T & string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 48, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip cursor={false} content={<Tip currency={currency} />} />
        <Bar dataKey={dataKey} fill={CYAN} activeBar={{ fill: CYAN_ACTIVE }} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Single series as horizontal bars, for long category labels such as owners. */
export function HorizontalBars({
  data,
  currency,
  labelWidth = 110,
}: {
  data: Array<{ name: string; value: number }>;
  currency?: string;
  labelWidth?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={labelWidth} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip cursor={false} content={<Tip currency={currency} />} />
        <Bar dataKey="value" fill={BLUE} activeBar={{ fill: BLUE_ACTIVE }} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Share of each category as a donut with a legend. */
export function DonutChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Cost and validated savings side by side per category. */
export function GroupedBars({
  data,
  currency,
}: {
  data: Array<{ name: string; cost: number; savings: number }>;
  currency?: string;
}) {
  const dict = useDictionary();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 48, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip cursor={false} content={<Tip currency={currency} />} />
        <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 12 }} />
        <Bar dataKey="cost" name={dict.charts.cost} fill={BLUE} activeBar={{ fill: BLUE_ACTIVE }} radius={[6, 6, 0, 0]} />
        <Bar dataKey="savings" name={dict.charts.validatedSavings} fill={CYAN} activeBar={{ fill: CYAN_ACTIVE }} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Validated savings, heuristic opportunity and cost across runs as lines. */
export function DualLine({
  data,
  currency,
}: {
  data: Array<Record<string, string | number>>;
  currency?: string;
}) {
  const dict = useDictionary();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip content={<Tip currency={currency} />} />
        <Legend />
        <Line type="monotone" dataKey="validated" name={dict.charts.validatedSavings} stroke="#22d3ee" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="heuristic" name={dict.charts.estimatedOpportunity} stroke="#fbbf24" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="cost" name={dict.charts.monthlyCost} stroke="#4895ff" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** One metric over time as a filled area. */
export function AreaTrend({
  data,
  dataKey,
  color = "#22d3ee",
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.18} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Two series side by side per category, with configurable series labels. */
export function CompareBars({
  data,
  labels,
  currency,
}: {
  data: Array<{ name: string; current: number; target: number }>;
  labels?: { current: string; target: string };
  currency?: string;
}) {
  const dict = useDictionary();
  const resolvedLabels = labels ?? { current: dict.charts.current, target: dict.charts.target };
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 48, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip cursor={false} content={currency ? <Tip currency={currency} /> : undefined} />
        <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 12 }} />
        <Bar dataKey="current" name={resolvedLabels.current} fill={BLUE} activeBar={{ fill: BLUE_ACTIVE }} radius={[6, 6, 0, 0]} />
        <Bar dataKey="target" name={resolvedLabels.target} fill={CYAN} activeBar={{ fill: CYAN_ACTIVE }} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface QuadrantPoint {
  name: string;
  risk: number;
  savings: number;
  quickWin: boolean;
}

function QuadrantTip({
  active,
  payload,
  currency,
  labels,
}: {
  active?: boolean;
  payload?: Array<{ payload: QuadrantPoint }>;
  currency?: string;
  labels: { riskAdjustedSavings: string; executionRisk: string; quickWin: string };
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-slate-200">{point.name}</p>
      <p className="text-slate-300">
        {labels.riskAdjustedSavings}: {formatMoney(point.savings, currency)}
      </p>
      <p className="text-slate-300">
        {labels.executionRisk}: {point.risk}/100
      </p>
      {point.quickWin ? <p className="text-cyan-200">{labels.quickWin}</p> : null}
    </div>
  );
}

/** Value against execution risk. Quick wins sit top left: high savings, low risk. */
export function ScatterQuadrant({ data, currency }: { data: QuadrantPoint[]; currency?: string }) {
  const dict = useDictionary();
  const quick = data.filter((d) => d.quickWin);
  const rest = data.filter((d) => !d.quickWin);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis
          type="number"
          dataKey="risk"
          name={dict.charts.executionRisk}
          domain={[0, 100]}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          label={{ value: dict.charts.executionRisk, position: "insideBottom", offset: -2, fill: "#94a3b8", fontSize: 11 }}
        />
        <YAxis type="number" dataKey="savings" name={dict.charts.savings} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <ZAxis range={[36, 36]} />
        <Tooltip
          cursor={false}
          content={
            <QuadrantTip
              currency={currency}
              labels={{
                riskAdjustedSavings: dict.charts.riskAdjustedSavings,
                executionRisk: dict.charts.executionRisk,
                quickWin: dict.charts.quickWin,
              }}
            />
          }
        />
        <Legend />
        <Scatter name={dict.charts.otherPriced} data={rest} fill="#4895ff" fillOpacity={0.55} />
        <Scatter name={dict.charts.quickWins} data={quick} fill={CYAN} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export interface TimelinePointLike {
  name: string;
  notified: number;
  suppressed: number | null;
  observedIncreaseUsd: number;
}

/** Alerts per week as bars with the observed increase as a line on the right axis. */
export function TimelineChart({ data, currency = "USD" }: { data: TimelinePointLike[]; currency?: string }) {
  const dict = useDictionary();
  const hasSuppressed = data.some((p) => p.suppressed !== null);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
        <YAxis yAxisId="count" allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis yAxisId="usd" orientation="right" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v: number) => formatMoney(v, currency)} width={64} />
        <Tooltip
          cursor={false}
          content={({ active, payload, label }) => {
            const point = payload?.[0]?.payload as TimelinePointLike | undefined;
            if (!active || !point) return null;
            return (
              <div className="rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-xs shadow-xl">
                <p className="mb-1 font-medium text-slate-200">
                  {dict.charts.weekOf} {label}
                </p>
                <p style={{ color: CYAN }}>
                  {dict.charts.notified}: {formatNumber(point.notified, false)}
                </p>
                {point.suppressed !== null ? (
                  <p style={{ color: BLUE }}>
                    {dict.charts.suppressed}: {formatNumber(point.suppressed, false)}
                  </p>
                ) : null}
                <p style={{ color: "#fbbf24" }}>
                  {dict.charts.observedIncrease}: {formatMoney(point.observedIncreaseUsd, currency, false)}
                </p>
              </div>
            );
          }}
        />
        <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 12 }} />
        <Bar yAxisId="count" dataKey="notified" name={dict.charts.notified} stackId="alerts" fill={CYAN} activeBar={{ fill: CYAN_ACTIVE }} />
        {hasSuppressed ? (
          <Bar yAxisId="count" dataKey="suppressed" name={dict.charts.suppressed} stackId="alerts" fill={BLUE} activeBar={{ fill: BLUE_ACTIVE }} radius={[4, 4, 0, 0]} />
        ) : null}
        <Line yAxisId="usd" type="monotone" dataKey="observedIncreaseUsd" name={dict.charts.observedIncrease} stroke="#fbbf24" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
