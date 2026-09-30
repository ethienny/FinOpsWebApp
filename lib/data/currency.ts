// Billing currency of the engine rows. The engine computes every amount in
// USD; the Azure edition also writes the billing currency of the customer's
// cost export and its units per US dollar (BillingCurrency,
// BillingCurrencyRate) on every row. A customer billed in BRL reads the
// amounts in BRL, so the rows are converted here, once, and the pages keep
// formatting with CostCurrency as before. Rows without the columns (engine
// on Databricks, CSV mock) stay in USD.

import { asString, parseNumber } from "./parse";

export const RECOMMENDATION_MONEY_FIELDS = [
  "MonthlyCost",
  "AnnualCost",
  "PeriodCost",
  "CurrentMonthToDateCost",
  "DailyRunRate",
  "ClosedMonthDailyAverage",
  "IdleMonthlyCost",
  "EstimatedMonthlySavings",
  "EstimatedAnnualSavings",
  "RiskAdjustedMonthlySavings",
  "RiskAdjustedAnnualSavings",
  "SecondaryMonthlySavings",
  "SecondaryAnnualSavings",
  "EstimatedMonthlyCostIncrease",
  "EstimatedAnnualCostIncrease",
  "LicenseMonthlyCost",
  "LicenseMonthlySavings",
  "CommitmentEligibleMonthlyCost",
  "CommitmentMonthlySavings",
  "CommitmentMonthlySavings3Y",
  "RedundancyMonthlySavings",
] as const;

export const TARGET_OPTION_MONEY_FIELDS = ["MonthlyCost", "MonthlySavings", "OfficialConservativeSavings"] as const;

export interface BillingCurrency {
  currency: string;
  rate: number;
}

/** The row's billing currency when it is not USD and has a usable rate. */
export function billingCurrency(row: Record<string, unknown>): BillingCurrency | null {
  const currency = asString(row.BillingCurrency).toUpperCase();
  const rate = parseNumber(row.BillingCurrencyRate);
  if (!currency || currency === "USD" || rate === null || rate <= 0) return null;
  return { currency, rate };
}

/** Converts the given USD amounts of a mapped row to its billing currency. */
export function inBillingCurrency<T extends object>(
  row: Record<string, unknown>,
  mapped: T,
  fields: readonly string[],
  currencyField?: keyof T,
): T {
  const billing = billingCurrency(row);
  if (!billing) return mapped;
  const converted = { ...mapped } as Record<string, unknown>;
  for (const field of fields) {
    const value = converted[field];
    if (typeof value === "number") converted[field] = value * billing.rate;
  }
  if (currencyField) converted[currencyField as string] = billing.currency;
  return converted as T;
}
