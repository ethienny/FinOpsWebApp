// Rules of the cost anomaly dashboard: the reported week, week over week
// comparison, routing outcome per alert and subscription ownership. Pure
// functions over the store rows, unit tested.

import type {
  AnomalyAlert,
  Comparison,
  ContactRowStatus,
  NamedValueLike,
  SubscriptionContact,
  SubscriptionOwnership,
  WeeklyCoverage,
  WeeklyStats,
  WeekOverWeek,
  WeekWindow,
} from "@/types/anomalies";

const DAY_MS = 86_400_000;

export const ROUTING_LABELS: Record<string, string> = {
  tag_databricks: "Tag and contacts",
  tag_only: "Tag only",
  databricks_only: "Contacts only",
  none: "None, fallback list",
  legacy: "Legacy",
};

export function routingLabel(source: string): string {
  return ROUTING_LABELS[source] ?? (source || "Unknown");
}

/** Latest row by generation time, or null when the table is empty. */
export function latestRow<T extends { generatedAt: string }>(rows: T[]): T | null {
  return [...rows].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0] ?? null;
}

/** Coverage row of the same runbook date as the stats row, else the latest one. */
export function coverageFor(stats: WeeklyStats, coverage: WeeklyCoverage[]): WeeklyCoverage | null {
  const date = runbookDate(stats.rowKey);
  return coverage.find((c) => runbookDate(c.rowKey) === date) ?? latestRow(coverage);
}

/** Date suffix of a WeeklyReport row key, for example stats_2026-09-14. */
export function runbookDate(rowKey: string): string {
  const match = rowKey.match(/(\d{4}-\d{2}-\d{2})$/);
  return match ? match[1] : "";
}

/**
 * Reported week of a stats row: the seven days before the runbook Monday.
 * Falls back to the seven days before generation when the key has no date.
 */
export function weekWindow(stats: WeeklyStats): WeekWindow {
  const anchor = runbookDate(stats.rowKey) || stats.generatedAt.slice(0, 10);
  const to = new Date(`${anchor}T00:00:00Z`);
  const from = new Date(to.getTime() - 7 * DAY_MS);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/** Alerts notified inside the window, most recent first. */
export function alertsInWindow(alerts: AnomalyAlert[], window: WeekWindow): AnomalyAlert[] {
  return alerts
    .filter((a) => a.notifiedAt.slice(0, 10) >= window.from && a.notifiedAt.slice(0, 10) < window.to)
    .sort((a, b) => b.notifiedAt.localeCompare(a.notifiedAt));
}

export function isSent(alert: AnomalyAlert): boolean {
  return alert.sendStatus === "Sent";
}

/** Share of suppressed decisions in percent, zero when nothing was evaluated. */
export function suppressionRate(notified: number, suppressed: number): number {
  const total = notified + suppressed;
  return total ? (suppressed / total) * 100 : 0;
}

function compare(current: number, previous: number): Comparison {
  return { current, previous, delta: current - previous };
}

/** Week over week figures from the stats row. The rate is recomputed for the prior week. */
export function weekOverWeek(stats: WeeklyStats): WeekOverWeek {
  return {
    notified: compare(stats.totalNotified, stats.prevNotified),
    suppressed: compare(stats.totalSuppressed, stats.prevSuppressed),
    suppressionRate: compare(stats.suppressionRate, suppressionRate(stats.prevNotified, stats.prevSuppressed)),
    runs: compare(stats.totalRuns, stats.prevTotalRuns),
  };
}

/** Alerts per routing outcome, largest first. */
export function routingDistribution(alerts: AnomalyAlert[]): NamedValueLike[] {
  const map = new Map<string, number>();
  for (const a of alerts) map.set(a.routingSource, (map.get(a.routingSource) ?? 0) + 1);
  return [...map.entries()].map(([source, value]) => ({ name: routingLabel(source), value })).sort((a, b) => b.value - a.value);
}

const EMAIL = /^[^\s@;]+@[^\s@;]+\.[^\s@;]+$/;

/** A contact row counts when its primary contact holds at least one address. */
export function contactRowStatus(contact: SubscriptionContact | undefined): ContactRowStatus {
  if (!contact) return "missing";
  const addresses = contact.primaryContact.split(";").map((s) => s.trim()).filter(Boolean);
  return addresses.length && addresses.every((a) => EMAIL.test(a)) ? "valid" : "invalid";
}

const TAG_REASON: Record<string, string> = {
  found: "tag found",
  missing: "tag missing",
  invalid: "tag invalid",
};

const CONTACT_REASON: Record<ContactRowStatus, string> = {
  valid: "contact row valid",
  invalid: "contact row invalid",
  missing: "no contact row",
};

/**
 * Ownership of every subscription that raised an alert in the list. A
 * subscription is owned when the tag resolved or the contact row names a
 * valid address; otherwise the alert went to the fallback list.
 */
export function subscriptionOwnership(alerts: AnomalyAlert[], contacts: SubscriptionContact[]): SubscriptionOwnership[] {
  const contactById = new Map(contacts.map((c) => [c.subscriptionId, c]));
  const bySubscription = new Map<string, AnomalyAlert[]>();
  for (const a of alerts) {
    const list = bySubscription.get(a.subscriptionId) ?? [];
    list.push(a);
    bySubscription.set(a.subscriptionId, list);
  }
  const result: SubscriptionOwnership[] = [];
  for (const [subscriptionId, list] of bySubscription) {
    const latest = [...list].sort((a, b) => b.notifiedAt.localeCompare(a.notifiedAt))[0];
    const contact = contactById.get(subscriptionId);
    const rowStatus = contactRowStatus(contact);
    const tagOk = latest.tagStatus === "found";
    const contactOk = rowStatus === "valid" && latest.contactsStatus !== "lookup_failed";
    const contactReason = latest.contactsStatus === "lookup_failed" ? "contact lookup failed" : CONTACT_REASON[rowStatus];
    result.push({
      subscriptionId,
      subscriptionName: latest.subscriptionName,
      alertCount: list.length,
      routingSource: latest.routingSource,
      tagStatus: latest.tagStatus,
      contactsStatus: latest.contactsStatus,
      contactRow: rowStatus,
      primaryContact: contact?.primaryContact ?? "",
      owned: tagOk || contactOk,
      reason: `${TAG_REASON[latest.tagStatus] ?? "tag unknown"}, ${contactReason}`,
    });
  }
  return result.sort((a, b) => b.alertCount - a.alertCount || a.subscriptionName.localeCompare(b.subscriptionName));
}
