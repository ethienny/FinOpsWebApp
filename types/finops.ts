// Domain types of the FinOps data: the engine rows as they come from the CSV
// or SQL sources, the projections the pages render, the insight, change and
// decision overlays, and the repository contract.

export type SavingsReliability = "PRICED" | "HEURISTIC" | "UNPRICED" | string;
export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW" | string;
export type SizingProfile = "Conservative" | "Moderate" | "Aggressive";

export interface FinOpsRecommendation {
  TenantId: string;
  TenantName: string;
  SubscriptionId: string;
  SubscriptionName: string;
  ResourceId: string;
  ResourceName: string;
  ResourceType: string;
  ResourceGroup: string;
  Location: string;
  ServiceType: string;
  PricingCategory: string;
  AnalysisType: string;
  AnalysisMethod: string;
  MetricSource: string;
  PropertySource: string;
  RuleEvaluationMode: string;
  RecommendationAction: string;
  ActionLabel: string;
  ActionSummary: string;
  ActionCategory: string;
  IsActionable: boolean;
  IsDestructive: boolean;
  RecommendationPractice: string;
  CombinedPractice: string;
  RecommendationReason: string;
  Priority: string;
  Confidence: string;
  PrimaryRuleType: string;
  PrimaryMetric: string;
  PrimaryMetricValue: number | null;
  PrimaryProperty: string;
  PrimaryPropertyValue: string;
  PrimaryPropertyRule: string;
  MetricPattern: string;
  MetricDataPoints: number | null;
  MetricExpectedDataPoints: number | null;
  MetricCoverageRatio: number | null;
  MetricCoverageStatus: string;
  WithheldReason: string;
  HeldBackFrom: string;
  SavingsStatus: string;
  EstimatedMonthlyCostIncrease: number | null;
  EstimatedAnnualCostIncrease: number | null;
  RiskAdjustedMonthlySavings: number | null;
  RiskAdjustedAnnualSavings: number | null;
  SavingsMethod: string;
  TargetSku: string;
  TargetSkuStatus: string;
  SecondaryAction: string;
  SecondaryActionLabel: string;
  SecondaryMonthlySavings: number | null;
  SecondaryAnnualSavings: number | null;
  CurrentSku: string;
  CurrentVCpus: number | null;
  CurrentMemoryGB: number | null;
  TargetVCpus: number | null;
  TargetMemoryGB: number | null;
  TargetOptions: unknown;
  MetricInterval: string;
  PowerState: string;
  CurrentMonthToDateCost: number | null;
  DailyRunRate: number | null;
  ClosedMonthDailyAverage: number | null;
  CostIncreaseMethod: string;
  CostCurrency: string;
  CostLookbackMonths: number | null;
  PeriodCost: number | null;
  MetricPointCount: number | null;
  PropertyCondition: string;
  MetricCollectionStatus: string;
  ConfiguredMetricCount: number | null;
  AvailableMetricCount: number | null;
  MissingMetricCount: number | null;
  MissingMetrics: string;
  HasMetricAnalysis: boolean;
  HasPropertyAnalysis: boolean;
  MetricAverage: number | null;
  ObservedPeak: number | null;
  MetricStandardDeviation: number | null;
  MetricCoefficientOfVariation: number | null;
  TenantsExpected: number | null;
  TenantsSucceeded: number | null;
  TenantsFailed: number | null;
  TriggeredRulesCount: number | null;
  PropertyRulesCount: number | null;
  TriggeredRules: unknown;
  TriggeredMetricRules: unknown;
  TriggeredPropertyRules: unknown;
  MetricAnalysis: unknown;
  PropertyAnalysis: unknown;
  MetricAnalysisAvailable: boolean;
  PropertyAnalysisAvailable: boolean;
  MonthlyCost: number | null;
  AnnualCost: number | null;
  EstimatedMonthlySavings: number | null;
  EstimatedAnnualSavings: number | null;
  SavingsMultiplier: number | null;
  ConfidenceWeight: number | null;
  CostSource: string;
  SavingsCalculationMethod: string;
  Tags: unknown;
  TagOwner: string;
  TagApplication: string;
  TagEnvironment: string;
  TagCostCenter: string;
  MonthsAvailable: number | null;
  CostCoverageStatus: string;
  SavingsReliability: string;
  RunId: string;
  RunStartedAt: string;
  EngineVersion: string;
  ProcessingStatus: string;
  Error: string;
  rundate: string;
}

