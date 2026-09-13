"use client";

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
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { formatMoney, formatNumber } from "@/lib/formatters";

const COLORS = ["#22d3ee", "#4895ff", "#818cf8", "#fbbf24", "#34d399", "#f472b6", "#94a3b8", "#22d3ee"];

// Bar colors and their hover tones. The default Recharts tooltip cursor paints a
// gray block over the whole category, so it is turned off and the hovered bar is
// brightened through activeBar instead.
const CYAN = "#22d3ee";
const CYAN_ACTIVE = "#7ce9fb";
const BLUE = "#4895ff";
const BLUE_ACTIVE = "#8fbcff";

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

export function HorizontalBars({
  data,
  currency,
}: {
  data: Array<{ name: string; value: number }>;
  currency?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip cursor={false} content={<Tip currency={currency} />} />
        <Bar dataKey="value" fill={BLUE} activeBar={{ fill: BLUE_ACTIVE }} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

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

export function GroupedBars({
  data,
  currency,
}: {
  data: Array<{ name: string; cost: number; savings: number }>;
  currency?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 48, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip cursor={false} content={<Tip currency={currency} />} />
        <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 12 }} />
        <Bar dataKey="cost" name="Cost" fill={BLUE} activeBar={{ fill: BLUE_ACTIVE }} radius={[6, 6, 0, 0]} />
        <Bar dataKey="savings" name="Validated savings" fill={CYAN} activeBar={{ fill: CYAN_ACTIVE }} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DualLine({
  data,
  currency,
}: {
  data: Array<Record<string, string | number>>;
  currency?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip content={<Tip currency={currency} />} />
        <Legend />
        <Line type="monotone" dataKey="validated" name="Validated savings" stroke="#22d3ee" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="heuristic" name="Estimated opportunity" stroke="#fbbf24" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="cost" name="Monthly cost" stroke="#4895ff" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

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

export function CompareBars({
  data,
}: {
  data: Array<{ name: string; current: number; target: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 48, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <Tooltip cursor={false} />
        <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 12 }} />
        <Bar dataKey="current" fill={BLUE} activeBar={{ fill: BLUE_ACTIVE }} radius={[6, 6, 0, 0]} />
        <Bar dataKey="target" fill={CYAN} activeBar={{ fill: CYAN_ACTIVE }} radius={[6, 6, 0, 0]} />
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
}: {
  active?: boolean;
  payload?: Array<{ payload: QuadrantPoint }>;
  currency?: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-slate-200">{point.name}</p>
      <p className="text-slate-300">Risk adjusted savings: {formatMoney(point.savings, currency)}</p>
      <p className="text-slate-300">Execution risk: {point.risk}/100</p>
      {point.quickWin ? <p className="text-cyan-200">Quick win</p> : null}
    </div>
  );
}

/** Value against execution risk. Quick wins sit top left: high savings, low risk. */
export function ScatterQuadrant({ data, currency }: { data: QuadrantPoint[]; currency?: string }) {
  const quick = data.filter((d) => d.quickWin);
  const rest = data.filter((d) => !d.quickWin);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
        <XAxis
          type="number"
          dataKey="risk"
          name="Execution risk"
          domain={[0, 100]}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          label={{ value: "Execution risk", position: "insideBottom", offset: -2, fill: "#94a3b8", fontSize: 11 }}
        />
        <YAxis type="number" dataKey="savings" name="Savings" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <ZAxis range={[36, 36]} />
        <Tooltip cursor={false} content={<QuadrantTip currency={currency} />} />
        <Legend />
        <Scatter name="Other PRICED" data={rest} fill="#4895ff" fillOpacity={0.55} />
        <Scatter name="Quick wins" data={quick} fill={CYAN} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
