export const insights = {
  costOfInaction: {
    heading: "Cost of Inaction",
    description:
      "How long the current recommendations have been open across complete engine runs, and the PRICED savings already missed while they waited.",
  },
  kpi: {
    missedSavingsToDate: "Missed Savings To Date",
    missedSavingsHint: "PRICED savings accrued since first detection",
    persistentRecommendations: "Persistent Recommendations",
    persistentRecommendationsHint: "Same recommendation for 5 or more runs",
    averageAge: "Average Age",
    runsUnit: "runs",
    averageAgeHint: "Across {count} actionable recommendations",
    newThisRun: "New This Run",
    newThisRunHint: "Recommendations first detected on the latest run",
  },
  quickWins: {
    heading: "Quick Wins",
    description:
      "PRICED actions ranked by value and execution safety: confidence, performance risk, metric coverage and whether the action is destructive.",
    valueVsRisk: { title: "Value vs Execution Risk", subtitle: "Quick wins sit top left" },
    validatedSavingsByAge: {
      title: "Validated Savings by Age",
      subtitle: "PRICED savings of open recommendations, oldest deserve attention first",
    },
    top10Heading: "Top 10 Quick Wins",
  },
  table: {
    resource: "Resource",
    service: "Service",
    action: "Action",
    savings: "Savings",
    score: "Score",
    risk: "Risk",
    age: "Age",
  },
} as const;