export interface FinOpsRun {
  RunId: string;
  RunStatus: string;
  DataQualityStatus: string;
  IsPublishable: boolean;
  RunScope: string;
  TenantFilter: string;
  SubscriptionFilter: string;
  OutputCatalog: string;
  OutputDatabase: string;
  OutputTable: string;
  PublishApproved: boolean;
  PublishedAt: string;
  PublishedBy: string;
  RunStartedAt: string;
  RunFinishedAt: string;
  EngineVersion: string;
  RowsProduced: number | null;
  RowsPersisted: number | null;
  RowsFailed: number | null;
  TenantsExpected: number | null;
  TenantsSucceeded: number | null;
  TenantsFailed: number | null;
  IncrementalWriteFailures: number | null;
  MetricRows: number | null;
  MetricsUnavailableRows: number | null;
  MetricsPartialRows: number | null;
  MetricAvailabilityRate: number | null;
  MetricCompletenessRate: number | null;
  CostRows: number | null;
  CostFullCoverageRows: number | null;
  CostAvailabilityRate: number | null;
  CostFullCoverageRate: number | null;
  PricedSavingsRows: number | null;
  HeuristicSavingsRows: number | null;
  UnpricedSavingsRows: number | null;
  DegradedServices: string;
  Notes: string;
}

export interface TargetOption {
  rundate: string;
  RunId: string;
  TenantName: string;
  SubscriptionName: string;
  ResourceId: string;
  ResourceName: string;
  ResourceType: string;
  ResourceGroup: string;
  Location: string;
  RecommendationAction: string;
  ActionLabel: string;
  ActionSummary: string;
  SecondaryAction: string;
  SecondaryActionLabel: string;
  Priority: string;
  Confidence: string;
  SavingsReliability: string;
  CostCoverageStatus: string;
  MetricCollectionStatus: string;
  MissingMetrics: string;
  TagOwner: string;
  TagApplication: string;
  TagEnvironment: string;
  TagCostCenter: string;
  MonthlyCost: number | null;
  CurrentSku: string;
  CurrentVCpus: number | null;
  CurrentMemoryGB: number | null;
  PowerState: string;
  Profile: SizingProfile | string;
  IsPrimaryProfile: boolean;
  TargetUtilizationPct: number | null;
  TargetSku: string;
  TargetVCpus: number | null;
  TargetMemoryGB: number | null;
  ProjectedPeakPct: number | null;
  MonthlySavings: number | null;
  OfficialConservativeSavings: number | null;
  PerformanceRisk: string;
  Status: string;
}

export interface TargetOptionHistory {
  rundate: string;
  RunId: string;
  RunStatus: string;
  RunScope: string;
  DataQualityStatus: string;
  IsPublishable: boolean;
  TenantName: string;
  SubscriptionName: string;
  ResourceId: string;
  ResourceName: string;
  ResourceType: string;
  ResourceGroup: string;
  Location: string;
  RecommendationAction: string;
  ActionLabel: string;
  SecondaryAction: string;
  Priority: string;
  Confidence: string;
  SavingsReliability: string;
  CostCoverageStatus: string;
  MetricCollectionStatus: string;
  MissingMetrics: string;
  TagOwner: string;
  MonthlyCost: number | null;
  CurrentSku: string;
  CurrentVCpus: number | null;
  CurrentMemoryGB: number | null;
  PowerState: string;
  Profile: SizingProfile | string;
  IsPrimaryProfile: boolean;
  TargetUtilizationPct: number | null;
  TargetSku: string;
  TargetVCpus: number | null;
  TargetMemoryGB: number | null;
  ProjectedPeakPct: number | null;
  MonthlySavings: number | null;
  OfficialConservativeSavings: number | null;
  PerformanceRisk: string;
  Status: string;
}

export interface FinOpsFilters {
  tenant?: string;
  subscription?: string;
  serviceType?: string;
  priority?: string;
  owner?: string;
  environment?: string;
  costCenter?: string;
  search?: string;
}

export interface FilterOptions {
  tenants: string[];
  subscriptions: string[];
  serviceTypes: string[];
  priorities: string[];
  owners: string[];
  environments: string[];
  costCenters: string[];
}

export interface NamedValue {
  name: string;
  value: number;
}

export interface DualNamedValue {
  name: string;
  cost: number;
  savings: number;
}

/**
 * Projection of FinOpsRecommendation carrying only the fields the resource,
 * opportunity and executive tables render. Keeps the payload sent to client
 * tables small instead of shipping every CSV column.
 */
