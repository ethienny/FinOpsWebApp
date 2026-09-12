import Papa from "papaparse";
import { readFileSync } from "fs";
import { join } from "path";
import type { FinOpsRecommendation, FinOpsRun, TargetOption, TargetOptionHistory } from "@/types/finops";
import { asString, parseBoolean, parseJson, parseNumber } from "./parse";

const DATA_DIR = join(process.cwd(), "data");

function loadCsv(fileName: string): Record<string, string>[] {
  const text = readFileSync(join(DATA_DIR, fileName), "utf8");
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length) {
    const fatal = parsed.errors.filter((e) => e.type === "Quotes" || e.type === "FieldMismatch");
    if (fatal.length > 8) {
      console.warn(`CSV parse warnings for ${fileName}:`, fatal.slice(0, 5));
    }
  }
  return parsed.data;
}

function recommendation(row: Record<string, string>): FinOpsRecommendation {
  return {
    TenantId: asString(row.TenantId),
    TenantName: asString(row.TenantName),
    SubscriptionId: asString(row.SubscriptionId),
    SubscriptionName: asString(row.SubscriptionName),
    ResourceId: asString(row.ResourceId),
    ResourceName: asString(row.ResourceName),
    ResourceType: asString(row.ResourceType),
    ResourceGroup: asString(row.ResourceGroup),
    Location: asString(row.Location),
    ServiceType: asString(row.ServiceType),
    PricingCategory: asString(row.PricingCategory),
    AnalysisType: asString(row.AnalysisType),
    AnalysisMethod: asString(row.AnalysisMethod),
    MetricSource: asString(row.MetricSource),
    PropertySource: asString(row.PropertySource),
    RuleEvaluationMode: asString(row.RuleEvaluationMode),
    RecommendationAction: asString(row.RecommendationAction),
    ActionLabel: asString(row.ActionLabel),
    ActionSummary: asString(row.ActionSummary),
    ActionCategory: asString(row.ActionCategory),
    IsActionable: parseBoolean(row.IsActionable),
    IsDestructive: parseBoolean(row.IsDestructive),
    RecommendationPractice: asString(row.RecommendationPractice),
    CombinedPractice: asString(row.CombinedPractice),
    RecommendationReason: asString(row.RecommendationReason),
    Priority: asString(row.Priority),
    Confidence: asString(row.Confidence),
    PrimaryRuleType: asString(row.PrimaryRuleType),
    PrimaryMetric: asString(row.PrimaryMetric),
    PrimaryMetricValue: parseNumber(row.PrimaryMetricValue),
    PrimaryProperty: asString(row.PrimaryProperty),
    PrimaryPropertyValue: asString(row.PrimaryPropertyValue),
    PrimaryPropertyRule: asString(row.PrimaryPropertyRule),
    MetricPattern: asString(row.MetricPattern),
    MetricDataPoints: parseNumber(row.MetricDataPoints),
    MetricExpectedDataPoints: parseNumber(row.MetricExpectedDataPoints),
    MetricCoverageRatio: parseNumber(row.MetricCoverageRatio),
    MetricCoverageStatus: asString(row.MetricCoverageStatus),
    WithheldReason: asString(row.WithheldReason),
    HeldBackFrom: asString(row.HeldBackFrom),
    SavingsStatus: asString(row.SavingsStatus),
    EstimatedMonthlyCostIncrease: parseNumber(row.EstimatedMonthlyCostIncrease),
    EstimatedAnnualCostIncrease: parseNumber(row.EstimatedAnnualCostIncrease),
    RiskAdjustedMonthlySavings: parseNumber(row.RiskAdjustedMonthlySavings),
    RiskAdjustedAnnualSavings: parseNumber(row.RiskAdjustedAnnualSavings),
    SavingsMethod: asString(row.SavingsMethod),
    TargetSku: asString(row.TargetSku),
    TargetSkuStatus: asString(row.TargetSkuStatus),
    SecondaryAction: asString(row.SecondaryAction),
    SecondaryActionLabel: asString(row.SecondaryActionLabel),
    SecondaryMonthlySavings: parseNumber(row.SecondaryMonthlySavings),
    SecondaryAnnualSavings: parseNumber(row.SecondaryAnnualSavings),
    CurrentSku: asString(row.CurrentSku),
    CurrentVCpus: parseNumber(row.CurrentVCpus),
    CurrentMemoryGB: parseNumber(row.CurrentMemoryGB),
    TargetVCpus: parseNumber(row.TargetVCpus),
    TargetMemoryGB: parseNumber(row.TargetMemoryGB),
    TargetOptions: parseJson(row.TargetOptions),
    MetricInterval: asString(row.MetricInterval),
    PowerState: asString(row.PowerState),
    CurrentMonthToDateCost: parseNumber(row.CurrentMonthToDateCost),
    DailyRunRate: parseNumber(row.DailyRunRate),
    ClosedMonthDailyAverage: parseNumber(row.ClosedMonthDailyAverage),
    CostIncreaseMethod: asString(row.CostIncreaseMethod),
    CostCurrency: asString(row.CostCurrency) || "USD",
    CostLookbackMonths: parseNumber(row.CostLookbackMonths),
    PeriodCost: parseNumber(row.PeriodCost),
    MetricPointCount: parseNumber(row.MetricPointCount),
    PropertyCondition: asString(row.PropertyCondition),
    MetricCollectionStatus: asString(row.MetricCollectionStatus),
    ConfiguredMetricCount: parseNumber(row.ConfiguredMetricCount),
    AvailableMetricCount: parseNumber(row.AvailableMetricCount),
    MissingMetricCount: parseNumber(row.MissingMetricCount),
    MissingMetrics: asString(row.MissingMetrics),
    HasMetricAnalysis: parseBoolean(row.HasMetricAnalysis),
    HasPropertyAnalysis: parseBoolean(row.HasPropertyAnalysis),
    MetricAverage: parseNumber(row.MetricAverage),
    ObservedPeak: parseNumber(row.ObservedPeak),
    MetricStandardDeviation: parseNumber(row.MetricStandardDeviation),
    MetricCoefficientOfVariation: parseNumber(row.MetricCoefficientOfVariation),
    TenantsExpected: parseNumber(row.TenantsExpected),
    TenantsSucceeded: parseNumber(row.TenantsSucceeded),
    TenantsFailed: parseNumber(row.TenantsFailed),
    TriggeredRulesCount: parseNumber(row.TriggeredRulesCount),
    PropertyRulesCount: parseNumber(row.PropertyRulesCount),
    TriggeredRules: parseJson(row.TriggeredRules),
    TriggeredMetricRules: parseJson(row.TriggeredMetricRules),
    TriggeredPropertyRules: parseJson(row.TriggeredPropertyRules),
    MetricAnalysis: parseJson(row.MetricAnalysis),
    PropertyAnalysis: parseJson(row.PropertyAnalysis),
    MetricAnalysisAvailable: parseBoolean(row.MetricAnalysisAvailable),
    PropertyAnalysisAvailable: parseBoolean(row.PropertyAnalysisAvailable),
    MonthlyCost: parseNumber(row.MonthlyCost),
    AnnualCost: parseNumber(row.AnnualCost),
    EstimatedMonthlySavings: parseNumber(row.EstimatedMonthlySavings),
    EstimatedAnnualSavings: parseNumber(row.EstimatedAnnualSavings),
    SavingsMultiplier: parseNumber(row.SavingsMultiplier),
    ConfidenceWeight: parseNumber(row.ConfidenceWeight),
    CostSource: asString(row.CostSource),
    SavingsCalculationMethod: asString(row.SavingsCalculationMethod),
    Tags: parseJson(row.Tags),
    TagOwner: asString(row.TagOwner),
    TagApplication: asString(row.TagApplication),
    TagEnvironment: asString(row.TagEnvironment),
    TagCostCenter: asString(row.TagCostCenter),
    MonthsAvailable: parseNumber(row.MonthsAvailable),
    CostCoverageStatus: asString(row.CostCoverageStatus),
    SavingsReliability: asString(row.SavingsReliability),
    RunId: asString(row.RunId),
    RunStartedAt: asString(row.RunStartedAt),
    EngineVersion: asString(row.EngineVersion),
    ProcessingStatus: asString(row.ProcessingStatus),
    Error: asString(row.Error),
    rundate: asString(row.rundate),
  };
}

