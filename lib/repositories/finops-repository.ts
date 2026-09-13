import type {
  EngineHealthData,
  ExecutiveData,
  FilterOptions,
  FinOpsFilters,
  FinOpsRecommendation,
  FinOpsRepository,
  FinOpsRun,
  OpportunitiesData,
  RecommendationAging,
  ResourceDetailData,
  ResourcesData,
  ResourceSummary,
  RunHistoryData,
  ShowbackData,
  ShowbackRow,
  SidebarMeta,
  TargetOption,
  SizingData,
  SizingProfile,
  SizingRow,
} from "@/types/finops";
import { getDataStore } from "@/lib/data/store";
import { groupSum, hasAllocationTag, sum, uniqueSorted } from "@/lib/data/parse";
import { matchesFilters } from "@/lib/aggregations/filters";
import { friendlyService } from "@/lib/formatters";
import { buildAgingIndex } from "@/lib/insights/aging";

function latestPublished(runs: FinOpsRun[]): FinOpsRun | null {
  const published = runs.filter((r) => r.PublishApproved && r.IsPublishable && asOk(r));
  published.sort((a, b) => (b.PublishedAt || b.RunFinishedAt).localeCompare(a.PublishedAt || a.RunFinishedAt));
  return published[0] ?? null;
}

function asOk(run: FinOpsRun): boolean {
  return run.RunStatus === "SUCCEEDED" || run.RunStatus === "DEGRADED";
}

function currency(rows: FinOpsRecommendation[]): string {
  return rows.find((r) => r.CostCurrency)?.CostCurrency || "USD";
}

function serviceName(row: { ServiceType?: string; ResourceType?: string }): string {
  return row.ServiceType || friendlyService(row.ResourceType || "Unknown");
}

function toSummary(row: FinOpsRecommendation, performanceRisk = ""): ResourceSummary {
  return {
    ResourceId: row.ResourceId,
    ResourceName: row.ResourceName,
    ResourceGroup: row.ResourceGroup,
    ServiceType: row.ServiceType,
    TenantName: row.TenantName,
    SubscriptionName: row.SubscriptionName,
    Location: row.Location,
    MonthlyCost: row.MonthlyCost,
    CostCurrency: row.CostCurrency,
    ActionLabel: row.ActionLabel,
    ActionSummary: row.ActionSummary,
    Priority: row.Priority,
    Confidence: row.Confidence,
    SavingsReliability: row.SavingsReliability,
    EstimatedMonthlySavings: row.EstimatedMonthlySavings,
    RiskAdjustedMonthlySavings: row.RiskAdjustedMonthlySavings,
    MetricCollectionStatus: row.MetricCollectionStatus,
    MetricCoverageRatio: row.MetricCoverageRatio,
    RecommendationAction: row.RecommendationAction,
    IsActionable: row.IsActionable,
    IsDestructive: row.IsDestructive,
    PerformanceRisk: performanceRisk,
    TagOwner: row.TagOwner,
    TagEnvironment: row.TagEnvironment,
  };
}

/** Performance risk of the conservative sizing option per resource. */
function performanceRiskByResource(targetOptions: TargetOption[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const option of targetOptions) {
    if (option.Profile === "Conservative" && option.PerformanceRisk) map.set(option.ResourceId, option.PerformanceRisk);
  }
  return map;
}

function riskScore(risk: string): number {
  const v = risk.toLowerCase();
  if (v === "high") return 3;
  if (v === "medium") return 2;
  if (v === "low") return 1;
  return 0;
}

function riskLabel(score: number): string {
  if (score >= 2.5) return "High";
  if (score >= 1.5) return "Medium";
  if (score > 0) return "Low";
  return "—";
}

export class CsvFinOpsRepository implements FinOpsRepository {
  async getFilterOptions(): Promise<FilterOptions> {
    const { latest } = await getDataStore();
    return {
      tenants: uniqueSorted(latest.map((r) => r.TenantName)),
      subscriptions: uniqueSorted(latest.map((r) => r.SubscriptionName)),
      serviceTypes: uniqueSorted(latest.map((r) => r.ServiceType)),
      priorities: uniqueSorted(latest.map((r) => r.Priority)),
      owners: uniqueSorted(latest.map((r) => r.TagOwner)),
      environments: uniqueSorted(latest.map((r) => r.TagEnvironment)),
      costCenters: uniqueSorted(latest.map((r) => r.TagCostCenter)),
    };
  }

  async getSidebarMeta(): Promise<SidebarMeta> {
    const { runs } = await getDataStore();
    const pub = latestPublished(runs);
    const latest = [...runs].sort((a, b) => b.RunStartedAt.localeCompare(a.RunStartedAt))[0];
    return {
      engineVersion: pub?.EngineVersion || latest?.EngineVersion || "—",
      latestPublishedRunId: pub?.RunId || "None",
      publicationStatus: pub ? "Published" : "No official execution currently published",
      dataQualityStatus: pub?.DataQualityStatus || latest?.DataQualityStatus || "Unknown",
    };
  }