export interface ResourceSummary {
  ResourceId: string;
  ResourceName: string;
  ResourceGroup: string;
  ServiceType: string;
  TenantName: string;
  SubscriptionName: string;
  Location: string;
  MonthlyCost: number | null;
  CostCurrency: string;
  ActionLabel: string;
  ActionSummary: string;
  Priority: string;
  Confidence: string;
  SavingsReliability: string;
  EstimatedMonthlySavings: number | null;
  RiskAdjustedMonthlySavings: number | null;
  MetricCollectionStatus: string;
  MetricCoverageRatio: number | null;
  RecommendationAction: string;
  IsActionable: boolean;
  IsDestructive: boolean;
  PerformanceRisk: string;
  TagOwner: string;
  TagEnvironment: string;
}

export interface ExecutiveData {
  currency: string;
  publishedRun: FinOpsRun | null;
  monthlyCost: number;
  validatedSavings: number;
  estimatedOpportunity: number;
  actionableResources: number;
  costByService: NamedValue[];
  savingsByService: NamedValue[];
  savingsByOwner: NamedValue[];
  savingsByAction: NamedValue[];
  reliabilityDistribution: NamedValue[];
  priorityDistribution: NamedValue[];
  costVsSavingsByService: DualNamedValue[];
  topResources: ResourceSummary[];
}

export interface ShowbackRow {
  owner: string;
  costCenter: string;
  application: string;
  environment: string;
  monthlyCost: number;
  resourceCount: number;
  percentage: number;
}

export interface ShowbackData {
  currency: string;
  totalCost: number;
  allocatedCost: number;
  unallocatedCost: number;
  totalResources: number;
  costByOwner: NamedValue[];
  costByCostCenter: NamedValue[];
  costByEnvironment: NamedValue[];
  costByApplication: NamedValue[];
  costBySubscription: NamedValue[];
  costByTenant: NamedValue[];
  savingsByOwner: NamedValue[];
  rows: ShowbackRow[];
}

export interface OpportunitiesData {
  currency: string;
  totalOpportunities: number;
  validatedSavings: number;
  estimatedOpportunity: number;
  averageSavingsPerActionable: number;
  reliabilityDistribution: NamedValue[];
  priorityDistribution: NamedValue[];
  rows: ResourceSummary[];
}

export interface SizingRow extends TargetOption {
  ServiceType: string;
}

export interface SizingData {
  currency: string;
  profile: SizingProfile;
  selectedProfileSavings: number;
  officialConservativeSavings: number;
  resourcesWithSizing: number;
  averagePerformanceRisk: string;
  averagePerformanceRiskScore: number;
  savingsByService: NamedValue[];
  riskDistribution: NamedValue[];
  profileDistribution: NamedValue[];
  currentVsTargetVcpu: { name: string; current: number; target: number }[];
  currentVsTargetMemory: { name: string; current: number; target: number }[];
  rows: SizingRow[];
}

export interface ResourcesData {
  currency: string;
  totalResources: number;
  resourcesWithRecommendations: number;
  monthlyCost: number;
  serviceTypesAnalyzed: number;
  rows: ResourceSummary[];
}

export interface ResourceDetailData {
  recommendation: FinOpsRecommendation;
  sizing: TargetOption[];
  history: TargetOptionHistory[];
}

export interface EngineHealthData {
  latestRun: FinOpsRun | null;
  publishedRun: FinOpsRun | null;
  runs: FinOpsRun[];
}

export interface RunSavingsPoint {
  runId: string;
  startedAt: string;
  monthlyCost: number;
  validatedSavings: number;
  estimatedOpportunity: number;
}

export interface RunHistoryData {
  runs: FinOpsRun[];
  savingsEvolution: RunSavingsPoint[];
  comparison: { a: FinOpsRun | null; b: FinOpsRun | null } | null;
}

export interface SidebarMeta {
  engineVersion: string;
  latestPublishedRunId: string;
  publicationStatus: string;
  dataQualityStatus: string;
}

export interface ShowbackAllocation {
  owner: string;
  costCenter: string;
  application: string;
  environment: string;
  monthlyCost: number;
  resourceCount: number;
}

// ───────────────────────────────────────────────
// Insights: recommendation aging and quick wins
// ───────────────────────────────────────────────

export type AgeBucket = "new" | "recurring" | "persistent";

/** How long the current recommendation of a resource has been open across engine runs. */
export interface RecommendationAging {
  resourceId: string;
  recommendationAction: string;
  firstDetectedRunId: string;
  firstDetectedAt: string;
  runsOpen: number;
  daysOpen: number;
  missedSavings: number;
  ageBucket: AgeBucket;
}

