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
  MetricCollectionStatus: string;
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
  rows: ShowbackRow[];
}

export interface OpportunitiesData {
  currency: string;
  totalOpportunities: number;
  validatedSavings: number;
  estimatedOpportunity: number;
  averageSavingsPerActionable: number;
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

/** Opportunity table row: the resource summary with its decision overlaid. */
export interface OpportunityRow extends ResourceSummary {
  decisionStatus: DecisionStatus;
  decisionLabel: string;
  decisionOwner: string;
  decisionRunId: string;
  decisionUpdatedAt: string;
}

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
}