  async getExecutiveData(filters: FinOpsFilters): Promise<ExecutiveData> {
    const { latest, runs } = await getDataStore();
    const rows = latest.filter((r) => matchesFilters(r, filters));
    const priced = rows.filter((r) => r.SavingsReliability === "PRICED");
    const heuristic = rows.filter((r) => r.SavingsReliability === "HEURISTIC");
    const topResources = [...priced]
      .sort((a, b) => (b.EstimatedMonthlySavings ?? 0) - (a.EstimatedMonthlySavings ?? 0))
      .slice(0, 10)
      .map((r) => toSummary(r));

    const costByService = groupSum(rows, (r) => serviceName(r), (r) => r.MonthlyCost, 8);
    const savingsByService = groupSum(priced, (r) => serviceName(r), (r) => r.EstimatedMonthlySavings, 8);
    const serviceKeys = uniqueSorted([...costByService, ...savingsByService].map((x) => x.name));
    const costMap = new Map(costByService.map((x) => [x.name, x.value]));
    const savMap = new Map(savingsByService.map((x) => [x.name, x.value]));

    return {
      currency: currency(rows.length ? rows : latest),
      publishedRun: latestPublished(runs),
      monthlyCost: sum(rows.map((r) => r.MonthlyCost)),
      validatedSavings: sum(priced.map((r) => r.EstimatedMonthlySavings)),
      estimatedOpportunity: sum(heuristic.map((r) => r.EstimatedMonthlySavings)),
      actionableResources: rows.filter((r) => r.IsActionable).length,
      costByService,
      savingsByService,
      savingsByOwner: groupSum(priced, (r) => r.TagOwner || "Unassigned", (r) => r.EstimatedMonthlySavings, 8),
      savingsByAction: groupSum(rows, (r) => r.ActionCategory || r.ActionLabel || "Other", (r) => r.EstimatedMonthlySavings, 8),
      reliabilityDistribution: groupSum(rows, (r) => r.SavingsReliability || "UNKNOWN", () => 1),
      priorityDistribution: groupSum(rows, (r) => r.Priority || "UNKNOWN", () => 1),
      costVsSavingsByService: serviceKeys.map((name) => ({
        name,
        cost: costMap.get(name) ?? 0,
        savings: savMap.get(name) ?? 0,
      })),
      topResources,
    };
  }

