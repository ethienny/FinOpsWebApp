// Builds the anomaly dashboard view: the reported week from the latest stats
// row, its coverage row, the alerts of the week and the derived figures.

import type {
  AnomalyAlert,
  NamedValueLike,
  SubscriptionOwnership,
  WeeklyCoverage,
  WeeklyStats,
  WeekOverWeek,
  WeekWindow,
} from "@/types/anomalies";
import { getAnomalyStore } from "./store";
import {
  alertsInWindow,
  coverageFor,
  isSent,
  latestRow,
  routingDistribution,
  subscriptionOwnership,
  weekOverWeek,
  weekWindow,
} from "./metrics";

export interface AnomalyDashboard {
  stats: WeeklyStats | null;
  coverage: WeeklyCoverage | null;
  window: WeekWindow | null;
  /** Alerts confirmed sent in the reported week. */
  alerts: AnomalyAlert[];
  /** Alerts of the week the Logic App never confirmed. */
  pending: AnomalyAlert[];
  weekOverWeek: WeekOverWeek | null;
  routing: NamedValueLike[];
  ownership: SubscriptionOwnership[];
  unowned: SubscriptionOwnership[];
}

export async function getAnomalyDashboard(): Promise<AnomalyDashboard> {
  const store = await getAnomalyStore();
  const stats = latestRow(store.stats);
  if (!stats) {
    return { stats: null, coverage: null, window: null, alerts: [], pending: [], weekOverWeek: null, routing: [], ownership: [], unowned: [] };
  }
  const window = weekWindow(stats);
  const week = alertsInWindow(store.alerts, window);
  const alerts = week.filter(isSent);
  const ownership = subscriptionOwnership(alerts, store.contacts);
  return {
    stats,
    coverage: coverageFor(stats, store.coverage),
    window,
    alerts,
    pending: week.filter((a) => !isSent(a)),
    weekOverWeek: weekOverWeek(stats),
    routing: routingDistribution(alerts),
    ownership,
    unowned: ownership.filter((o) => !o.owned),
  };
}
