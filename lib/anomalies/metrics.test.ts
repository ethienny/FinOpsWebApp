// Rules of the anomaly dashboard: the reported week, the week over week
// comparison, routing distribution and subscription ownership.

import { describe, expect, it } from "vitest";
import type { AnomalyAlert, SubscriptionContact, WeeklyStats } from "@/types/anomalies";
import {
  alertsInWindow,
  contactRowStatus,
  routingDistribution,
  runbookDate,
  subscriptionOwnership,
  suppressionRate,
  weekOverWeek,
  weekWindow,
} from "./metrics";

function stats(extra: Partial<WeeklyStats> = {}): WeeklyStats {
  return {
    rowKey: "stats_2026-09-14",
    generatedAt: "2026-09-14T09:33:47Z",
    totalNotified: 11,
    totalSuppressed: 5,
    suppressionRate: 31.3,
    prevNotified: 4,
    prevSuppressed: 7,
    totalRuns: 17,
    prevTotalRuns: 11,
    ...extra,
  } as WeeklyStats;
}

function alert(id: string, name: string, notifiedAt: string, extra: Partial<AnomalyAlert> = {}): AnomalyAlert {
  return {
    subscriptionId: id,
    subscriptionName: name,
    notifiedAt,
    sendStatus: "Sent",
    routingSource: "tag_databricks",
    tagStatus: "found",
    contactsStatus: "found",
    ...extra,
  } as AnomalyAlert;
}

function contact(id: string, primaryContact: string): SubscriptionContact {
  return { subscriptionId: id, primaryContact } as SubscriptionContact;
}

describe("week window", () => {
  it("reads the runbook date from the row key and reports the seven days before it", () => {
    expect(runbookDate("stats_2026-09-14")).toBe("2026-09-14");
    expect(weekWindow(stats())).toEqual({ from: "2026-09-07", to: "2026-09-14" });
  });

  it("falls back to the generation date when the key has no date", () => {
    expect(weekWindow(stats({ rowKey: "stats" }))).toEqual({ from: "2026-09-07", to: "2026-09-14" });
  });

  it("keeps alerts notified inside the window, most recent first", () => {
    const alerts = [
      alert("a", "a", "2026-09-07T08:00:00Z"),
      alert("b", "b", "2026-09-13T08:00:00Z"),
      alert("c", "c", "2026-09-14T00:00:00Z"),
      alert("d", "d", "2026-09-06T23:59:00Z"),
    ];
    expect(alertsInWindow(alerts, { from: "2026-09-07", to: "2026-09-14" }).map((a) => a.subscriptionId)).toEqual(["b", "a"]);
  });
});

describe("week over week", () => {
  it("computes the suppression rate and the deltas against the prior week", () => {
    expect(suppressionRate(11, 5)).toBeCloseTo(31.25);
    expect(suppressionRate(0, 0)).toBe(0);
    const wow = weekOverWeek(stats());
    expect(wow.notified).toEqual({ current: 11, previous: 4, delta: 7 });
    expect(wow.suppressed).toEqual({ current: 5, previous: 7, delta: -2 });
    expect(wow.suppressionRate.previous).toBeCloseTo(63.64, 1);
    expect(wow.runs.delta).toBe(6);
  });
});

describe("routing distribution", () => {
  it("labels each routing source and sorts by count", () => {
    const alerts = [
      alert("a", "a", "2026-09-07T08:00:00Z"),
      alert("b", "b", "2026-09-08T08:00:00Z"),
      alert("c", "c", "2026-09-09T08:00:00Z", { routingSource: "none" }),
    ];
    expect(routingDistribution(alerts)).toEqual([
      { name: "Tag and contacts", value: 2 },
      { name: "None, fallback list", value: 1 },
    ]);
  });
});

describe("subscription ownership", () => {
  it("validates the contact row by its primary contact addresses", () => {
    expect(contactRowStatus(undefined)).toBe("missing");
    expect(contactRowStatus(contact("a", "N/A"))).toBe("invalid");
    expect(contactRowStatus(contact("a", ""))).toBe("invalid");
    expect(contactRowStatus(contact("a", "ana@example.com;pedro@example.com"))).toBe("valid");
  });

  it("marks a subscription unowned when neither the tag nor the contact row resolves", () => {
    const alerts = [
      alert("1", "sub-payments", "2026-09-07T08:00:00Z"),
      alert("1", "sub-payments", "2026-09-09T08:00:00Z"),
      alert("5", "sub-legacy", "2026-09-10T08:00:00Z", { routingSource: "none", tagStatus: "missing", contactsStatus: "invalid" }),
      alert("6", "sub-ml", "2026-09-10T08:00:00Z", { routingSource: "databricks_only", tagStatus: "missing" }),
      alert("7", "sub-hub", "2026-09-12T08:00:00Z", { routingSource: "none", tagStatus: "invalid", contactsStatus: "lookup_failed" }),
    ];
    const contacts = [contact("1", "ana@example.com"), contact("5", "N/A"), contact("6", "lucas@example.com"), contact("7", "x@example.com")];
    const rows = subscriptionOwnership(alerts, contacts);
    expect(rows.map((r) => [r.subscriptionName, r.alertCount, r.owned, r.reason])).toEqual([
      ["sub-payments", 2, true, "tag found, contact row valid"],
      ["sub-hub", 1, false, "tag invalid, contact lookup failed"],
      ["sub-legacy", 1, false, "tag missing, contact row invalid"],
      ["sub-ml", 1, true, "tag missing, contact row valid"],
    ]);
  });
});
