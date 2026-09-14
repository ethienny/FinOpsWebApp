"use client";

// Client tables of the cost anomaly dashboard: alerts of the week, routing
// per alert, top subscriptions and subscriptions without an owner.

import { formatDate, formatMoney, formatNumber } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { OutcomeBadge } from "@/components/badges";
import type { AnomalyAlert, SubscriptionOwnership, TopSubscription } from "@/types/anomalies";

function pct(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function routingLabel(source: string): string {
  const labels: Record<string, string> = {
    tag_databricks: "Tag and contacts",
    tag_only: "Tag only",
    databricks_only: "Contacts only",
    none: "None, fallback list",
    legacy: "Legacy",
  };
  return labels[source] ?? (source || "Unknown");
}

const ALERT_SEARCH: Array<keyof AnomalyAlert> = ["subscriptionName", "attributionStatus", "routingSource"];

const ALERT_COLUMNS: Column<AnomalyAlert>[] = [
  { key: "subscriptionName", header: "Subscription", filterable: true },
  { key: "detectionDate", header: "Detected", render: (r) => r.detectionDate },
  { key: "notifiedAt", header: "Notified", render: (r) => formatDate(r.notifiedAt) },
  { key: "deltaPercent", header: "Delta", numeric: true, sortValue: (r) => r.deltaPercent, render: (r) => pct(r.deltaPercent) },
  { key: "totalCost", header: "Total cost", numeric: true, sortValue: (r) => r.totalCost, render: (r) => formatMoney(r.totalCost, "USD", false) },
  {
    key: "observedChangeUsd",
    header: "Observed increase",
    numeric: true,
    sortValue: (r) => r.observedChangeUsd,
    render: (r) => (r.attributionStatus === "not_reconciled" ? "—" : formatMoney(r.observedChangeUsd, "USD", false)),
  },
  { key: "attributionStatus", header: "Attribution", filterable: true, render: (r) => <OutcomeBadge value={r.attributionStatus} /> },
  { key: "windowSource", header: "Window", render: (r) => `${r.windowFrom} to ${r.windowTo} (${r.windowSource})` },
];

export function AnomalyAlertsTable({ rows }: { rows: AnomalyAlert[] }) {
  return <DataTable<AnomalyAlert> rows={rows} columns={ALERT_COLUMNS} searchKeys={ALERT_SEARCH} pageSize={12} rowKey={(r) => r.rowKey} />;
}

const ROUTING_COLUMNS: Column<AnomalyAlert>[] = [
  { key: "subscriptionName", header: "Subscription", filterable: true },
  { key: "notifiedAt", header: "Notified", render: (r) => formatDate(r.notifiedAt) },
  { key: "routingSource", header: "Routing source", filterable: true, render: (r) => routingLabel(r.routingSource) },
  { key: "tagStatus", header: "Tag", render: (r) => <OutcomeBadge value={r.tagStatus} /> },
  { key: "contactsStatus", header: "Contacts", render: (r) => <OutcomeBadge value={r.contactsStatus} /> },
  { key: "contactSource", header: "Contact source", render: (r) => r.contactSource || "—" },
  { key: "recipientOverlap", header: "Overlap", numeric: true, sortValue: (r) => r.recipientOverlap, render: (r) => formatNumber(r.recipientOverlap, false) },
];

export function AlertRoutingTable({ rows }: { rows: AnomalyAlert[] }) {
  return <DataTable<AnomalyAlert> rows={rows} columns={ROUTING_COLUMNS} searchKeys={ALERT_SEARCH} pageSize={12} rowKey={(r) => r.rowKey} />;
}

export type TopSubscriptionRow = TopSubscription & { owned: boolean | null };

const TOP_COLUMNS: Column<TopSubscriptionRow>[] = [
  { key: "name", header: "Subscription" },
  { key: "alertCount", header: "Alerts", numeric: true, sortValue: (r) => r.alertCount },
  {
    key: "observedIncreaseUsd",
    header: "Observed increase",
    numeric: true,
    sortValue: (r) => r.observedIncreaseUsd,
    render: (r) => formatMoney(r.observedIncreaseUsd, "USD", false),
  },
  { key: "notReconciled", header: "Not reconciled", numeric: true, sortValue: (r) => r.notReconciled },
  { key: "owned", header: "Owner", render: (r) => (r.owned === null ? "—" : <OutcomeBadge value={r.owned ? "owned" : "unowned"} />) },
];

export function TopSubscriptionsTable({ rows }: { rows: TopSubscriptionRow[] }) {
  return <DataTable<TopSubscriptionRow> rows={rows} columns={TOP_COLUMNS} searchKeys={["name"]} pageSize={10} rowKey={(r) => r.name} />;
}

const UNOWNED_COLUMNS: Column<SubscriptionOwnership>[] = [
  { key: "subscriptionName", header: "Subscription" },
  { key: "subscriptionId", header: "Subscription id", render: (r) => <span className="font-mono text-xs text-slate-400">{r.subscriptionId}</span> },
  { key: "alertCount", header: "Alerts", numeric: true, sortValue: (r) => r.alertCount },
  { key: "routingSource", header: "Routing source", render: (r) => routingLabel(r.routingSource) },
  { key: "tagStatus", header: "Tag", render: (r) => <OutcomeBadge value={r.tagStatus} /> },
  { key: "contactRow", header: "Contact row", render: (r) => <OutcomeBadge value={r.contactRow} /> },
  { key: "reason", header: "Why" },
];

export function UnownedSubscriptionsTable({ rows }: { rows: SubscriptionOwnership[] }) {
  return <DataTable<SubscriptionOwnership> rows={rows} columns={UNOWNED_COLUMNS} searchKeys={["subscriptionName"]} pageSize={10} rowKey={(r) => r.subscriptionId} />;
}
