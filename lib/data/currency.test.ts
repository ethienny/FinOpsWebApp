import { describe, expect, it } from "vitest";
import { billingCurrency, inBillingCurrency } from "./currency";
import { sqlConfig } from "./store";
import { isMissingObject } from "@/lib/anomalies/store";

describe("billingCurrency", () => {
  it("returns the currency and rate of a row billed outside USD", () => {
    expect(billingCurrency({ BillingCurrency: "brl", BillingCurrencyRate: "5.17" })).toEqual({ currency: "BRL", rate: 5.17 });
  });

  it("ignores USD, missing columns and unusable rates", () => {
    expect(billingCurrency({ BillingCurrency: "USD", BillingCurrencyRate: 1 })).toBeNull();
    expect(billingCurrency({})).toBeNull();
    expect(billingCurrency({ BillingCurrency: "BRL", BillingCurrencyRate: null })).toBeNull();
    expect(billingCurrency({ BillingCurrency: "BRL", BillingCurrencyRate: 0 })).toBeNull();
  });
});

describe("inBillingCurrency", () => {
  const mapped = { MonthlyCost: 100, EstimatedMonthlySavings: null, Priority: "HIGH", CostCurrency: "USD" };

  it("converts the money fields and sets the currency", () => {
    const row = { BillingCurrency: "BRL", BillingCurrencyRate: 5 };
    expect(inBillingCurrency(row, mapped, ["MonthlyCost", "EstimatedMonthlySavings"], "CostCurrency")).toEqual({
      MonthlyCost: 500,
      EstimatedMonthlySavings: null,
      Priority: "HIGH",
      CostCurrency: "BRL",
    });
  });

  it("keeps a USD row as it is", () => {
    expect(inBillingCurrency({}, mapped, ["MonthlyCost"], "CostCurrency")).toBe(mapped);
  });
});

describe("sqlConfig", () => {
  const env = { AZURE_SQL_SERVER: "s.database.windows.net", AZURE_SQL_DATABASE: "finops" };

  it("signs in with the managed identity when asked", () => {
    const config = sqlConfig({ ...env, AZURE_SQL_AUTHENTICATION: "managed-identity", AZURE_CLIENT_ID: "id" });
    expect(config.authentication).toEqual({ type: "azure-active-directory-default", options: { clientId: "id" } });
    expect(config.user).toBeUndefined();
  });

  it("keeps the SQL login otherwise and requires its credentials", () => {
    const config = sqlConfig({ ...env, AZURE_SQL_USER: "u", AZURE_SQL_PASSWORD: "p" });
    expect(config.user).toBe("u");
    expect(config.authentication).toBeUndefined();
    expect(() => sqlConfig(env)).toThrow("AZURE_SQL_USER");
  });
});

describe("isMissingObject", () => {
  it("recognizes SQL Server error 208 only", () => {
    expect(isMissingObject({ number: 208 })).toBe(true);
    expect(isMissingObject({ number: 18456 })).toBe(false);
    expect(isMissingObject(new Error("x"))).toBe(false);
  });
});