export type ExecutionRisk = "low" | "medium" | "high";

/** Aging and quick win fields overlaid on a resource summary. */
export interface InsightFields {
  runsOpen: number;
  daysOpen: number;
  missedSavings: number;
  ageBucket: AgeBucket;
  ageLabel: string;
  firstDetectedRunId: string;
  firstDetectedAt: string;
  valueRank: number;
  quickWinScore: number;
  executionRisk: ExecutionRisk;
  executionRiskScore: number;
  riskLabel: string;
  isQuickWin: boolean;
}

export type InsightRow = ResourceSummary & InsightFields;

export interface AgingSummary {
  missedSavings: number;
  persistentCount: number;
  newCount: number;
  averageRunsOpen: number;
  actionableCount: number;
}

// ───────────────────────────────────────────────
// Insights: what changed since the previous run
// ───────────────────────────────────────────────

export type ChangeKind = "new" | "resolved" | "action_changed" | "reliability_changed" | "savings_changed";

/** How the recommendation of one resource differs between two complete runs. */
export interface ResourceChange {
  resourceId: string;
  kind: ChangeKind;
  previousAction: string;
  currentAction: string;
  previousReliability: string;
  currentReliability: string;
  /** PRICED estimate on each run, zero when the estimate was not PRICED. */
  previousSavings: number;
  currentSavings: number;
  savingsDelta: number;
}

/** Change fields overlaid on a resource summary. */
export interface ChangeFields {
  changeKind: ChangeKind;
  changeLabel: string;
  previousAction: string;
  previousActionLabel: string;
  previousReliability: string;
  previousSavings: number;
  savingsDelta: number;
}

export type ChangeRow = ResourceSummary & ChangeFields;

/** Scope totals of one run, used to compare two runs side by side. */
export interface RunTotals {
  validatedSavings: number;
  actionableCount: number;
  monthlyCost: number;
}

export interface RunDeltaData {
  currency: string;
  currentRun: FinOpsRun | null;
  previousRun: FinOpsRun | null;
  current: RunTotals;
  previous: RunTotals;
  rows: ChangeRow[];
}

export interface ChangeSummary {
  newCount: number;
  newSavings: number;
  resolvedCount: number;
  resolvedSavings: number;
  actionChangedCount: number;
  reliabilityChangedCount: number;
  savingsChangedCount: number;
  savingsChangedDelta: number;
}

// ───────────────────────────────────────────────
// Recommendation decisions
// ───────────────────────────────────────────────

export type DecisionStatus = "open" | "accepted" | "in_progress" | "done" | "dismissed";

/** What the team decided about the recommendation of one resource. */
export interface RecommendationDecision {
  resourceId: string;
  runId: string;
  status: DecisionStatus;
  owner: string;
  note: string;
  updatedAt: string;
  updatedBy: string;
}

/** Decision fields overlaid on a row. */
export interface DecisionFields {
  decisionStatus: DecisionStatus;
  decisionLabel: string;
  decisionOwner: string;
  decisionRunId: string;
  decisionUpdatedAt: string;
}

/** Opportunity table row: the resource summary with insights and its decision overlaid. */
export type OpportunityRow = InsightRow & DecisionFields;

/** Savings tracked through decisions. PRICED savings only. */
export interface DecisionSavings {
  inProgress: number;
  realized: number;
  decided: number;
}

export interface DecisionRepository {
  list(): Promise<RecommendationDecision[]>;
  get(resourceId: string): Promise<RecommendationDecision | null>;
  save(decision: RecommendationDecision): Promise<void>;
}

export interface FinOpsRepository {
  getFilterOptions(): Promise<FilterOptions>;
  getSidebarMeta(): Promise<SidebarMeta>;
  getExecutiveData(filters: FinOpsFilters): Promise<ExecutiveData>;
  getShowback(filters: FinOpsFilters): Promise<ShowbackData>;
  getOpportunities(filters: FinOpsFilters): Promise<OpportunitiesData>;
  getSizing(filters: FinOpsFilters, profile?: SizingProfile): Promise<SizingData>;
  getResources(filters: FinOpsFilters): Promise<ResourcesData>;
  getResourceById(resourceId: string): Promise<ResourceDetailData | null>;
  getEngineHealth(): Promise<EngineHealthData>;
  getRunHistory(runA?: string, runB?: string): Promise<RunHistoryData>;
  getRecommendationAging(): Promise<RecommendationAging[]>;
  getRunDelta(filters: FinOpsFilters): Promise<RunDeltaData>;
}
