// Hybrid Benefit page (app/hybrid-benefit/page.tsx): resources still paying
// a Windows Server, SQL Server, RHEL or SQL License meter without Azure
// Hybrid Benefit applied.

export const hybridBenefit = {
  title: "Hybrid Benefit",
  subtitle: "Licenses billed without Azure Hybrid Benefit or Red Hat Cloud Access",
  kpi: {
    licenseCostWithoutBenefit: {
      label: "License Cost Without Benefit",
      hint: "Part of Monthly Cost, already billed",
    },
    licenseSavings: {
      label: "License Savings (Hybrid Benefit)",
      hint: "What turning the benefit on would save",
    },
    resourcesWithoutHybridBenefit: {
      label: "Resources Without Hybrid Benefit",
      hint: "License paid without the benefit",
    },
    resourcesWithHybridBenefit: {
      label: "Resources With Hybrid Benefit",
      hint: "Benefit already applied, license bills zero",
    },
  },
  charts: {
    byProductTitle: "License Savings by License Product",
    bySubscriptionTitle: "License Savings by Subscription (Top 15)",
  },
  table: {
    title: "Resources Without Hybrid Benefit",
    resource: "Resource",
    service: "Service",
    subscription: "Subscription",
    licenseProducts: "License Products",
    licenseCost: "License Cost",
    licenseSavings: "License Savings",
    action: "Action",
  },
} as const;
