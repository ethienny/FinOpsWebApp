// Builds the anomaly dashboard view: the reported week from the latest stats
// row, its coverage row, the alerts of the week and the derived figures. The
// page scope narrows alerts, top subscriptions, coverage and ownership;
// suppression counts stay week totals because suppressed alerts leave no row.

import type {
  AnomalyAlert,
  AnomalyFilterOptions,
  AnomalyFilters,
  NamedValueLike,
  SubscriptionOwnership,
  TopSubscription,
  WeeklyCoverage,
  WeeklyStats,
  WeekOverWeek,
  WeekWindow,
} from "@/types/anomalies";
import { uniqueSorted } from "@/lib/data/parse";
import { getAnomalyStore } from "./store";
import {
  alertsInWindow,
  coverageFor,
  hasAnomalyFilters,
  isSent,
  latestRow,
  matchesAnomalyFilters,
  routingDistribution,
  subscriptionOwnership,
  topSubscriptionsFromAlerts,
  weekOverWeek,
  weekWindow,
} from "./metrics";

export interface AnomalyDashboard {
  stats: WeeklyStats | null;
  coverage: WeeklyCoverage | null;
  window: WeekWindow | null;
  filtered: boolean;
  /** Alerts confirmed sent in the reported week, inside the page scope. */
  alerts: AnomalyAlert[];
  /** Alerts of the week the Logic App never confirmed. */
  pending: AnomalyAlert[];
  weekOverWeek: WeekOverWeek | null;
  routing: NamedValueLike[];
  /** From the stats row when unfiltered, derived from the scoped alerts otherwise. */
  topSubs: TopSubscription[];
  observedIncreaseTotal: number;
  notReconciled: number;
  ownership: SubscriptionOwnership[];
  unowned: SubscriptionOwnership[];
}

const EMPTY: AnomalyDashboard = {
  stats: null,
  coverage: null,
  window: null,
  filtered: false,
  alerts: [],
  pending: [],
  weekOverWeek: null,
  routing: [],
  topSubs: [],
  observedIncreaseTotal: 0,
  notReconciled: 0,
  ownership: [],
  unowned: [],
};

export function anomalyFiltersFromSearchParams(sp: Record<string, string | string[] | undefined>): AnomalyFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) || undefined;
  };
  return { subscription: one("subscription"), routing: one("routing"), attribution: one("attribution") };
}

/** Values offered by the page scope, from every alert in the history. */
export async function getAnomalyFilterOptions(): Promise<AnomalyFilterOptions> {
  try {
    const { alerts } = await getAnomalyStore();
    return {
      subscriptions: uniqueSorted(alerts.map((a) => a.subscriptionName)),
      routingSources: uniqueSorted(alerts.map((a) => a.routingSource)),
      attributionStatuses: uniqueSorted(alerts.map((a) => a.attributionStatus)),
    };
  } catch {
    return { subscriptions: [], routingSources: [], attributionStatuses: [] };
  }
}

export async function getAnomalyDashboard(filters: AnomalyFilters = {}): Promise<AnomalyDashboard> {
  const store = await getAnomalyStore();
  const stats = latestRow(store.stats);
  if (!stats) return EMPTY;

  const filtered = hasAnomalyFilters(filters);
  const window = weekWindow(stats);
  const week = alertsInWindow(store.alerts, window).filter((a) => matchesAnomalyFilters(a, filters));
  const alerts = week.filter(isSent);
  const ownership = subscriptionOwnership(alerts, store.contacts);
  const topSubs = filtered ? topSubscriptionsFromAlerts(alerts) : stats.topSubs;

  let coverage = coverageFor(stats, store.coverage);
  if (coverage && filters.subscription) {
    coverage = { ...coverage, missingSubs: coverage.missingSubs.filter((s) => s.name === filters.subscription) };
  }

  return {
    stats,
    coverage,
    window,
    filtered,
    alerts,
    pending: week.filter((a) => !isSent(a)),
    weekOverWeek: weekOverWeek(stats),
    routing: routingDistribution(alerts),
    topSubs,
    observedIncreaseTotal: filtered ? topSubs.reduce((a, s) => a + s.observedIncreaseUsd, 0) : stats.topSubsObservedIncreaseTotal,
    notReconciled: filtered ? topSubs.reduce((a, s) => a + s.notReconciled, 0) : stats.topSubsNotReconciled,
    ownership,
    unowned: ownership.filter((o) => !o.owned),
  };
}
