// Cost anomaly alerting: the alert history written by the Function App, the
// weekly coverage and stats rows produced by the runbooks, and the contact
// rows pushed by the data team. Shapes follow the Delta tables.

export interface AnomalyAlert {
  rowKey: string;
  subscriptionId: string;
  subscriptionName: string;
  detectionDate: string;
  deltaPercent: number;
  totalCost: number;
  notifiedAt: string;
  sendStatus: string;
  routingSource: string;
  tagStatus: string;
  contactsStatus: string;
  contactSource: string;
  recipientOverlap: number;
  windowFrom: string;
  windowTo: string;
  windowSource: string;
  observedChangeUsd: number;
  attributionStatus: string;
}

export interface MissingSubscription {
  name: string;
  id: string;
}

export interface WeeklyCoverage {
  rowKey: string;
  generatedAt: string;
  covered: number;
  missing: number;
  skipped: number;
  failed: number;
  totalChecked: number;
  tfeWorkspace: string;
  alertName: string;
  missingSubs: MissingSubscription[];
}

export interface TopSubscription {
  name: string;
  alertCount: number;
  observedIncreaseUsd: number;
  notReconciled: number;
}

export interface ContactSourceCount {
  source: string;
  alerts: number;
}

export interface FallbackSubscription {
  name: string;
  reason: string;
  alertCount: number;
}

export interface RoutingCounts {
  tag: number;
  missingTag: number;
  invalidTag: number;
  lookupFailed: number;
  tagAndContacts: number;
  tagOnly: number;
  contactsOnly: number;
  none: number;
  legacy: number;
  overlapAlerts: number;
}

export interface WeeklyStats {
  rowKey: string;
  generatedAt: string;
  totalRuns: number;
  succeededRuns: number;
  failedRuns: number;
  totalNotified: number;
  totalSuppressed: number;
  suppressionRate: number;
  prevTotalRuns: number;
  prevNotified: number;
  prevSuppressed: number;
  weekLabel: string;
  prevWeekLabel: string;
  topSubs: TopSubscription[];
  topSubsObservedIncreaseTotal: number;
  topSubsNotReconciled: number;
  topSubsBeyondCap: number;
  routing: RoutingCounts;
  contactSources: ContactSourceCount[];
  fallbackSubsTotal: number;
  fallbackSubs: FallbackSubscription[];
}

export interface SubscriptionContact {
  subscriptionId: string;
  applicationId: string;
  ts: string;
  primaryContact: string;
  applicationSupportContact: string;
  architectureContact: string;
  sourceSystem: string;
}

export interface AnomalyStore {
  alerts: AnomalyAlert[];
  coverage: WeeklyCoverage[];
  stats: WeeklyStats[];
  contacts: SubscriptionContact[];
}

// ───────────────────────────────────────────────
// Scope of the anomalies page
// ───────────────────────────────────────────────

export interface AnomalyFilters {
  subscription?: string;
  routing?: string;
  attribution?: string;
}

export interface AnomalyFilterOptions {
  subscriptions: string[];
  routingSources: string[];
  attributionStatuses: string[];
}

// ───────────────────────────────────────────────
// Derived views for the dashboard
// ───────────────────────────────────────────────

export interface NamedValueLike {
  name: string;
  value: number;
}

export interface WeekWindow {
  /** Inclusive start, ISO date. */
  from: string;
  /** Exclusive end, ISO date. */
  to: string;
}

export interface Comparison {
  current: number;
  previous: number;
  delta: number;
}

export interface WeekOverWeek {
  notified: Comparison;
  suppressed: Comparison;
  suppressionRate: Comparison;
  runs: Comparison;
}

export type ContactRowStatus = "valid" | "invalid" | "missing";

/** Who owns a subscription that raised alerts, from the tag and the contact row. */
export interface SubscriptionOwnership {
  subscriptionId: string;
  subscriptionName: string;
  alertCount: number;
  routingSource: string;
  tagStatus: string;
  contactsStatus: string;
  contactRow: ContactRowStatus;
  primaryContact: string;
  owned: boolean;
  reason: string;
}
