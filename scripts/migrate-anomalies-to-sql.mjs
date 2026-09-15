// Applies infra/sql/anomaly-schema.sql and loads the four Cost Anomalies CSVs
// (anomaly_history, weekly_report_coverage, weekly_report_stats and
// subscription_contacts in data/, restored from data/mock by
// scripts/restore-mock-data.mjs or regenerated from the seed) into the Azure
// SQL Database. Mirrors scripts/migrate-to-sql.mjs. It can run again, since
// every table is truncated before the insert.
//
// Usage:
//   node --env-file=.env.local scripts/migrate-anomalies-to-sql.mjs

import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import sql from "mssql";

const DATA_DIR = join(process.cwd(), "data");
const SCHEMA_PATH = join(process.cwd(), "infra", "sql", "anomaly-schema.sql");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is not set.`);
  return value;
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseDate(value) {
  const raw = String(value ?? "").trim();
  return raw ? new Date(`${raw}T00:00:00Z`) : null;
}

function parseDateTime(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  return new Date(/Z$|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`);
}

function loadCsv(fileName) {
  const text = readFileSync(join(DATA_DIR, fileName), "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
  return parsed.data;
}

// name, kind ("s" string | "n" number | "i" int | "d" date | "t" datetime2), optional varchar length (default MAX)
const ANOMALY_HISTORY_COLUMNS = [
  ["partition_key", "s", 100], ["row_key", "s", 300], ["subscription_id", "s", 200], ["subscription_name", "s"],
  ["detection_date", "d"], ["delta_percent", "n"], ["total_cost", "n"], ["notified_at", "t"],
  ["send_status", "s", 50], ["routing_source", "s", 50], ["tag_status", "s", 50], ["contacts_status", "s", 50],
  ["contact_source", "s"], ["recipient_overlap", "i"], ["window_from", "d"], ["window_to", "d"],
  ["window_source", "s", 50], ["observed_change_usd", "n"], ["attribution_status", "s", 50],
  ["resource_id", "s", 400], ["resource_name", "s"], ["service_type", "s"], ["resource_group", "s"],
];

const WEEKLY_REPORT_COVERAGE_COLUMNS = [
  ["partition_key", "s", 100], ["row_key", "s", 100], ["generated_at", "t"], ["covered", "i"], ["missing", "i"],
  ["skipped", "i"], ["failed", "i"], ["total_checked", "i"], ["tfe_workspace", "s"], ["alert_name", "s"],
  ["missing_subs", "s"],
];

const WEEKLY_REPORT_STATS_COLUMNS = [
  ["partition_key", "s", 100], ["row_key", "s", 100], ["generated_at", "t"], ["total_runs", "i"],
  ["succeeded_runs", "i"], ["failed_runs", "i"], ["total_notified", "i"], ["total_suppressed", "i"],
  ["suppression_rate", "n"], ["prev_total_runs", "i"], ["prev_notified", "i"], ["prev_suppressed", "i"],
  ["week_label", "s", 100], ["prev_week_label", "s", 100], ["top_subs", "s"],
  ["top_subs_observed_increase_total", "n"], ["top_subs_not_reconciled", "i"], ["top_subs_beyond_cap", "i"],
  ["routing_tag", "i"], ["routing_missing_tag", "i"], ["routing_invalid_tag", "i"], ["routing_lookup_failed", "i"],
  ["routing_tag_and_contacts", "i"], ["routing_tag_only", "i"], ["routing_contacts_only", "i"],
  ["routing_none", "i"], ["routing_legacy", "i"], ["routing_overlap_alerts", "i"], ["contact_sources", "s"],
  ["fallback_subs_total", "i"], ["fallback_subs", "s"],
];

const SUBSCRIPTION_CONTACTS_COLUMNS = [
  ["partition_key", "s", 200], ["row_key", "s", 100], ["ts", "t"], ["primary_contact", "s"],
  ["application_support_contact", "s"], ["architecture_contact", "s"], ["source_system", "s"],
];

const DATASETS = [
  { csv: "anomaly_history.csv", table: "dbo.anomaly_history", columns: ANOMALY_HISTORY_COLUMNS },
  { csv: "weekly_report_coverage.csv", table: "dbo.weekly_report_coverage", columns: WEEKLY_REPORT_COVERAGE_COLUMNS },
  { csv: "weekly_report_stats.csv", table: "dbo.weekly_report_stats", columns: WEEKLY_REPORT_STATS_COLUMNS },
  { csv: "subscription_contacts.csv", table: "dbo.subscription_contacts", columns: SUBSCRIPTION_CONTACTS_COLUMNS },
];

function buildTable(tableName, columns) {
  const table = new sql.Table(tableName);
  table.create = false;
  for (const [name, kind, len] of columns) {
    if (kind === "n") table.columns.add(name, sql.Float, { nullable: true });
    else if (kind === "i") table.columns.add(name, sql.Int, { nullable: true });
    else if (kind === "d") table.columns.add(name, sql.Date, { nullable: true });
    else if (kind === "t") table.columns.add(name, sql.DateTime2, { nullable: true });
    else table.columns.add(name, sql.NVarChar(len ?? sql.MAX), { nullable: true });
  }
  return table;
}

function addRow(table, columns, row) {
  const values = columns.map(([name, kind]) => {
    const raw = row[name];
    if (kind === "n") return parseNumber(raw);
    if (kind === "i") {
      const n = parseNumber(raw);
      return n === null ? null : Math.trunc(n);
    }
    if (kind === "d") return parseDate(raw);
    if (kind === "t") return parseDateTime(raw);
    const s = raw === null || raw === undefined ? "" : String(raw).trim();
    return s || null;
  });
  table.rows.add(...values);
}

async function main() {
  const config = {
    server: requireEnv("AZURE_SQL_SERVER"),
    database: requireEnv("AZURE_SQL_DATABASE"),
    user: requireEnv("AZURE_SQL_USER"),
    password: requireEnv("AZURE_SQL_PASSWORD"),
    port: Number(process.env.AZURE_SQL_PORT ?? 1433),
    options: { encrypt: true, trustServerCertificate: false },
    requestTimeout: 120000,
    connectionTimeout: 60000,
  };

  console.log(`Connecting to ${config.server}/${config.database}...`);
  const pool = await sql.connect(config);

  try {
    console.log("\nApplying infra/sql/anomaly-schema.sql...");
    await pool.request().batch(readFileSync(SCHEMA_PATH, "utf8"));
    console.log("Cost Anomalies schema ready.");

    for (const dataset of DATASETS) {
      console.log(`\n${dataset.table} from data/${dataset.csv}`);
      const rows = loadCsv(dataset.csv);
      console.log(`  ${rows.length} rows read`);

      await pool.request().query(`TRUNCATE TABLE ${dataset.table}`);

      const table = buildTable(dataset.table, dataset.columns);
      for (const row of rows) addRow(table, dataset.columns, row);
      await pool.request().bulk(table);
      console.log(`  ${rows.length}/${rows.length} rows inserted into ${dataset.table}`);
    }
    console.log("\nMigration completed.");
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
