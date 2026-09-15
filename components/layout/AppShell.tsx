"use client";

// Application shell: sidebar navigation grouped by the question the user
// brings, page title and subtitle from the route, the scope panel (FinOps
// filters, or the alert scope on the anomalies page) and the plan banner.

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  ClipboardCheck,
  Gauge,
  History,
  LayoutDashboard,
  Lightbulb,
  Lock,
  Plug,
  Menu,
  Scale,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import type { FilterOptions, SidebarMeta } from "@/types/finops";
import type { AnomalyFilterOptions } from "@/types/anomalies";
import type { Entitlements } from "@/types/entitlements";
import { hasModule, moduleForPath } from "@/lib/entitlements/catalog";
import { FilterBar } from "@/components/filters/FilterBar";
import { AnomalyFilterBar } from "@/components/filters/AnomalyFilterBar";
import { PlanBanner } from "@/components/layout/PlanBanner";
import { PlanSwitcher } from "@/components/layout/PlanSwitcher";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/badges";
import { NetworkGlyph } from "@/components/layout/NetworkGlyph";

// Menu groups follow the question the user brings: how are we doing, what
// should we act on, what is happening now, and what exists behind the numbers.
const NAV_GROUPS = [
  {
    caption: "OVERVIEW",
    items: [
      { href: "/", label: "Executive", icon: LayoutDashboard },
      { href: "/changes", label: "What Changed", icon: ArrowLeftRight },
      { href: "/showback", label: "Showback & Chargeback", icon: Wallet },
    ],
  },
  {
    caption: "OPTIMIZE",
    items: [
      { href: "/opportunities", label: "Opportunities", icon: Sparkles },
      { href: "/insights", label: "Insights", icon: Lightbulb },
      { href: "/sizing", label: "Sizing", icon: Scale },
    ],
  },
  {
    caption: "MONITOR",
    items: [
      { href: "/tracking", label: "Tracking", icon: ClipboardCheck },
      { href: "/anomalies", label: "Cost Anomalies", icon: AlertTriangle },
    ],
  },
  {
    caption: "OPERATIONS",
    items: [
      { href: "/resources", label: "Resources", icon: Boxes },
      { href: "/engine-health", label: "Engine Health", icon: Gauge },
      { href: "/run-history", label: "Run History", icon: History },
      { href: "/connect", label: "Connect Azure", icon: Plug },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/resources") return pathname === "/resources" || pathname.startsWith("/resources/");
  return pathname === href;
}

function SidebarBody({
  meta,
  entitlements,
  onNavigate,
}: {
  meta: SidebarMeta;
  entitlements: Entitlements;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-2 text-accent-cyan">
          <Activity className="h-5 w-5" />
          <p className="text-sm font-semibold tracking-wide text-white">FinOps Insight Engine</p>
        </div>
        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
          Cloud Cost Intelligence & Optimization
        </p>
      </div>
      <nav aria-label="Main navigation" className="flex-1 px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.caption}>
            <div className="nav-caption">{group.caption}</div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                const ownerModule = moduleForPath(item.href);
                const locked = ownerModule !== null && !hasModule(entitlements, ownerModule);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                      active
                        ? "bg-cyan-400/10 text-cyan-100 shadow-glow"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active && "text-accent-cyan")} />
                    <span className={cn("flex-1", locked && "text-slate-500")}>{item.label}</span>
                    {locked ? <Lock className="h-3.5 w-3.5 text-slate-500" aria-label="Not in current plan" /> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-white/10 px-4 py-4 text-xs text-slate-400">
        <PlanSwitcher plan={entitlements.plan} />
        <div className="flex justify-between gap-2">
          <span>Engine Version</span>
          <span className="text-slate-200">{meta.engineVersion}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Latest Published Run</span>
          <span className="truncate text-cyan-200">{meta.latestPublishedRunId}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Publication Status</span>
          <StatusBadge value={meta.publicationStatus === "Published" ? "PUBLISHED" : "UNPUBLISHED"} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Data Quality Status</span>
          <StatusBadge value={meta.dataQualityStatus} />
        </div>
      </div>
    </>
  );
}

const PAGE_COPY: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Executive Overview",
    subtitle: "C-level view of cloud cost, optimization and validated savings opportunities.",
  },
  "/showback": {
    title: "Showback & Chargeback",
    subtitle: "Cost allocation and financial accountability across owners, applications and cost centers.",
  },
  "/opportunities": {
    title: "Opportunities",
    subtitle: "Actionable optimization recommendations with priced and heuristic savings kept separate.",
  },
  "/tracking": {
    title: "Recommendation Tracking",
    subtitle: "What the teams decided on each recommendation, who owns it and the savings under way or delivered.",
  },
  "/connect": {
    title: "Connect your Azure",
    subtitle: "Three read only roles, one template, and you can revoke it from your own portal at any time.",
  },
  "/report": {
    title: "Executive Report",
    subtitle: "Printable summary of cost, validated savings, priorities and data quality for the current scope.",
  },
  "/changes": {
    title: "What Changed",
    subtitle: "Recommendations that appeared, were resolved or moved since the previous complete run.",
  },
  "/anomalies": {
    title: "Cost Anomalies",
    subtitle: "Weekly report of the anomaly alerting: who was notified, what was suppressed, and where coverage or ownership is missing.",
  },
  "/insights": {
    title: "Insights",
    subtitle: "What it costs to wait and which actions are worth taking first.",
  },
  "/sizing": {
    title: "Sizing",
    subtitle: "Rightsizing analysis by conservative, moderate and aggressive target profiles.",
  },
  "/resources": {
    title: "Resources",
    subtitle: "Complete analyzed inventory with drill-through into technical evidence.",
  },
  "/engine-health": {
    title: "Engine Health",
    subtitle: "Execution health, publication state and data quality of the FinOps engine.",
  },
  "/run-history": {
    title: "Run History & Trends",
    subtitle: "Compare engine executions and observe savings and quality evolution over time.",
  },
};

