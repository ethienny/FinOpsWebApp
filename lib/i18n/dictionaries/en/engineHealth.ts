export const engineHealth = {
  kpi: {
    latestRun: "Latest Run",
    engineVersion: "Engine Version",
    runDuration: "Run Duration",
    runStatus: "Run Status",
    metricAvailability: "Metric Availability",
    metricCompleteness: "Metric Completeness",
    costAvailability: "Cost Availability",
    fullCostCoverage: "Full Cost Coverage",
  },
  processingMetrics: {
    heading: "Run processing metrics",
    rowsProduced: "Rows Produced",
    rowsPersisted: "Rows Persisted",
    rowsFailed: "Rows Failed",
    tenantsExpected: "Tenants Expected",
    tenantsSucceeded: "Tenants Succeeded",
    tenantsFailed: "Tenants Failed",
    pricedSavingsRows: "Priced Savings Rows",
    heuristicSavingsRows: "Heuristic Savings Rows",
    unpricedSavingsRows: "Unpriced Savings Rows",
  },
  degradedServices: {
    heading: "Degraded services",
    impact: "Impact: quality degraded · Status: DEGRADED",
    none: "No degraded services reported on the latest run.",
  },
  runHistorySection: {
    heading: "Run history",
  },
  table: {
    started: "Started",
    finished: "Finished",
  },
} as const;
