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
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

// Menu groups follow the question the user brings: how are we doing, what
// should we act on, what is happening now, and what exists behind the numbers.
function navGroups(dict: Dictionary) {
  return [
    {
      caption: dict.shell.nav.groups.overview,
      items: [
        { href: "/", label: dict.shell.nav.items.executive, icon: LayoutDashboard },
        { href: "/changes", label: dict.shell.nav.items.whatChanged, icon: ArrowLeftRight },
        { href: "/showback", label: dict.shell.nav.items.showback, icon: Wallet },
      ],
    },
    {
      caption: dict.shell.nav.groups.optimize,
      items: [
        { href: "/opportunities", label: dict.shell.nav.items.opportunities, icon: Sparkles },
        { href: "/insights", label: dict.shell.nav.items.insights, icon: Lightbulb },
        { href: "/sizing", label: dict.shell.nav.items.sizing, icon: Scale },
      ],
    },
    {
      caption: dict.shell.nav.groups.monitor,
      items: [
        { href: "/tracking", label: dict.shell.nav.items.tracking, icon: ClipboardCheck },
        { href: "/anomalies", label: dict.shell.nav.items.costAnomalies, icon: AlertTriangle },
      ],
    },
    {
      caption: dict.shell.nav.groups.operations,
      items: [
        { href: "/resources", label: dict.shell.nav.items.resources, icon: Boxes },
        { href: "/engine-health", label: dict.shell.nav.items.engineHealth, icon: Gauge },
        { href: "/run-history", label: dict.shell.nav.items.runHistory, icon: History },
        { href: "/connect", label: dict.shell.nav.items.connectAzure, icon: Plug },
      ],
    },
  ];
}

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
  const { dict } = useLocale();
  return (
    <>
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-2 text-accent-cyan">
          <Activity className="h-5 w-5" />
          <p className="text-sm font-semibold tracking-wide text-white">{dict.shell.brand.name}</p>
        </div>
        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">{dict.shell.brand.tagline}</p>
      </div>
      <nav aria-label={dict.shell.nav.ariaLabel} className="flex-1 px-3 pb-4">
        {navGroups(dict).map((group) => (
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
                    {locked ? <Lock className="h-3.5 w-3.5 text-slate-500" aria-label={dict.shell.nav.lockedTitle} /> : null}
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
          <span>{dict.shell.sidebar.engineVersion}</span>
          <span className="text-slate-200">{meta.engineVersion}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>{dict.shell.sidebar.latestPublishedRun}</span>
          <span className="truncate text-cyan-200">{meta.latestPublishedRunId}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>{dict.shell.sidebar.publicationStatus}</span>
          <StatusBadge value={meta.publicationStatus === "Published" ? "PUBLISHED" : "UNPUBLISHED"} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>{dict.shell.sidebar.dataQualityStatus}</span>
          <StatusBadge value={meta.dataQualityStatus} />
        </div>
      </div>
    </>
  );
}

function pageCopy(dict: Dictionary): Record<string, { title: string; subtitle: string }> {
  return {
    "/": dict.shell.pages.home,
    "/showback": dict.shell.pages.showback,
    "/opportunities": dict.shell.pages.opportunities,
    "/tracking": dict.shell.pages.tracking,
    "/connect": dict.shell.pages.connect,
    "/report": dict.shell.pages.report,
    "/changes": dict.shell.pages.changes,
    "/anomalies": dict.shell.pages.anomalies,
    "/insights": dict.shell.pages.insights,
    "/sizing": dict.shell.pages.sizing,
    "/resources": dict.shell.pages.resources,
    "/engine-health": dict.shell.pages.engineHealth,
    "/run-history": dict.shell.pages.runHistory,
  };
}

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
  const { dict } = useLocale();
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
    pageCopy(dict)[pathname] ||
    (pathname.startsWith("/resources/") ? dict.shell.pages.resourceDetail : dict.shell.pages.fallback);

  return (
    <div className="finops-shell min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#main-content" className="skip-link">{dict.shell.skipLink}</a>
      <aside className="desktop-sidebar hidden flex-col lg:flex">
        <SidebarBody meta={meta} entitlements={entitlements} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label={dict.shell.mobileMenu.closeMenu} />
          <aside
            ref={drawer}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label={dict.shell.mobileMenu.navigationAria}
            tabIndex={-1}
            className="mobile-sidebar relative flex h-full w-72 flex-col bg-navy-900 overflow-y-auto outline-none"
          >
            <button className="absolute right-3 top-3 text-slate-300" onClick={() => setOpen(false)} aria-label={dict.shell.mobileMenu.close}>
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
              aria-label={dict.shell.mobileMenu.open}
              aria-expanded={open}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="page-hero">
                <NetworkGlyph className="hero-network" />
                <div className="relative z-[2] flex items-start justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">{dict.shell.eyebrow}</p>
                  <LanguageSwitcher />
                </div>
                <h1 className="hero-title">{copy.title}</h1>
                <p className="mt-1 text-sm text-slate-400">{copy.subtitle}</p>
              </div>
              <div className="scope-panel">
                <p className="scope-label">{pathname === "/anomalies" ? dict.shell.scope.alertScope : dict.shell.scope.analysisScope}</p>
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
