// Onboarding of a customer Azure subscription: what the product asks for and
// the connection state kept by the emulation.

export interface AzureRole {
  name: string;
  /** Built in role definition id, stable across every Azure tenant. */
  definitionId: string;
  purpose: string;
}

export interface ProviderIdentity {
  tenantId: string;
  principalId: string;
  principalDisplayName: string;
  offerName: string;
}

export interface AzureConnection {
  subscriptionId: string;
  displayName: string;
  method: "lighthouse" | "app-registration";
  connectedAt: string;
  connectedBy: string;
}