  async getShowback(filters: FinOpsFilters): Promise<ShowbackData> {
    const { latest } = await getDataStore();
    const rows = latest.filter((r) => matchesFilters(r, filters));
    const allocated = rows.filter((r) => hasAllocationTag(r.TagOwner, r.TagCostCenter));
    const unallocated = rows.filter((r) => !hasAllocationTag(r.TagOwner, r.TagCostCenter));
    const totalCost = sum(rows.map((r) => r.MonthlyCost));

    const groups = new Map<string, ShowbackRow>();
    for (const r of rows) {
      const key = [r.TagOwner || "Unassigned", r.TagCostCenter || "—", r.TagApplication || "—", r.TagEnvironment || "—"].join("|");
      const current = groups.get(key) ?? {
        owner: r.TagOwner || "Unassigned",
        costCenter: r.TagCostCenter || "—",
        application: r.TagApplication || "—",
        environment: r.TagEnvironment || "—",
        monthlyCost: 0,
        resourceCount: 0,
        percentage: 0,
      };
      current.monthlyCost += r.MonthlyCost ?? 0;
      current.resourceCount += 1;
      groups.set(key, current);
    }
    const table = [...groups.values()]
      .map((row) => ({ ...row, percentage: totalCost ? row.monthlyCost / totalCost : 0 }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost);

    return {
      currency: currency(rows.length ? rows : latest),
      totalCost,
      allocatedCost: sum(allocated.map((r) => r.MonthlyCost)),
      unallocatedCost: sum(unallocated.map((r) => r.MonthlyCost)),
      totalResources: rows.length,
      costByOwner: groupSum(rows, (r) => r.TagOwner || "Unassigned", (r) => r.MonthlyCost, 10),
      costByCostCenter: groupSum(rows, (r) => r.TagCostCenter || "Unassigned", (r) => r.MonthlyCost, 10),
      costByEnvironment: groupSum(rows, (r) => r.TagEnvironment || "Unassigned", (r) => r.MonthlyCost),
      costByApplication: groupSum(rows, (r) => r.TagApplication || "Unassigned", (r) => r.MonthlyCost, 10),
      costBySubscription: groupSum(rows, (r) => r.SubscriptionName || "Unassigned", (r) => r.MonthlyCost, 10),
      costByTenant: groupSum(rows, (r) => r.TenantName || "Unassigned", (r) => r.MonthlyCost),
      savingsByOwner: groupSum(
        rows.filter((r) => r.SavingsReliability === "PRICED"),
        (r) => r.TagOwner || "Unassigned",
        (r) => r.EstimatedMonthlySavings,
        10,
      ),
      rows: table,
    };
  }

  async getOpportunities(filters: FinOpsFilters): Promise<OpportunitiesData> {
    const { latest, targetOptions } = await getDataStore();
    const risk = performanceRiskByResource(targetOptions);
    const rows = latest.filter((r) => matchesFilters(r, filters));
    const priced = rows.filter((r) => r.SavingsReliability === "PRICED");
    const heuristic = rows.filter((r) => r.SavingsReliability === "HEURISTIC");
    const actionable = rows.filter((r) => r.IsActionable);
    const actionableSavings = sum(actionable.map((r) => r.EstimatedMonthlySavings));
    return {
      currency: currency(rows.length ? rows : latest),
      totalOpportunities: rows.filter((r) => r.IsActionable || (r.EstimatedMonthlySavings ?? 0) > 0).length,
      validatedSavings: sum(priced.map((r) => r.EstimatedMonthlySavings)),
      estimatedOpportunity: sum(heuristic.map((r) => r.EstimatedMonthlySavings)),
      averageSavingsPerActionable: actionable.length ? actionableSavings / actionable.length : 0,
      reliabilityDistribution: groupSum(rows, (r) => r.SavingsReliability || "UNKNOWN", () => 1),
      priorityDistribution: groupSum(rows, (r) => r.Priority || "UNKNOWN", () => 1),
      rows: rows.map((r) => toSummary(r, risk.get(r.ResourceId) ?? "")),
    };
  }

  async getSizing(filters: FinOpsFilters, profile: SizingProfile = "Conservative"): Promise<SizingData> {
    const { targetOptions, latest } = await getDataStore();
    const serviceById = new Map(latest.map((r) => [r.ResourceId, r.ServiceType]));
    const scoped = targetOptions.filter((r) =>
      matchesFilters({ ...r, ServiceType: serviceById.get(r.ResourceId) }, filters),
    );
    const profileRows: SizingRow[] = scoped
      .filter((r) => r.Profile === profile)
      .map((r) => ({ ...r, ServiceType: serviceById.get(r.ResourceId) || friendlyService(r.ResourceType) }));

    const uniqueResources = new Map<string, (typeof scoped)[number]>();
    for (const row of scoped) {
      if (row.Profile === "Conservative" && !uniqueResources.has(row.ResourceId)) {
        uniqueResources.set(row.ResourceId, row);
      }
    }
    if (uniqueResources.size === 0) {
      for (const row of scoped) {
        if (!uniqueResources.has(row.ResourceId)) uniqueResources.set(row.ResourceId, row);
      }
    }

    const scores = profileRows.map((r) => riskScore(r.PerformanceRisk)).filter((n) => n > 0);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const vcpu = groupSum(profileRows, (r) => r.ServiceType, (r) => r.CurrentVCpus, 8);
    const vcpuT = new Map(groupSum(profileRows, (r) => r.ServiceType, (r) => r.TargetVCpus).map((x) => [x.name, x.value]));
    const mem = groupSum(profileRows, (r) => r.ServiceType, (r) => r.CurrentMemoryGB, 8);
    const memT = new Map(groupSum(profileRows, (r) => r.ServiceType, (r) => r.TargetMemoryGB).map((x) => [x.name, x.value]));

    return {
      currency: currency(latest),
      profile,
      selectedProfileSavings: sum(profileRows.map((r) => r.MonthlySavings)),
      officialConservativeSavings: sum([...uniqueResources.values()].map((r) => r.OfficialConservativeSavings)),
      resourcesWithSizing: uniqueResources.size,
      averagePerformanceRisk: riskLabel(avg),
      averagePerformanceRiskScore: avg,
      savingsByService: groupSum(profileRows, (r) => r.ServiceType, (r) => r.MonthlySavings, 8),
      riskDistribution: groupSum(profileRows, (r) => r.PerformanceRisk || "Unknown", () => 1),
      profileDistribution: groupSum(scoped, (r) => String(r.Profile), () => 1),
      currentVsTargetVcpu: vcpu.map((x) => ({ name: x.name, current: x.value, target: vcpuT.get(x.name) ?? 0 })),
      currentVsTargetMemory: mem.map((x) => ({ name: x.name, current: x.value, target: memT.get(x.name) ?? 0 })),
      rows: profileRows.sort((a, b) => (b.MonthlySavings ?? 0) - (a.MonthlySavings ?? 0)),
    };
  }

  async getResources(filters: FinOpsFilters): Promise<ResourcesData> {
    const { latest } = await getDataStore();
    const rows = latest.filter((r) => matchesFilters(r, filters));
    return {
      currency: currency(rows.length ? rows : latest),
      totalResources: rows.length,
      resourcesWithRecommendations: rows.filter((r) => Boolean(r.ActionLabel) && r.IsActionable).length,
      monthlyCost: sum(rows.map((r) => r.MonthlyCost)),
      serviceTypesAnalyzed: uniqueSorted(rows.map((r) => r.ServiceType)).length,
      rows: rows.map((r) => toSummary(r)),
    };
  }

  async getResourceById(resourceId: string): Promise<ResourceDetailData | null> {
    const { latest, targetOptions, targetOptionsAllRuns } = await getDataStore();
    const recommendation = latest.find((r) => r.ResourceId === resourceId);
    if (!recommendation) return null;
    return {
      recommendation,
      sizing: targetOptions.filter((r) => r.ResourceId === resourceId),
      history: targetOptionsAllRuns.filter((r) => r.ResourceId === resourceId),
    };
  }

  async getEngineHealth(): Promise<EngineHealthData> {
    const { runs } = await getDataStore();
    const sorted = [...runs].sort((a, b) => b.RunStartedAt.localeCompare(a.RunStartedAt));
    return {
      latestRun: sorted[0] ?? null,
      publishedRun: latestPublished(runs),
      runs: sorted,
    };
  }

  async getRunHistory(runA?: string, runB?: string): Promise<RunHistoryData> {
    const { runs, allRecommendations } = await getDataStore();
    const sorted = [...runs].sort((a, b) => a.RunStartedAt.localeCompare(b.RunStartedAt));
    const byRun = new Map<string, FinOpsRecommendation[]>();
    for (const row of allRecommendations) {
      const list = byRun.get(row.RunId) ?? [];
      list.push(row);
      byRun.set(row.RunId, list);
    }
    const savingsEvolution = sorted.map((run) => {
      const recs = byRun.get(run.RunId) ?? [];
      return {
        runId: run.RunId,
        startedAt: run.RunStartedAt,
        monthlyCost: sum(recs.map((r) => r.MonthlyCost)),
        validatedSavings: sum(recs.filter((r) => r.SavingsReliability === "PRICED").map((r) => r.EstimatedMonthlySavings)),
        estimatedOpportunity: sum(
          recs.filter((r) => r.SavingsReliability === "HEURISTIC").map((r) => r.EstimatedMonthlySavings),
        ),
      };
    });
    const a = runA ? runs.find((r) => r.RunId === runA) ?? null : null;
    const b = runB ? runs.find((r) => r.RunId === runB) ?? null : null;
    return {
      runs: [...runs].sort((x, y) => y.RunStartedAt.localeCompare(x.RunStartedAt)),
      savingsEvolution,
      comparison: a || b ? { a, b } : null,
    };
  }

  /** Aging of the current recommendation of every resource, computed once per process. */
  async getRecommendationAging(): Promise<RecommendationAging[]> {
    if (agingCache) return agingCache;
    const { latest, allRecommendations, runs } = await getDataStore();
    agingCache = buildAgingIndex(allRecommendations, runs, latest[0]?.RunId ?? "");
    return agingCache;
  }
}

let agingCache: RecommendationAging[] | null = null;

/**
 * Future Databricks provider.
 *
 * DatabricksFinOpsRepository will implement the same FinOpsRepository contract
 * using SQL warehouses / Unity Catalog views:
 *   vw_finops_latest_complete_run
 *   finops_engine_runs
 *   vw_finops_target_options
 *   vw_finops_target_options_all_runs
 *
 * Credentials must stay server-side (env / secret store). Never expose tokens
 * to client components.
 */
export class DatabricksFinOpsRepository implements FinOpsRepository {
  async getFilterOptions(): Promise<FilterOptions> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getSidebarMeta(): Promise<SidebarMeta> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getExecutiveData(): Promise<ExecutiveData> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getShowback(): Promise<ShowbackData> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getOpportunities(): Promise<OpportunitiesData> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getSizing(): Promise<SizingData> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getResources(): Promise<ResourcesData> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getResourceById(): Promise<ResourceDetailData | null> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getEngineHealth(): Promise<EngineHealthData> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getRunHistory(): Promise<RunHistoryData> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
  async getRecommendationAging(): Promise<RecommendationAging[]> {
    throw new Error("DatabricksFinOpsRepository is not implemented.");
  }
}

let singleton: FinOpsRepository | null = null;

export function getRepository(): FinOpsRepository {
  if (!singleton) singleton = new CsvFinOpsRepository();
  return singleton;
}
