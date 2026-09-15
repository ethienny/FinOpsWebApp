// Builds the year long cost anomaly mock on top of the weekly report seed.
// The seed rows stay untouched (they are the truth the dashboard is checked
// against); this script adds resource details to every alert, taken from
// the FinOps inventory mock, and generates earlier weeks of alerts with one
// weekly_report_stats row per week so the timeline covers the year. The
// random generator is seeded, so the output is stable between runs.
//
// Usage:
//   node scripts/generate-anomaly-mock.mjs
// Requires data/vw_finops_latest_complete_run.csv (npm run data:restore).

import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import { parseSeed, TABLES } from "./anomaly-seed-to-csv.mjs";
import { writeTableCsv } from "./csv-mock.mjs";

const RESOURCE_COLUMNS = ["resource_id", "resource_name", "service_type", "resource_group"];
const FIRST_WEEK = "2025-01-06";
const LAST_GENERATED_WEEK = "2026-08-24";
const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260914);
const between = (min, max) => min + rand() * (max - min);
const pick = (list) => list[Math.floor(rand() * list.length)];
const round2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => n.toFixed(2);

function addDays(iso, days) {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

function weekLabel(monday) {
  const a = new Date(`${monday}T00:00:00Z`);
  const b = new Date(a.getTime() + 6 * DAY_MS);
  const day = (d) => String(d.getUTCDate()).padStart(2, "0");
  return `${MONTHS[a.getUTCMonth()]} ${day(a)} – ${MONTHS[b.getUTCMonth()]} ${day(b)}, ${b.getUTCFullYear()}`;
}

function rowKeyFor(subscriptionId, notifiedAt) {
  const stamp = notifiedAt.replace(" ", "T").replace(/:/g, "-");
  return `${subscriptionId}_${stamp}-${String(Math.floor(rand() * 999999)).padStart(6, "0")}+00-00`;
}

// ───────────────────────────────────────────────
// Inputs
// ───────────────────────────────────────────────

const seed = parseSeed();
const inventory = Papa.parse(readFileSync(join(process.cwd(), "data", "vw_finops_latest_complete_run.csv"), "utf8"), {
  header: true,
  skipEmptyLines: true,
}).data.filter((r) => Number(r.MonthlyCost) > 0 && r.ResourceName && r.ServiceType);

/** Alert profile of each subscription, from its latest seed row. */
const subscriptions = new Map();
for (const row of [...seed.anomaly_history.rows].sort((a, b) => a.notified_at.localeCompare(b.notified_at))) {
  subscriptions.set(row.subscription_id, {
    id: row.subscription_id,
    name: row.subscription_name,
    routing_source: row.routing_source,
    tag_status: row.tag_status,
    contacts_status: row.contacts_status,
    contact_source: row.contact_source,
    recipient_overlap: row.recipient_overlap,
    window_source: row.window_source,
    weight: row.subscription_name.endsWith("-prod") ? 3 : 1,
    resources: [],
  });
}
for (const sub of subscriptions.values()) {
  const count = 6 + Math.floor(rand() * 7);
  while (sub.resources.length < count) {
    const r = pick(inventory);
    if (!sub.resources.some((x) => x.ResourceId === r.ResourceId)) sub.resources.push(r);
  }
}

function withResource(row) {
  const r = pick(subscriptions.get(row.subscription_id).resources);
  return { ...row, resource_id: r.ResourceId, resource_name: r.ResourceName, service_type: r.ServiceType, resource_group: r.ResourceGroup };
}

// ───────────────────────────────────────────────
// Generated weeks
// ───────────────────────────────────────────────

function weeklyAlertCount(index) {
  const seasonal = 6 + 3 * Math.sin((index / 52) * Math.PI * 2);
  const spike = (index >= 10 && index <= 12) || (index >= 27 && index <= 29) ? 8 : 0;
  return Math.max(1, Math.round(seasonal + spike + between(-1.5, 2.5)));
}

function weightedSubscription() {
  const pool = [...subscriptions.values()].flatMap((s) => Array(s.weight).fill(s));
  return pick(pool);
}

function generateAlert(monday) {
  const sub = weightedSubscription();
  const detection = addDays(monday, Math.floor(rand() * 7) - 1);
  const notifiedDate = addDays(detection, 1);
  const notifiedAt = `${notifiedDate} 08:${String(Math.floor(rand() * 20)).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}`;
  const delta = round2(between(25, 400));
  const totalCost = round2(between(400, 8000));
  const roll = rand();
  const attribution = roll < 0.7 ? "reconciled" : roll < 0.85 ? "partial" : "not_reconciled";
  const increase = (totalCost * delta) / (100 + delta);
  const observed = attribution === "reconciled" ? increase * between(0.8, 1.1) : attribution === "partial" ? increase * between(0.3, 0.5) : 0;
  return withResource({
    partition_key: "AnomalyHistory",
    row_key: rowKeyFor(sub.id, notifiedAt),
    subscription_id: sub.id,
    subscription_name: sub.name,
    detection_date: detection,
    delta_percent: fmt(delta),
    total_cost: fmt(totalCost),
    notified_at: notifiedAt,
    send_status: "Sent",
    routing_source: sub.routing_source,
    tag_status: sub.tag_status,
    contacts_status: sub.contacts_status,
    contact_source: sub.contact_source,
    recipient_overlap: sub.recipient_overlap,
    window_from: addDays(detection, -30),
    window_to: addDays(detection, -1),
    window_source: sub.window_source,
    observed_change_usd: fmt(round2(observed)),
    attribution_status: attribution,
  });
}

/** Stats row of one week from its alerts, the way the runbook aggregates them. */
function statsRow(monday, alerts, previous, forced = {}) {
  const sent = alerts.filter((a) => a.send_status === "Sent");
  const bySub = new Map();
  for (const a of sent) {
    const row = bySub.get(a.subscription_name) ?? { Name: a.subscription_name, AlertCount: 0, ObservedIncreaseUsd: 0, NotReconciled: 0 };
    row.AlertCount += 1;
    if (a.attribution_status !== "not_reconciled") row.ObservedIncreaseUsd = round2(row.ObservedIncreaseUsd + Number(a.observed_change_usd));
    if (a.attribution_status === "not_reconciled") row.NotReconciled += 1;
    bySub.set(a.subscription_name, row);
  }
  const topSubs = [...bySub.values()].sort((a, b) => b.AlertCount - a.AlertCount || a.Name.localeCompare(b.Name));
  const count = (source) => sent.filter((a) => a.routing_source === source).length;
  const fallback = topSubs.filter((s) => sent.some((a) => a.subscription_name === s.Name && a.routing_source === "none"));
  const suppressed = forced.suppressed ?? Math.floor(between(1, 9));
  const failed = forced.failed ?? (rand() < 0.2 ? 1 : 0);
  const notified = sent.length;
  const totalRuns = forced.totalRuns ?? notified + suppressed + failed;
  const runbook = addDays(monday, 7);
  return {
    partition_key: "WeeklyReport",
    row_key: `stats_${runbook}`,
    generated_at: `${runbook} 09:33:47`,
    total_runs: totalRuns,
    succeeded_runs: totalRuns - failed,
    failed_runs: failed,
    total_notified: notified,
    total_suppressed: suppressed,
    suppression_rate: (notified + suppressed ? (suppressed / (notified + suppressed)) * 100 : 0).toFixed(1),
    prev_total_runs: previous?.total_runs ?? 0,
    prev_notified: previous?.total_notified ?? 0,
    prev_suppressed: previous?.total_suppressed ?? 0,
    week_label: weekLabel(monday),
    prev_week_label: previous?.week_label ?? "",
    top_subs: JSON.stringify(topSubs),
    top_subs_observed_increase_total: fmt(round2(topSubs.reduce((a, s) => a + s.ObservedIncreaseUsd, 0))),
    top_subs_not_reconciled: topSubs.reduce((a, s) => a + s.NotReconciled, 0),
    top_subs_beyond_cap: 0,
    routing_tag: 0,
    routing_missing_tag: 0,
    routing_invalid_tag: 0,
    routing_lookup_failed: 0,
    routing_tag_and_contacts: count("tag_databricks"),
    routing_tag_only: count("tag_only"),
    routing_contacts_only: count("databricks_only"),
    routing_none: count("none"),
    routing_legacy: count("legacy"),
    routing_overlap_alerts: sent.filter((a) => Number(a.recipient_overlap) > 0).length,
    contact_sources: JSON.stringify(
      [...new Set(sent.map((a) => a.contact_source).filter(Boolean))].map((source) => ({ Source: source, Alerts: sent.filter((a) => a.contact_source === source).length })),
    ),
    fallback_subs_total: fallback.length,
    fallback_subs: JSON.stringify(fallback.map((s) => ({ Name: s.Name, Reason: "none", AlertCount: s.AlertCount }))),
  };
}

// ───────────────────────────────────────────────
// Assemble
// ───────────────────────────────────────────────

const seedAlerts = seed.anomaly_history.rows.map(withResource);
const seedStats = seed.weekly_report_stats.rows[0];
const priorWeekMonday = addDays(seedStats.row_key.replace("stats_", ""), -14);

const history = [];
const stats = [];
let previous = null;
let index = 0;
for (let monday = FIRST_WEEK; monday <= LAST_GENERATED_WEEK; monday = addDays(monday, 7)) {
  const alerts = Array.from({ length: weeklyAlertCount(index) }, () => generateAlert(monday));
  history.push(...alerts);
  const row = statsRow(monday, alerts, previous);
  stats.push(row);
  previous = row;
  index += 1;
}

// Prior week of the seed: its alerts come from the seed and its totals must
// match the prev_* columns of the seed stats row.
const priorAlerts = seedAlerts.filter((a) => a.notified_at.slice(0, 10) >= priorWeekMonday && a.notified_at.slice(0, 10) < addDays(priorWeekMonday, 7));
const priorRow = statsRow(priorWeekMonday, priorAlerts, previous, {
  suppressed: Number(seedStats.prev_suppressed),
  totalRuns: Number(seedStats.prev_total_runs),
  failed: 0,
});
stats.push(priorRow);
stats.push(seedStats);
history.push(...seedAlerts);
history.sort((a, b) => a.notified_at.localeCompare(b.notified_at));

const tables = {
  anomaly_history: { columns: [...seed.anomaly_history.columns, ...RESOURCE_COLUMNS], rows: history },
  weekly_report_coverage: seed.weekly_report_coverage,
  weekly_report_stats: { columns: seed.weekly_report_stats.columns, rows: stats },
  subscription_contacts: seed.subscription_contacts,
};
for (const table of TABLES) await writeTableCsv(table, tables[table].columns, tables[table].rows);
