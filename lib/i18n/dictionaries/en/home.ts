// Executive Overview page (app/(dashboard)/page.tsx) and its
// ExecutiveResourcesTable.

export const home = {
  latestRun: {
    label: "Latest Published Run",
    engine: "Engine",
    published: "Published",
    sincePreviousRun: "Since previous run: {new} new, {resolved} resolved",
    executiveReport: "Executive report",
    engineHealth: "Engine health",
    noPublishedRun: "No official execution currently published.",
  },
  kpi: {
    monthlyCostAnalyzed: { label: "Monthly Cost Analyzed", hint: "SUM(MonthlyCost) on latest complete run" },
    validatedSavingsPriced: { label: "Validated Savings (PRICED)", hint: "Never combined with heuristic savings" },
    estimatedOpportunityHeuristic: {
      label: "Estimated Opportunity (HEURISTIC)",
      hint: "Directional only, not official priced savings",
    },
    actionableResources: { label: "Actionable Resources", hint: "COUNT where IsActionable = true" },
    realizedSavings: { label: "Realized Savings", hint: "PRICED recommendations marked done", link: "Open tracking" },
    savingsInProgress: { label: "Savings In Progress", hint: "Accepted or in progress", link: "Open tracking" },
    missedSavingsToDate: {
      label: "Missed Savings To Date",
      hintTemplate: "{count} recommendations open for 5 or more runs",
      link: "Open insights",
    },
    quickWinsAvailable: {
      label: "Quick Wins Available",
      hint: "High value, low execution risk, not yet done",
      link: "Open insights",
    },
  },
  charts: {
    costVsSavingsTitle: "Cost vs Savings by Service Type",
    costVsSavingsSubtitle: "Cost from latest run vs PRICED savings",
    savingsByActionTitle: "Savings by Action Category",
  },
  topResources: {
    title: "Top 10 Resources by Validated Savings",
    allOpportunities: "All opportunities",
  },
  table: {
    resource: "Resource",
    service: "Service",
    subscription: "Subscription",
    action: "Action",
    savings: "Savings",
    priority: "Priority",
  },
} as const;
