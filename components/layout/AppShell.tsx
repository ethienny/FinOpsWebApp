"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  Gauge,
  History,
  LayoutDashboard,
  Menu,
  Scale,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { Suspense, useState } from "react";
import type { FilterOptions, SidebarMeta } from "@/types/finops";
import { FilterBar } from "@/components/filters/FilterBar";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/badges";
import { NetworkGlyph } from "@/components/layout/NetworkGlyph";

const NAV = [
  { href: "/", label: "Executive", icon: LayoutDashboard },
  { href: "/showback", label: "Showback & Chargeback", icon: Wallet },
  { href: "/opportunities", label: "Opportunities", icon: Sparkles },
  { href: "/sizing", label: "Sizing", icon: Scale },
  { href: "/resources", label: "Resources", icon: Boxes },
  { href: "/engine-health", label: "Engine Health", icon: Gauge },
  { href: "/run-history", label: "Run History", icon: History },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/executive");
  if (href === "/resources") return pathname === "/resources" || pathname.startsWith("/resources/");
  return pathname === href;
}

function SidebarBody({ meta, onNavigate }: { meta: SidebarMeta; onNavigate?: () => void }) {
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
      <div className="nav-caption">WORKSPACE / INTELLIGENCE</div>
      <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
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
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-white/10 px-4 py-4 text-xs text-slate-400">
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
}: {
  children: React.ReactNode;
  meta: SidebarMeta;
  filterOptions: FilterOptions;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const copy =
    PAGE_COPY[pathname] ||
    (pathname.startsWith("/resources/")
      ? { title: "Resource Detail", subtitle: "Deep technical analysis of a specific cloud resource." }
      : { title: "FinOps Insight Engine", subtitle: "Cloud Cost Intelligence & Optimization" });

  return (
    <div className="finops-shell min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="desktop-sidebar hidden flex-col lg:flex">
        <SidebarBody meta={meta} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="mobile-sidebar relative flex h-full w-72 flex-col bg-navy-900 overflow-y-auto">
            <button className="absolute right-3 top-3 text-slate-300" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <SidebarBody meta={meta} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="workspace-header">
          <div className="flex items-start gap-3 px-4 py-4 sm:px-6">
            <button className="mt-1 rounded-lg border border-white/10 p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="page-hero">
                <NetworkGlyph className="hero-network" />
                <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">CLOUD INTELLIGENCE / FINOPS</p>
                <h1 className="hero-title">{copy.title}</h1>
                <p className="mt-1 text-sm text-slate-400">{copy.subtitle}</p>
              </div>
              <div className="scope-panel"><p className="scope-label">ANALYSIS SCOPE</p>
              <Suspense fallback={<div className="h-16 rounded-xl bg-navy-800/60" />}>
                <FilterBar options={filterOptions} />
              </Suspense></div>
            </div>
          </div>
        </header>
        <main id="main-content" className="workspace-content px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
