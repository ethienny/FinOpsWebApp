// Onboarding rules: only read roles, template shape and command text.

import { describe, expect, it } from "vitest";
import { buildLighthouseTemplate, deployCommand, isGuid, REQUIRED_ROLES } from "./lighthouse";

const provider = {
  tenantId: "11111111-1111-1111-1111-111111111111",
  principalId: "22222222-2222-2222-2222-222222222222",
  principalDisplayName: "FinOps Insight Engine",
  offerName: "FinOps Insight Engine",
};

describe("required roles", () => {
  it("asks only for Reader, Cost Management Reader and Monitoring Reader", () => {
    expect(REQUIRED_ROLES.map((r) => r.name)).toEqual(["Reader", "Cost Management Reader", "Monitoring Reader"]);
    for (const role of REQUIRED_ROLES) {
      expect(role.name).not.toMatch(/contributor|owner|admin/i);
      expect(isGuid(role.definitionId)).toBe(true);
    }
  });
});

describe("buildLighthouseTemplate", () => {
  const template = buildLighthouseTemplate(provider) as {
    resources: Array<{ type: string; properties: Record<string, unknown> }>;
  };

  it("registers the provider tenant with one authorization per role", () => {
    const definition = template.resources.find((r) => r.type === "Microsoft.ManagedServices/registrationDefinitions");
    expect(definition?.properties.managedByTenantId).toBe(provider.tenantId);
    const auth = definition?.properties.authorizations as Array<{ roleDefinitionId: string; principalId: string }>;
    expect(auth.map((a) => a.roleDefinitionId)).toEqual(REQUIRED_ROLES.map((r) => r.definitionId));
    expect(new Set(auth.map((a) => a.principalId))).toEqual(new Set([provider.principalId]));
  });

  it("assigns the definition and declares nothing else", () => {
    expect(template.resources.map((r) => r.type)).toEqual([
      "Microsoft.ManagedServices/registrationDefinitions",
      "Microsoft.ManagedServices/registrationAssignments",
    ]);
  });
});

describe("commands and guids", () => {
  it("targets the customer subscription", () => {
    const cmd = deployCommand("33333333-3333-3333-3333-333333333333", "brazilsouth");
    expect(cmd).toContain("az account set --subscription 33333333-3333-3333-3333-333333333333");
    expect(cmd).toContain("--location brazilsouth");
  });

  it("validates guids", () => {
    expect(isGuid("33333333-3333-3333-3333-333333333333")).toBe(true);
    expect(isGuid("not-a-guid")).toBe(false);
    expect(isGuid(42)).toBe(false);
  });
});