function run(row: Record<string, string>): FinOpsRun {
  return {
    RunId: asString(row.RunId),
    RunStatus: asString(row.RunStatus),
    DataQualityStatus: asString(row.DataQualityStatus),
    IsPublishable: parseBoolean(row.IsPublishable),
    RunScope: asString(row.RunScope),
    TenantFilter: asString(row.TenantFilter),
    SubscriptionFilter: asString(row.SubscriptionFilter),
    OutputCatalog: asString(row.OutputCatalog),
    OutputDatabase: asString(row.OutputDatabase),
    OutputTable: asString(row.OutputTable),
    PublishApproved: parseBoolean(row.PublishApproved),
    PublishedAt: asString(row.PublishedAt),
    PublishedBy: asString(row.PublishedBy),
    RunStartedAt: asString(row.RunStartedAt),
    RunFinishedAt: asString(row.RunFinishedAt),
    EngineVersion: asString(row.EngineVersion),
    RowsProduced: parseNumber(row.RowsProduced),
    RowsPersisted: parseNumber(row.RowsPersisted),
    RowsFailed: parseNumber(row.RowsFailed),
    TenantsExpected: parseNumber(row.TenantsExpected),
    TenantsSucceeded: parseNumber(row.TenantsSucceeded),
    TenantsFailed: parseNumber(row.TenantsFailed),
    IncrementalWriteFailures: parseNumber(row.IncrementalWriteFailures),
    MetricRows: parseNumber(row.MetricRows),
    MetricsUnavailableRows: parseNumber(row.MetricsUnavailableRows),
    MetricsPartialRows: parseNumber(row.MetricsPartialRows),
    MetricAvailabilityRate: parseNumber(row.MetricAvailabilityRate),
    MetricCompletenessRate: parseNumber(row.MetricCompletenessRate),
    CostRows: parseNumber(row.CostRows),
    CostFullCoverageRows: parseNumber(row.CostFullCoverageRows),
    CostAvailabilityRate: parseNumber(row.CostAvailabilityRate),
    CostFullCoverageRate: parseNumber(row.CostFullCoverageRate),
    PricedSavingsRows: parseNumber(row.PricedSavingsRows),
    HeuristicSavingsRows: parseNumber(row.HeuristicSavingsRows),
    UnpricedSavingsRows: parseNumber(row.UnpricedSavingsRows),
    DegradedServices: asString(row.DegradedServices),
    Notes: asString(row.Notes),
  };
}

