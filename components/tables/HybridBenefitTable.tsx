"use client";

// Client table for the Hybrid Benefit page: resources whose Windows Server,
// SQL Server, RHEL or SQL License meter is billed without the benefit applied.

import { DataTable, type Column } from "@/components/tables/DataTable";
import { ResourceLink } from "@/components/resource/ResourceLink";
import type { HybridBenefitRow } from "@/types/finops";
import { useDictionary, useFormatters } from "@/lib/i18n/LocaleProvider";
import type { Formatters } from "@/lib/formatters";
import type { Dictionary } from "@/lib/i18n/dictionary";

const SEARCH_KEYS: Array<keyof HybridBenefitRow> = ["ResourceName", "SubscriptionName", "LicenseProducts"];

function columns(dict: Dictionary, fmt: Formatters, currency: string): Column<HybridBenefitRow>[] {
  const { formatMoney } = fmt;
  return [
    {
      key: "ResourceName",
      header: dict.hybridBenefit.table.resource,
      render: (r) => <ResourceLink resourceId={r.ResourceId} name={r.ResourceName} />,
    },
    { key: "ServiceType", header: dict.hybridBenefit.table.service },
    { key: "SubscriptionName", header: dict.hybridBenefit.table.subscription },
    { key: "LicenseProducts", header: dict.hybridBenefit.table.licenseProducts },
    {
      key: "LicenseMonthlyCost",
      header: dict.hybridBenefit.table.licenseCost,
      numeric: true,
      sortValue: (r) => r.LicenseMonthlyCost ?? 0,
      render: (r) => formatMoney(r.LicenseMonthlyCost, currency),
    },
    {
      key: "LicenseMonthlySavings",
      header: dict.hybridBenefit.table.licenseSavings,
      numeric: true,
      sortValue: (r) => r.LicenseMonthlySavings ?? 0,
      render: (r) => formatMoney(r.LicenseMonthlySavings, currency),
    },
    { key: "ActionLabel", header: dict.hybridBenefit.table.action },
  ];
}

export function HybridBenefitTable({ rows, currency }: { rows: HybridBenefitRow[]; currency: string }) {
  const dict = useDictionary();
  const fmt = useFormatters();
  return (
    <DataTable<HybridBenefitRow>
      rows={rows}
      searchKeys={SEARCH_KEYS}
      rowKey={(r) => r.ResourceId}
      columns={columns(dict, fmt, currency)}
    />
  );
}
