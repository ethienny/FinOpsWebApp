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
    idleCostCeiling: { label: "Idle Cost (Ceiling)", hint: "Whole cost of idle resources under review" },
    probableSavingsFloor: { label: "Probable Savings (Floor)", hint: "Saving if the owner keeps the resource at a smaller size" },
    licenseSavings: { label: "License Savings (Hybrid Benefit)", hint: "What turning on Hybrid Benefit would save", link: "Open Hybrid Benefit" },
    commitmentSavings1Year: { label: "Commitment Savings, 1 Year", hint: "Official figure - never add to the 3 year alternative" },
    commitmentSavings3Years: { label: "Commitment Savings, 3 Years", hint: "Alternative to the 1 year figure, never both" },
    redundancySavings: { label: "Redundancy Savings (Backup)", hint: "Non-production vaults moved from geo to local redundancy" },
  },
  keepThemApart:
    "Keep them apart. Ceiling and floor are two readings of the same idle resources. Neither is added to Validated Savings or Estimated Opportunity, and they are not added to each other. License Savings, Commitment Savings and Redundancy Savings are separate levers, each shown on its own card. Commitment Savings 1 year and 3 years are two alternatives for the same compute: show one or the other, never their sum. Cash now and commitment freed are two parts of Validated Savings and add up to it.",
  charts: {
    costVsSavingsTitle: "Cost vs Savings by Service Type",
    costVsSavingsSubtitle: "Cost from latest run vs PRICED savings",
    savingsByActionTitle: "Savings by Action Category",
    cashVsCommitmentTitle: "Validated Savings, Cash vs Commitment",
    cashVsCommitmentSubtitle: "PRICED savings by service, split by how the money arrives",
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