function targetOption(row: Record<string, string>): TargetOption {
  return {
    rundate: asString(row.rundate),
    RunId: asString(row.RunId),
    TenantName: asString(row.TenantName),
    SubscriptionName: asString(row.SubscriptionName),
    ResourceId: asString(row.ResourceId),
    ResourceName: asString(row.ResourceName),
    ResourceType: asString(row.ResourceType),
    ResourceGroup: asString(row.ResourceGroup),
    Location: asString(row.Location),
    RecommendationAction: asString(row.RecommendationAction),
    ActionLabel: asString(row.ActionLabel),
    ActionSummary: asString(row.ActionSummary),
    SecondaryAction: asString(row.SecondaryAction),
    SecondaryActionLabel: asString(row.SecondaryActionLabel),
    Priority: asString(row.Priority),
    Confidence: asString(row.Confidence),
    SavingsReliability: asString(row.SavingsReliability),
    CostCoverageStatus: asString(row.CostCoverageStatus),
    MetricCollectionStatus: asString(row.MetricCollectionStatus),
    MissingMetrics: asString(row.MissingMetrics),
    TagOwner: asString(row.TagOwner),
    TagApplication: asString(row.TagApplication),
    TagEnvironment: asString(row.TagEnvironment),
    TagCostCenter: asString(row.TagCostCenter),
    MonthlyCost: parseNumber(row.MonthlyCost),
    CurrentSku: asString(row.CurrentSku),
    CurrentVCpus: parseNumber(row.CurrentVCpus),
    CurrentMemoryGB: parseNumber(row.CurrentMemoryGB),
    PowerState: asString(row.PowerState),
    Profile: asString(row.Profile),
    IsPrimaryProfile: parseBoolean(row.IsPrimaryProfile),
    TargetUtilizationPct: parseNumber(row.TargetUtilizationPct),
    TargetSku: asString(row.TargetSku),
    TargetVCpus: parseNumber(row.TargetVCpus),
    TargetMemoryGB: parseNumber(row.TargetMemoryGB),
    ProjectedPeakPct: parseNumber(row.ProjectedPeakPct),
    MonthlySavings: parseNumber(row.MonthlySavings),
    OfficialConservativeSavings: parseNumber(row.OfficialConservativeSavings),
    PerformanceRisk: asString(row.PerformanceRisk),
    Status: asString(row.Status),
  };
}

function targetHistory(row: Record<string, string>): TargetOptionHistory {
  return {
    ...targetOption(row),
    RunStatus: asString(row.RunStatus),
    RunScope: asString(row.RunScope),
    DataQualityStatus: asString(row.DataQualityStatus),
    IsPublishable: parseBoolean(row.IsPublishable),
  };
}

export interface DataStore {
  latest: FinOpsRecommendation[];
  allRecommendations: FinOpsRecommendation[];
  runs: FinOpsRun[];
  targetOptions: TargetOption[];
  targetOptionsAllRuns: TargetOptionHistory[];
}

declare global {
  var __finopsStore: DataStore | undefined;
}

export function getDataStore(): DataStore {
  if (globalThis.__finopsStore) return globalThis.__finopsStore;
  const store: DataStore = {
    latest: loadCsv("vw_finops_latest_complete_run.csv").map(recommendation),
    allRecommendations: loadCsv("azure_finops_multiservice_recommendation.csv").map(recommendation),
    runs: loadCsv("finops_engine_runs.csv").map(run),
    targetOptions: loadCsv("vw_finops_target_options.csv").map(targetOption),
    targetOptionsAllRuns: loadCsv("vw_finops_target_options_all_runs.csv").map(targetHistory),
  };
  globalThis.__finopsStore = store;
  return store;
}
