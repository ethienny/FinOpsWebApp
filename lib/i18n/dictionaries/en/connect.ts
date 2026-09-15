export const connect = {
  azureConnection: "Azure connection",
  connectedPrefix: "Connected",
  via: "via",
  by: "by",
  methodLighthouse: "Azure Lighthouse",
  methodAppRegistration: "app registration",
  notConnectedYet: "No subscription connected yet. Follow the three steps below.",
  disconnect: "Disconnect",
  emulationNote:
    "Emulation: this page records the connection without calling Azure. The roles, the template and the commands are the real ones a customer uses.",
  step1: {
    title: "What we ask for: three read only roles, nothing that writes",
    footer:
      "The product never asks for Contributor or Owner and never changes anything in your subscription. Recommendations are applied by your team.",
  },
  step2: {
    title: "Delegate access with Azure Lighthouse",
    introBeforeFile: "Save the template below as",
    introAfterFile: "and deploy it on your subscription. The delegation appears under",
    servicesProviders: "Service providers",
    introEnd: "in your Azure portal, where you can review and remove it at any time.",
    placeholderWarning:
      "Provider identity is a placeholder. Set FINOPS_PROVIDER_TENANT_ID and FINOPS_PROVIDER_PRINCIPAL_ID in the environment so the template carries your real tenant and service principal.",
    lighthouseTemplate: "Lighthouse template",
    deployWithCli: "Deploy with Azure CLI",
  },
  step3: {
    title: "Verify the connection and know how to revoke it",
    revokeTitle: "Revoke from your side, whenever you want",
    revokeNote:
      "Revoking removes every permission at once. No action on our side is required, and nothing you delete depends on us.",
  },
  form: {
    subscriptionId: "Subscription id",
    displayName: "Display name",
    displayNamePlaceholder: "Production subscription",
    method: "Method",
    checking: "Checking...",
    verifyAndConnect: "Verify and connect",
  },
  copyBlock: {
    copy: "Copy",
    copied: "Copied",
  },
  rolePurposes: {
    Reader: "Inventory: resource names, types, sizes, regions and tags.",
    "Cost Management Reader": "Cost per resource and per subscription from Cost Management.",
    "Monitoring Reader": "Usage metrics such as CPU, memory and throughput from Azure Monitor.",
  },
  errors: {
    subscriptionIdGuid: "Subscription id must be a GUID.",
    checkFields: "Check the fields and try again.",
  },
  success: "Connection recorded. In the emulation no Azure call is made.",
} as const;
