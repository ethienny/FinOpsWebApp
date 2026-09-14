// Server side access to the cost anomaly tables. In csv mode the four files
// restored into data/ are parsed on first use; in sql mode the same tables
// are read from the configured schema. Rows are normalized here so the rest
// of the module works with typed values.

import { getSqlPool, loadCsv, withRetry } from "@/lib/data/store";
import { asString, parseJson, parseNumber } from "@/lib/data/parse";
import type {
  AnomalyAlert,
  AnomalyStore,
  ContactSourceCount,
  FallbackSubscription,
  MissingSubscription,
  SubscriptionContact,
  TopSubscription,
  WeeklyCoverage,
  WeeklyStats,
} from "@/types/anomalies";

type Row = Record<string, unknown>;

function num(value: unknown): number {
  return parseNumber(value) ?? 0;
}

function isoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return asString(value).slice(0, 10);
}

function isoTimestamp(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const raw = asString(value);
  if (!raw) return "";
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  return /Z$|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
}

function list<T>(value: unknown, map: (item: Row) => T): T[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? parsed.map((item) => map(item as Row)) : [];
}

function alert(row: Row): AnomalyAlert {
  return {
    rowKey: asString(row.row_key),
    subscriptionId: asString(row.subscription_id),
    subscriptionName: asString(row.subscription_name),
    detectionDate: isoDate(row.detection_date),
    deltaPercent: num(row.delta_percent),
    totalCost: num(row.total_cost),
    notifiedAt: isoTimestamp(row.notified_at),
    sendStatus: asString(row.send_status),
    routingSource: asString(row.routing_source),
    tagStatus: asString(row.tag_status),
    contactsStatus: asString(row.contacts_status),
    contactSource: asString(row.contact_source),
    recipientOverlap: num(row.recipient_overlap),
    windowFrom: isoDate(row.window_from),
    windowTo: isoDate(row.window_to),
    windowSource: asString(row.window_source),
    observedChangeUsd: num(row.observed_change_usd),
    attributionStatus: asString(row.attribution_status),
    resourceId: asString(row.resource_id),
    resourceName: asString(row.resource_name),
    serviceType: asString(row.service_type),
    resourceGroup: asString(row.resource_group),
  };
}

function missingSub(item: Row): MissingSubscription {
  return { name: asString(item.Name), id: asString(item.Id) };
}

function coverage(row: Row): WeeklyCoverage {
  return {
    rowKey: asString(row.row_key),
    generatedAt: isoTimestamp(row.generated_at),
    covered: num(row.covered),
    missing: num(row.missing),
    skipped: num(row.skipped),
    failed: num(row.failed),
    totalChecked: num(row.total_checked),
    tfeWorkspace: asString(row.tfe_workspace),
    alertName: asString(row.alert_name),
    missingSubs: list(row.missing_subs, missingSub),
  };
}

function topSub(item: Row): TopSubscription {
  return {
    name: asString(item.Name),
    alertCount: num(item.AlertCount),
    observedIncreaseUsd: num(item.ObservedIncreaseUsd),
    notReconciled: num(item.NotReconciled),
  };
}

function contactSource(item: Row): ContactSourceCount {
  return { source: asString(item.Source), alerts: num(item.Alerts) };
}

function fallbackSub(item: Row): FallbackSubscription {
  return { name: asString(item.Name), reason: asString(item.Reason), alertCount: num(item.AlertCount) };
}

function stats(row: Row): WeeklyStats {
  return {
    rowKey: asString(row.row_key),
    generatedAt: isoTimestamp(row.generated_at),
    totalRuns: num(row.total_runs),
    succeededRuns: num(row.succeeded_runs),
    failedRuns: num(row.failed_runs),
    totalNotified: num(row.total_notified),
    totalSuppressed: num(row.total_suppressed),
    suppressionRate: num(row.suppression_rate),
    prevTotalRuns: num(row.prev_total_runs),
    prevNotified: num(row.prev_notified),
    prevSuppressed: num(row.prev_suppressed),
    weekLabel: asString(row.week_label),
    prevWeekLabel: asString(row.prev_week_label),
    topSubs: list(row.top_subs, topSub),
    topSubsObservedIncreaseTotal: num(row.top_subs_observed_increase_total),
    topSubsNotReconciled: num(row.top_subs_not_reconciled),
    topSubsBeyondCap: num(row.top_subs_beyond_cap),
    routing: {
      tag: num(row.routing_tag),
      missingTag: num(row.routing_missing_tag),
      invalidTag: num(row.routing_invalid_tag),
      lookupFailed: num(row.routing_lookup_failed),
      tagAndContacts: num(row.routing_tag_and_contacts),
      tagOnly: num(row.routing_tag_only),
      contactsOnly: num(row.routing_contacts_only),
      none: num(row.routing_none),
      legacy: num(row.routing_legacy),
      overlapAlerts: num(row.routing_overlap_alerts),
    },
    contactSources: list(row.contact_sources, contactSource),
    fallbackSubsTotal: num(row.fallback_subs_total),
    fallbackSubs: list(row.fallback_subs, fallbackSub),
  };
}

function contact(row: Row): SubscriptionContact {
  return {
    subscriptionId: asString(row.partition_key),
    applicationId: asString(row.row_key),
    ts: isoTimestamp(row.ts),
    primaryContact: asString(row.primary_contact),
    applicationSupportContact: asString(row.application_support_contact),
    architectureContact: asString(row.architecture_contact),
    sourceSystem: asString(row.source_system),
  };
}

function loadFromCsv(): AnomalyStore {
  return {
    alerts: loadCsv("anomaly_history.csv").map(alert),
    coverage: loadCsv("weekly_report_coverage.csv").map(coverage),
    stats: loadCsv("weekly_report_stats.csv").map(stats),
    contacts: loadCsv("subscription_contacts.csv").map(contact),
  };
}

const SQL_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;

async function loadFromSql(): Promise<AnomalyStore> {
  const schema = process.env.ANOMALY_SQL_SCHEMA || "dbo";
  if (!SQL_IDENTIFIER.test(schema)) throw new Error("ANOMALY_SQL_SCHEMA must be a plain SQL identifier.");
  const pool = await getSqlPool();
  const read = async (table: string) => (await pool.request().query(`SELECT * FROM [${schema}].[${table}]`)).recordset as Row[];
  return {
    alerts: (await read("anomaly_history")).map(alert),
    coverage: (await read("weekly_report_coverage")).map(coverage),
    stats: (await read("weekly_report_stats")).map(stats),
    contacts: (await read("subscription_contacts")).map(contact),
  };
}

declare global {
  var __anomalyStore: Promise<AnomalyStore> | undefined;
}

export function getAnomalyStore(): Promise<AnomalyStore> {
  if (!globalThis.__anomalyStore) {
    globalThis.__anomalyStore = (
      process.env.DATA_SOURCE === "sql" ? withRetry(loadFromSql) : Promise.resolve(loadFromCsv())
    ).catch((err) => {
      globalThis.__anomalyStore = undefined;
      throw err;
    });
  }
  return globalThis.__anomalyStore;
}
