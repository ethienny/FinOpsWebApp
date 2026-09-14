// Azure Lighthouse onboarding material. The roles the product needs, the ARM
// template a customer deploys to delegate them, and the CLI command to do it.
// Pure functions, unit tested. Every role is read only by construction.

import type { AzureRole, ProviderIdentity } from "@/types/onboarding";

/** Built in Azure roles the engine needs. All read only. */
export const REQUIRED_ROLES: readonly AzureRole[] = [
  {
    name: "Reader",
    definitionId: "acdd72a7-3385-48ef-bd42-f606fba81ae7",
    purpose: "Inventory: resource names, types, sizes, regions and tags.",
  },
  {
    name: "Cost Management Reader",
    definitionId: "72fafb9e-0641-4937-9268-a91bfd8191a3",
    purpose: "Cost per resource and per subscription from Cost Management.",
  },
  {
    name: "Monitoring Reader",
    definitionId: "43d0d8ad-25c7-4714-9b9c-2e73c37a4d9e",
    purpose: "Usage metrics such as CPU, memory and throughput from Azure Monitor.",
  },
];

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isGuid(value: unknown): value is string {
  return typeof value === "string" && GUID.test(value);
}

/**
 * ARM template that registers the provider as a managed service on the
 * customer subscription with the required roles, and nothing else.
 */
export function buildLighthouseTemplate(provider: ProviderIdentity): Record<string, unknown> {
  const authorizations = REQUIRED_ROLES.map((role) => ({
    principalId: provider.principalId,
    principalIdDisplayName: provider.principalDisplayName,
    roleDefinitionId: role.definitionId,
  }));
  return {
    $schema: "https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#",
    contentVersion: "1.0.0.0",
    parameters: {},
    variables: {
      mspRegistrationName: "[guid(subscription().subscriptionId, 'finops-insight-engine')]",
      mspAssignmentName: "[guid(subscription().subscriptionId, 'finops-insight-engine-assignment')]",
    },
    resources: [
      {
        type: "Microsoft.ManagedServices/registrationDefinitions",
        apiVersion: "2022-10-01",
        name: "[variables('mspRegistrationName')]",
        properties: {
          registrationDefinitionName: provider.offerName,
          description: "Read only access for FinOps Insight Engine cost and usage analysis.",
          managedByTenantId: provider.tenantId,
          authorizations,
        },
      },
      {
        type: "Microsoft.ManagedServices/registrationAssignments",
        apiVersion: "2022-10-01",
        name: "[variables('mspAssignmentName')]",
        dependsOn: ["[resourceId('Microsoft.ManagedServices/registrationDefinitions', variables('mspRegistrationName'))]"],
        properties: {
          registrationDefinitionId: "[resourceId('Microsoft.ManagedServices/registrationDefinitions', variables('mspRegistrationName'))]",
        },
      },
    ],
  };
}

/** Azure CLI command the customer runs on their own subscription. */
export function deployCommand(subscriptionId: string, location = "brazilsouth"): string {
  return [
    `az account set --subscription ${subscriptionId}`,
    `az deployment sub create --location ${location} --template-file finops-lighthouse.json`,
  ].join("\n");
}

/** Azure CLI command that removes the delegation from the customer side. */
export function revokeCommand(subscriptionId: string): string {
  return [
    `az account set --subscription ${subscriptionId}`,
    "az managedservices assignment list --query \"[?properties.registrationDefinitionName=='FinOps Insight Engine'].name\" -o tsv",
    "az managedservices assignment delete --assignment <name-from-the-list>",
  ].join("\n");
}
