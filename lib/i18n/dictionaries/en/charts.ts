// Series names, axis/legend labels and tooltip copy shared by every chart in
// components/charts/Charts.tsx. Numeric/currency values themselves are
// formatted by lib/formatters and are not localized here.

export const charts = {
  cost: "Cost",
  validatedSavings: "Validated savings",
  estimatedOpportunity: "Estimated opportunity",
  monthlyCost: "Monthly cost",
  savings: "Savings",
  executionRisk: "Execution risk",
  otherPriced: "Other PRICED",
  quickWins: "Quick wins",
  quickWin: "Quick win",
  notified: "Notified",
  suppressed: "Suppressed",
  observedIncrease: "Observed increase",
  riskAdjustedSavings: "Risk adjusted savings",
  weekOf: "Week of",
  current: "current",
  target: "target",
} as const;