export function AppShell({
  children,
  meta,
  filterOptions,
  anomalyFilterOptions,
  entitlements,
}: {
  children: React.ReactNode;
  anomalyFilterOptions: AnomalyFilterOptions;
  meta: SidebarMeta;
  filterOptions: FilterOptions;
  entitlements: Entitlements;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLElement>(null);

  // The drawer closes on Escape and takes focus when it opens.
  useEffect(() => {
    if (!open) return;
    drawer.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const copy =
    PAGE_COPY[pathname] ||
    (pathname.startsWith("/resources/")
      ? { title: "Resource Detail", subtitle: "Deep technical analysis of a specific cloud resource." }
      : { title: "FinOps Insight Engine", subtitle: "Cloud Cost Intelligence & Optimization" });

  return (
    <div className="finops-shell min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="desktop-sidebar hidden flex-col lg:flex">
        <SidebarBody meta={meta} entitlements={entitlements} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside
            ref={drawer}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            tabIndex={-1}
            className="mobile-sidebar relative flex h-full w-72 flex-col bg-navy-900 overflow-y-auto outline-none"
          >
            <button className="absolute right-3 top-3 text-slate-300" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <SidebarBody meta={meta} entitlements={entitlements} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="workspace-header">
          <div className="flex items-start gap-3 px-4 py-4 sm:px-6">
            <button
              className="mt-1 rounded-lg border border-white/10 p-2 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="page-hero">
                <NetworkGlyph className="hero-network" />
                <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">CLOUD INTELLIGENCE / FINOPS</p>
                <h1 className="hero-title">{copy.title}</h1>
                <p className="mt-1 text-sm text-slate-400">{copy.subtitle}</p>
              </div>
              <div className="scope-panel">
                <p className="scope-label">{pathname === "/anomalies" ? "ALERT SCOPE" : "ANALYSIS SCOPE"}</p>
                <Suspense fallback={<div className="h-16 rounded-xl bg-navy-800/60" />}>
                  {pathname === "/anomalies" ? <AnomalyFilterBar options={anomalyFilterOptions} /> : <FilterBar options={filterOptions} />}
                </Suspense>
              </div>
            </div>
          </div>
        </header>
        <main id="main-content" className="workspace-content space-y-6 px-4 py-6 sm:px-6">
          <PlanBanner entitlements={entitlements} subscriptionCount={filterOptions.subscriptions.length} />
          {children}
        </main>
      </div>
    </div>
  );
}
