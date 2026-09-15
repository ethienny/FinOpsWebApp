// Shared by FilterBar (global FinOps scope) and AnomalyFilterBar (anomalies
// alert scope), both rendered in the AppShell header.

export const filters = {
  fields: {
    tenant: "Tenant",
    subscription: "Subscription",
    serviceType: "Service Type",
    priority: "Priority",
    owner: "Owner",
    environment: "Environment",
    costCenter: "Cost Center",
    service: "Service",
    routingSource: "Routing Source",
    attribution: "Attribution",
  },
  allOption: "All",
  clearFilters: "Clear Filters",
  noGlobalFilters: "No global filters applied",
  wholeReportedWeek: "Whole reported week",
} as const;
