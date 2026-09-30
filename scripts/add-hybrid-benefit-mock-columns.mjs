// Adds the 16 columns introduced in FinOps engine 6.5.14-6.7.0 (idle/allocation,
// license, commitment, redundancy - see the Databricks Azure Savings
// Opportunities PBIP update) to the recommendation-shaped mock CSVs, with
// plausible values derived from each row's existing fields. Deterministic
// (seeded per ResourceId), so re-running produces the same values.
//
// Usage: node scripts/add-hybrid-benefit-mock-columns.mjs

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import Papa from "papaparse";

const DATA_DIR = join(process.cwd(), "data");
const FILES = [
  "azure_finops_multiservice_recommendation.csv",
  "vw_finops_latest_complete_run.csv",
];

const NEW_COLUMNS = [
  "FlatZeroMetrics",
  "IdleMonthlyCost",
  "CostIsAllocated",
  "ManagedBy",
  "ManagedByDetail",
  "LicenseMonthlyCost",
  "LicenseProducts",
  "LicenseBenefitStatus",
  "LicenseMonthlySavings",
  "CommitmentCoverage",
  "SavingsRealization",
  "CommitmentEligibleMonthlyCost",
  "CommitmentMonthlySavings",
  "CommitmentMonthlySavings3Y",
  "CommitmentOffer",
  "RedundancyMonthlySavings",
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Actions that already change or remove the resource - excluded from
// commitment eligibility (a commitment should not be sized against a
// resource that is about to be resized, paused or removed).
const NON_ACTIONED = new Set(["Evaluate-Idle", "Downsize", "Optimize-Tier"]);
const NON_PROD_KEYWORDS = ["dev", "test", "qa", "uat", "sandbox", "staging", "poc", "lab", "demo"];

function computeNewColumns(row) {
  const seedKey = row.ResourceId || row.ResourceName || String(Math.random());
  const rnd = mulberry32(hashStr(seedKey));
  const serviceType = (row.ServiceType || "").toLowerCase();
  const action = row.RecommendationAction || "";
  const monthlyCost = Number(row.MonthlyCost) || 0;

  // This mock dataset uses friendly ServiceType labels and a simplified
  // RecommendationAction vocabulary (No-Action, Review-Utilization,
  // Evaluate-Idle, Optimize-Tier, Downsize, Optimize-Configuration,
  // Review-Retention) rather than the engine 6.7.7 ARM types / Verb-Dimension
  // codes from the manual - matched against what is actually present.
  const isVm = serviceType === "virtual machines" || serviceType === "sql server on azure vm";
  const isVmss = serviceType === "virtual machine scale sets";
  const isSqlMiDb = serviceType === "sql managed instance database";
  const isSqlMi = serviceType === "sql managed instance";
  const isSqlDb = serviceType === "azure sql database";
  const isPostgres = serviceType === "postgresql flexible server" || serviceType === "mysql database" || serviceType === "mariadb database";
  const isAppServicePlan = serviceType === "app service plan";
  const isLogAnalytics = serviceType === "log analytics" || serviceType === "log analytics workspace";
  const isRecoveryVault = serviceType === "recovery services vault";
  const isIdleReview = action === "Evaluate-Idle";

  const out = {};

  // Idle ceiling / cost allocation
  out.FlatZeroMetrics = "";
  out.CostIsAllocated = isSqlMiDb ? "true" : "false";
  out.IdleMonthlyCost = isIdleReview && monthlyCost > 0 ? monthlyCost.toFixed(2) : "";

  // AKS-managed scale sets
  const isAks = isVmss && rnd() < 0.3;
  out.ManagedBy = isAks ? "AKS" : "";
  out.ManagedByDetail = isAks
    ? `AKS node pool 'user0${1 + Math.floor(rnd() * 3)}' of cluster 'aks-${["prod", "shared", "data"][Math.floor(rnd() * 3)]}'`
    : "";

  // Licenses (Hybrid Benefit)
  const licenseProducts = [];
  if ((isVm || isVmss) && rnd() < 0.55) licenseProducts.push("Windows Server");
  if (isSqlMi || isSqlMiDb) licenseProducts.push("SQL License");
  if (isVm && rnd() < 0.15) licenseProducts.push("RHEL");
  if ((isVm || isVmss) && rnd() < 0.2) licenseProducts.push("SQL Server");

  if (licenseProducts.length > 0 && !isIdleReview) {
    const applied = rnd() < 0.35;
    const shareOfCost = 0.12 + rnd() * 0.18;
    const licenseCost = monthlyCost * shareOfCost;
    out.LicenseProducts = licenseProducts.join(", ");
    out.LicenseBenefitStatus = applied ? "APPLIED" : "NOT_APPLIED";
    out.LicenseMonthlyCost = licenseCost.toFixed(2);
    out.LicenseMonthlySavings = applied ? "0" : licenseCost.toFixed(2);
  } else {
    out.LicenseProducts = "";
    out.LicenseBenefitStatus = "";
    out.LicenseMonthlyCost = "";
    out.LicenseMonthlySavings = "";
  }

  // Commitment coverage / savings realization
  const hasComputeHours = isVm || isVmss || isSqlMi || isSqlMiDb || isSqlDb || isPostgres || isAppServicePlan;
  if (hasComputeHours && monthlyCost > 0) {
    const coverage = rnd();
    out.CommitmentCoverage = coverage.toFixed(2);
    out.SavingsRealization = coverage >= 0.99 ? "COMMITMENT" : coverage <= 0.05 ? "CASH" : "MIXED";
  } else {
    out.CommitmentCoverage = "";
    out.SavingsRealization = "";
  }

  // Commitments on steady PaaS usage / Log Analytics tiers
  const eligiblePaaS = isAppServicePlan || isSqlMi || isSqlDb || isPostgres;
  if (eligiblePaaS && !NON_ACTIONED.has(action) && monthlyCost > 0 && rnd() < 0.6) {
    const savings1y = monthlyCost * (0.15 + rnd() * 0.1);
    out.CommitmentEligibleMonthlyCost = monthlyCost.toFixed(2);
    out.CommitmentMonthlySavings = savings1y.toFixed(2);
    out.CommitmentMonthlySavings3Y = isSqlDb ? "" : (savings1y * (1.4 + rnd() * 0.3)).toFixed(2);
    out.CommitmentOffer = "SAVINGS_PLAN";
  } else if (isLogAnalytics && monthlyCost > 100 && rnd() < 0.4) {
    out.CommitmentEligibleMonthlyCost = "";
    out.CommitmentMonthlySavings = (monthlyCost * (0.1 + rnd() * 0.15)).toFixed(2);
    out.CommitmentMonthlySavings3Y = "";
    out.CommitmentOffer = "LOG_COMMITMENT_TIER";
  } else {
    out.CommitmentEligibleMonthlyCost = "";
    out.CommitmentMonthlySavings = "";
    out.CommitmentMonthlySavings3Y = "";
    out.CommitmentOffer = "";
  }

  // Backup redundancy (non-production Recovery Services vaults)
  if (isRecoveryVault) {
    const env = (row.TagEnvironment || "").toLowerCase();
    const subName = (row.SubscriptionName || "").toLowerCase();
    const isNonProd = NON_PROD_KEYWORDS.some((k) => env.includes(k) || subName.includes(k));
    out.RedundancyMonthlySavings =
      isNonProd && monthlyCost > 0 && !isIdleReview && rnd() < 0.7 ? (monthlyCost * 0.5).toFixed(2) : "0";
  } else {
    out.RedundancyMonthlySavings = "";
  }

  return out;
}

function processFile(fileName) {
  const path = join(DATA_DIR, fileName);
  const text = readFileSync(path, "utf8");
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    console.error(`Parse errors in ${fileName}:`, parsed.errors.slice(0, 3));
  }

  const already = NEW_COLUMNS.every((c) => parsed.meta.fields.includes(c));
  if (already) {
    console.log(`${fileName}: new columns already present, recomputing values.`);
  }

  const fields = [...parsed.meta.fields.filter((f) => !NEW_COLUMNS.includes(f)), ...NEW_COLUMNS];

  const rows = parsed.data.map((row) => ({ ...row, ...computeNewColumns(row) }));

  const csv = Papa.unparse({ fields, data: rows }, { newline: "\n" });
  writeFileSync(path, "﻿" + csv, "utf8");
  console.log(`${fileName}: ${rows.length} rows written with ${fields.length} columns.`);
}

for (const file of FILES) processFile(file);
