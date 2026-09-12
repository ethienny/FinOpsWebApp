import type { FinOpsFilters } from "@/types/finops";

export function filtersFromSearchParams(sp: Record<string, string | string[] | undefined>): FinOpsFilters {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    tenant: one("tenant") || undefined,
    subscription: one("subscription") || undefined,
    serviceType: one("serviceType") || undefined,
    priority: one("priority") || undefined,
    owner: one("owner") || undefined,
    environment: one("environment") || undefined,
    costCenter: one("costCenter") || undefined,
    search: one("q") || undefined,
  };
}

export function matchesFilters<T extends {
  TenantName?: string;
  SubscriptionName?: string;
  ServiceType?: string;
  ResourceType?: string;
  Priority?: string;
  TagOwner?: string;
  TagEnvironment?: string;
  TagCostCenter?: string;
  ResourceName?: string;
}>(row: T, filters: FinOpsFilters): boolean {
  if (filters.tenant && row.TenantName !== filters.tenant) return false;
  if (filters.subscription && row.SubscriptionName !== filters.subscription) return false;
  if (filters.serviceType && (row.ServiceType || row.ResourceType) !== filters.serviceType) return false;
  if (filters.priority && row.Priority !== filters.priority) return false;
  if (filters.owner && row.TagOwner !== filters.owner) return false;
  if (filters.environment && row.TagEnvironment !== filters.environment) return false;
  if (filters.costCenter && row.TagCostCenter !== filters.costCenter) return false;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    const hay = `${row.ResourceName ?? ""} ${row.SubscriptionName ?? ""} ${row.ServiceType ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
