// Loads the CSVs in data/ into the Azure SQL Database tables defined by
// infra/sql/schema.sql. Run it once after creating the schema. It can run
// again, since every table is truncated before the insert.
//
// Usage:
//   node --env-file=.env.local scripts/migrate-to-sql.mjs
// or export AZURE_SQL_SERVER, AZURE_SQL_DATABASE, AZURE_SQL_USER and
// AZURE_SQL_PASSWORD in the environment before running.

import { readFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";
import sql from "mssql";

const DATA_DIR = join(process.cwd(), "data");

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseBoolean(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

function loadCsv(fileName) {
  const text = readFileSync(join(DATA_DIR, fileName), "utf8");
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return parsed.data;
}

// name, kind ("s" string | "n" number | "b" boolean), optional varchar length (default MAX)
const RECOMMENDATION_COLUMNS = [
  ["TenantId", "s", 200], ["TenantName", "s"], ["SubscriptionId", "s", 200], ["SubscriptionName", "s"],
  ["ResourceId", "s", 400], ["ResourceName", "s"], ["ResourceType", "s"], ["ResourceGroup", "s"], ["Location", "s"],
  ["ServiceType", "s"], ["PricingCategory", "s"], ["AnalysisType", "s"], ["AnalysisMethod", "s"],
  ["MetricSource", "s"], ["PropertySource", "s"], ["RuleEvaluationMode", "s"], ["RecommendationAction", "s"],
  ["ActionLabel", "s"], ["ActionSummary", "s"], ["ActionCategory", "s"], ["IsActionable", "b"], ["IsDestructive", "b"],
  ["RecommendationPractice", "s"], ["CombinedPractice", "s"], ["RecommendationReason", "s"], ["Priority", "s"],
  ["Confidence", "s"], ["PrimaryRuleType", "s"], ["PrimaryMetric", "s"], ["PrimaryMetricValue", "n"],
  ["PrimaryProperty", "s"], ["PrimaryPropertyValue", "s"], ["PrimaryPropertyRule", "s"], ["MetricPattern", "s"],
  ["MetricDataPoints", "n"], ["MetricExpectedDataPoints", "n"], ["MetricCoverageRatio", "n"],
  ["MetricCoverageStatus", "s"], ["WithheldReason", "s"], ["HeldBackFrom", "s"], ["SavingsStatus", "s"],
  ["EstimatedMonthlyCostIncrease", "n"], ["EstimatedAnnualCostIncrease", "n"], ["RiskAdjustedMonthlySavings", "n"],
  ["RiskAdjustedAnnualSavings", "n"], ["SavingsMethod", "s"], ["TargetSku", "s"], ["TargetSkuStatus", "s"],
  ["SecondaryAction", "s"], ["SecondaryActionLabel", "s"], ["SecondaryMonthlySavings", "n"],
  ["SecondaryAnnualSavings", "n"], ["CurrentSku", "s"], ["CurrentVCpus", "n"], ["CurrentMemoryGB", "n"],
  ["TargetVCpus", "n"], ["TargetMemoryGB", "n"], ["TargetOptions", "s"], ["MetricInterval", "s"], ["PowerState", "s"],
  ["CurrentMonthToDateCost", "n"], ["DailyRunRate", "n"], ["ClosedMonthDailyAverage", "n"], ["CostIncreaseMethod", "s"],
  ["CostCurrency", "s"], ["CostLookbackMonths", "n"], ["PeriodCost", "n"], ["MetricPointCount", "n"],
  ["PropertyCondition", "s"], ["MetricCollectionStatus", "s"], ["ConfiguredMetricCount", "n"],
  ["AvailableMetricCount", "n"], ["MissingMetricCount", "n"], ["MissingMetrics", "s"], ["HasMetricAnalysis", "b"],
  ["HasPropertyAnalysis", "b"], ["MetricAverage", "n"], ["ObservedPeak", "n"], ["MetricStandardDeviation", "n"],
  ["MetricCoefficientOfVariation", "n"], ["TenantsExpected", "n"], ["TenantsSucceeded", "n"], ["TenantsFailed", "n"],
  ["TriggeredRulesCount", "n"], ["PropertyRulesCount", "n"], ["TriggeredRules", "s"], ["TriggeredMetricRules", "s"],
  ["TriggeredPropertyRules", "s"], ["MetricAnalysis", "s"], ["PropertyAnalysis", "s"], ["MetricAnalysisAvailable", "b"],
  ["PropertyAnalysisAvailable", "b"], ["MonthlyCost", "n"], ["AnnualCost", "n"], ["EstimatedMonthlySavings", "n"],
  ["EstimatedAnnualSavings", "n"], ["SavingsMultiplier", "n"], ["ConfidenceWeight", "n"], ["CostSource", "s"],
  ["SavingsCalculationMethod", "s"], ["Tags", "s"], ["TagOwner", "s"], ["TagApplication", "s"], ["TagEnvironment", "s"],
  ["TagCostCenter", "s"], ["MonthsAvailable", "n"], ["CostCoverageStatus", "s"], ["SavingsReliability", "s"],
  ["RunId", "s", 200], ["RunStartedAt", "s", 64], ["EngineVersion", "s"], ["ProcessingStatus", "s"], ["Error", "s"],
  ["rundate", "s", 64],
];

const ENGINE_RUN_COLUMNS = [
  ["RunId", "s", 200], ["RunStatus", "s"], ["DataQualityStatus", "s"], ["IsPublishable", "b"], ["RunScope", "s"],
  ["TenantFilter", "s"], ["SubscriptionFilter", "s"], ["OutputCatalog", "s"], ["OutputDatabase", "s"],
  ["OutputTable", "s"], ["PublishApproved", "b"], ["PublishedAt", "s", 64], ["PublishedBy", "s"],
  ["RunStartedAt", "s", 64], ["RunFinishedAt", "s", 64], ["EngineVersion", "s"], ["RowsProduced", "n"],
  ["RowsPersisted", "n"], ["RowsFailed", "n"], ["TenantsExpected", "n"], ["TenantsSucceeded", "n"],
  ["TenantsFailed", "n"], ["IncrementalWriteFailures", "n"], ["MetricRows", "n"], ["MetricsUnavailableRows", "n"],
  ["MetricsPartialRows", "n"], ["MetricAvailabilityRate", "n"], ["MetricCompletenessRate", "n"], ["CostRows", "n"],
  ["CostFullCoverageRows", "n"], ["CostAvailabilityRate", "n"], ["CostFullCoverageRate", "n"],
  ["PricedSavingsRows", "n"], ["HeuristicSavingsRows", "n"], ["UnpricedSavingsRows", "n"], ["DegradedServices", "s"],
  ["Notes", "s"],
];

const TARGET_OPTION_COLUMNS = [
  ["rundate", "s", 64], ["RunId", "s", 200], ["TenantName", "s"], ["SubscriptionName", "s"], ["ResourceId", "s", 400],
  ["ResourceName", "s"], ["ResourceType", "s"], ["ResourceGroup", "s"], ["Location", "s"], ["RecommendationAction", "s"],
  ["ActionLabel", "s"], ["ActionSummary", "s"], ["SecondaryAction", "s"], ["SecondaryActionLabel", "s"],
  ["Priority", "s"], ["Confidence", "s"], ["SavingsReliability", "s"], ["CostCoverageStatus", "s"],
  ["MetricCollectionStatus", "s"], ["MissingMetrics", "s"], ["TagOwner", "s"], ["TagApplication", "s"],
  ["TagEnvironment", "s"], ["TagCostCenter", "s"], ["MonthlyCost", "n"], ["CurrentSku", "s"], ["CurrentVCpus", "n"],
  ["CurrentMemoryGB", "n"], ["PowerState", "s"], ["Profile", "s"], ["IsPrimaryProfile", "b"],
  ["TargetUtilizationPct", "n"], ["TargetSku", "s"], ["TargetVCpus", "n"], ["TargetMemoryGB", "n"],
  ["ProjectedPeakPct", "n"], ["MonthlySavings", "n"], ["OfficialConservativeSavings", "n"], ["PerformanceRisk", "s"],
  ["Status", "s"],
];

const TARGET_OPTION_HISTORY_COLUMNS = [
  ["rundate", "s", 64], ["RunId", "s", 200], ["RunStatus", "s"], ["RunScope", "s"], ["DataQualityStatus", "s"],
  ["IsPublishable", "b"], ["TenantName", "s"], ["SubscriptionName", "s"], ["ResourceId", "s", 400],
  ["ResourceName", "s"], ["ResourceType", "s"], ["ResourceGroup", "s"], ["Location", "s"], ["RecommendationAction", "s"],
  ["ActionLabel", "s"], ["SecondaryAction", "s"], ["Priority", "s"], ["Confidence", "s"], ["SavingsReliability", "s"],
  ["CostCoverageStatus", "s"], ["MetricCollectionStatus", "s"], ["MissingMetrics", "s"], ["TagOwner", "s"],
  ["MonthlyCost", "n"], ["CurrentSku", "s"], ["CurrentVCpus", "n"], ["CurrentMemoryGB", "n"], ["PowerState", "s"],
  ["Profile", "s"], ["IsPrimaryProfile", "b"], ["TargetUtilizationPct", "n"], ["TargetSku", "s"], ["TargetVCpus", "n"],
  ["TargetMemoryGB", "n"], ["ProjectedPeakPct", "n"], ["MonthlySavings", "n"], ["OfficialConservativeSavings", "n"],
  ["PerformanceRisk", "s"], ["Status", "s"],
];

const DATASETS = [
  { csv: "azure_finops_multiservice_recommendation.csv", table: "dbo.FinOpsRecommendations", columns: RECOMMENDATION_COLUMNS },
  { csv: "vw_finops_latest_complete_run.csv", table: "dbo.FinOpsLatestRun", columns: RECOMMENDATION_COLUMNS },
  { csv: "finops_engine_runs.csv", table: "dbo.FinOpsEngineRuns", columns: ENGINE_RUN_COLUMNS },
  { csv: "vw_finops_target_options.csv", table: "dbo.FinOpsTargetOptions", columns: TARGET_OPTION_COLUMNS },
  { csv: "vw_finops_target_options_all_runs.csv", table: "dbo.FinOpsTargetOptionsAllRuns", columns: TARGET_OPTION_HISTORY_COLUMNS },
];

const BATCH_SIZE = 5000;

function buildTable(tableName, columns) {
  const table = new sql.Table(tableName);
  table.create = false;
  for (const [name, kind, len] of columns) {
    if (kind === "n") table.columns.add(name, sql.Float, { nullable: true });
    else if (kind === "b") table.columns.add(name, sql.Bit, { nullable: true });
    else table.columns.add(name, sql.NVarChar(len ?? sql.MAX), { nullable: true });
  }
  return table;
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
}

function addRow(table, columns, row) {
  const values = columns.map(([name, kind]) => {
    const raw = row[name];
    if (kind === "n") return parseNumber(raw);
    if (kind === "b") return parseBoolean(raw);
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
    requestTimeout: 300000,
    connectionTimeout: 60000,
  };

  console.log(`Connecting to ${config.server}/${config.database}...`);
  const pool = await sql.connect(config);

  try {
    for (const dataset of DATASETS) {
      console.log(`\n${dataset.table} from ${dataset.csv}`);
      const rows = loadCsv(dataset.csv);
      console.log(`  ${rows.length} rows read`);

      await pool.request().query(`TRUNCATE TABLE ${dataset.table}`);

      let inserted = 0;
      for (const batch of chunk(rows, BATCH_SIZE)) {
        const table = buildTable(dataset.table, dataset.columns);
        for (const row of batch) addRow(table, dataset.columns, row);
        await pool.request().bulk(table);
        inserted += batch.length;
        console.log(`  ${inserted}/${rows.length} rows inserted into ${dataset.table}`);
      }
    }
    console.log("\nMigration completed.");
  } finally {
    await pool.close();
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is not set.`);
  return value;
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
