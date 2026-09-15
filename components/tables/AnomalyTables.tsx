"use client";

// Client tables of the cost anomaly dashboard: alerts of the week, routing
// per alert, top subscriptions and subscriptions without an owner.

import { formatDate, formatMoney, formatNumber } from "@/lib/formatters";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { OutcomeBadge } from "@/components/badges";
import { ResourceLink } from "@/components/resource/ResourceLink";
import { routingLabel } from "@/lib/anomalies/metrics";
import type { AnomalyAlert, SubscriptionOwnership, TopSubscription } from "@/types/anomalies";
import { useDictionary } from "@/lib/i18n/LocaleProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

function pct(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

const ALERT_SEARCH: Array<keyof AnomalyAlert> = ["subscriptionName", "resourceName", "serviceType", "attributionStatus", "routingSource"];

function resourceCell(r: AnomalyAlert) {
  if (!r.resourceName) return <span className="text-slate-500">—</span>;
  return (
    <div className="space-y-0.5">
      {r.resourceId ? <ResourceLink resourceId={r.resourceId} name={r.resourceName} /> : <span className="text-slate-200">{r.resourceName}</span>}
      {r.resourceGroup ? <p className="text-[11px] text-slate-500">{r.resourceGroup}</p> : null}
    </div>
  );
}

function alertColumns(dict: Dictionary): Column<AnomalyAlert>[] {
  const t = dict.anomalies.table;
  return [
    { key: "subscriptionName", header: t.subscription, filterable: true },
    { key: "resourceName", header: t.resource, render: resourceCell },
    { key: "serviceType", header: t.service, filterable: true, render: (r) => r.serviceType || "—" },
    { key: "detectionDate", header: t.detected, render: (r) => r.detectionDate },
    { key: "deltaPercent", header: t.delta, numeric: true, sortValue: (r) => r.deltaPercent, render: (r) => pct(r.deltaPercent) },
    { key: "totalCost", header: t.totalCost, numeric: true, sortValue: (r) => r.totalCost, render: (r) => formatMoney(r.totalCost, "USD", false) },
    {
      key: "observedChangeUsd",
      header: t.observedIncrease,
      numeric: true,
      sortValue: (r) => r.observedChangeUsd,
      render: (r) => (r.attributionStatus === "not_reconciled" ? "—" : formatMoney(r.observedChangeUsd, "USD", false)),
    },
    { key: "attributionStatus", header: t.attribution, filterable: true, render: (r) => <OutcomeBadge value={r.attributionStatus} /> },
  ];
}

export function AnomalyAlertsTable({ rows }: { rows: AnomalyAlert[] }) {
  const dict = useDictionary();
  return <DataTable<AnomalyAlert> rows={rows} columns={alertColumns(dict)} searchKeys={ALERT_SEARCH} pageSize={12} rowKey={(r) => r.rowKey} />;
}

function routingColumns(dict: Dictionary): Column<AnomalyAlert>[] {
  const t = dict.anomalies.table;
  return [
    { key: "subscriptionName", header: t.subscription, filterable: true },
    { key: "resourceName", header: t.resource, render: (r) => r.resourceName || "—" },
    { key: "notifiedAt", header: t.notified, render: (r) => formatDate(r.notifiedAt) },
    { key: "routingSource", header: t.routingSource, filterable: true, render: (r) => routingLabel(r.routingSource, dict.anomalies.routingLabels) },
    { key: "tagStatus", header: t.tag, render: (r) => <OutcomeBadge value={r.tagStatus} /> },
    { key: "contactsStatus", header: t.contacts, render: (r) => <OutcomeBadge value={r.contactsStatus} /> },
    { key: "contactSource", header: t.contactSource, render: (r) => r.contactSource || "—" },
    { key: "recipientOverlap", header: t.overlap, numeric: true, sortValue: (r) => r.recipientOverlap, render: (r) => formatNumber(r.recipientOverlap, false) },
  ];
}

export function AlertRoutingTable({ rows }: { rows: AnomalyAlert[] }) {
  const dict = useDictionary();
  return <DataTable<AnomalyAlert> rows={rows} columns={routingColumns(dict)} searchKeys={ALERT_SEARCH} pageSize={12} rowKey={(r) => r.rowKey} />;
}

export type TopSubscriptionRow = TopSubscription & { owned: boolean | null };

function topColumns(dict: Dictionary): Column<TopSubscriptionRow>[] {
  const t = dict.anomalies.table;
  return [
    { key: "name", header: t.subscription },
    { key: "alertCount", header: t.alerts, numeric: true, sortValue: (r) => r.alertCount },
    {
      key: "observedIncreaseUsd",
      header: t.observedIncrease,
      numeric: true,
      sortValue: (r) => r.observedIncreaseUsd,
      render: (r) => formatMoney(r.observedIncreaseUsd, "USD", false),
    },
    { key: "notReconciled", header: t.notReconciled, numeric: true, sortValue: (r) => r.notReconciled },
    { key: "owned", header: t.owner, render: (r) => (r.owned === null ? "—" : <OutcomeBadge value={r.owned ? "owned" : "unowned"} />) },
  ];
}

export function TopSubscriptionsTable({ rows }: { rows: TopSubscriptionRow[] }) {
  const dict = useDictionary();
  return <DataTable<TopSubscriptionRow> rows={rows} columns={topColumns(dict)} searchKeys={["name"]} pageSize={10} rowKey={(r) => r.name} />;
}

function unownedColumns(dict: Dictionary): Column<SubscriptionOwnership>[] {
  const t = dict.anomalies.table;
  return [
    { key: "subscriptionName", header: t.subscription },
    { key: "subscriptionId", header: t.subscriptionId, render: (r) => <span className="font-mono text-xs text-slate-400">{r.subscriptionId}</span> },
    { key: "alertCount", header: t.alerts, numeric: true, sortValue: (r) => r.alertCount },
    { key: "routingSource", header: t.routingSource, render: (r) => routingLabel(r.routingSource, dict.anomalies.routingLabels) },
    { key: "tagStatus", header: t.tag, render: (r) => <OutcomeBadge value={r.tagStatus} /> },
    { key: "contactRow", header: t.contactRow, render: (r) => <OutcomeBadge value={r.contactRow} /> },
    { key: "reason", header: t.why },
  ];
}

export function UnownedSubscriptionsTable({ rows }: { rows: SubscriptionOwnership[] }) {
  const dict = useDictionary();
  return <DataTable<SubscriptionOwnership> rows={rows} columns={unownedColumns(dict)} searchKeys={["subscriptionName"]} pageSize={10} rowKey={(r) => r.subscriptionId} />;
}
