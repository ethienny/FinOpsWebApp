// Plan catalog rules: module inclusion per plan, lowest plan for a module,
// route ownership and subscription limits.

import { describe, expect, it } from "vitest";
import { entitlementsFor, exceedsSubscriptionLimit, hasModule, isPlan, moduleForPath, planRequiredFor } from "./catalog";

describe("plan catalog", () => {
  it("every plan includes the core module and nothing hides savings", () => {
    for (const plan of ["assessment", "starter", "pro", "enterprise", "partner"] as const) {
      expect(hasModule(entitlementsFor(plan, "default"), "core")).toBe(true);
    }
  });

  it("modules grow with the plan", () => {
    expect(entitlementsFor("assessment", "default").modules).toEqual(["core"]);
    expect(hasModule(entitlementsFor("starter", "default"), "tracking")).toBe(true);
    expect(hasModule(entitlementsFor("starter", "default"), "showback")).toBe(false);
    expect(hasModule(entitlementsFor("pro", "default"), "showback")).toBe(true);
    expect(hasModule(entitlementsFor("pro", "default"), "governance")).toBe(false);
    expect(hasModule(entitlementsFor("enterprise", "default"), "governance")).toBe(true);
  });

  it("names the lowest plan that unlocks a module", () => {
    expect(planRequiredFor("core")).toBe("assessment");
    expect(planRequiredFor("tracking")).toBe("starter");
    expect(planRequiredFor("sizing")).toBe("pro");
    expect(planRequiredFor("governance")).toBe("enterprise");
  });

  it("maps routes to modules, including nested routes", () => {
    expect(moduleForPath("/")).toBe("core");
    expect(moduleForPath("/resources/abc")).toBe("core");
    expect(moduleForPath("/tracking")).toBe("tracking");
    expect(moduleForPath("/run-history")).toBe("governance");
    expect(moduleForPath("/unknown")).toBeNull();
  });

  it("applies subscription limits only where the plan has one", () => {
    expect(exceedsSubscriptionLimit(entitlementsFor("starter", "default"), 5)).toBe(false);
    expect(exceedsSubscriptionLimit(entitlementsFor("starter", "default"), 6)).toBe(true);
    expect(exceedsSubscriptionLimit(entitlementsFor("pro", "default"), 400)).toBe(false);
  });

  it("validates plan names", () => {
    expect(isPlan("pro")).toBe(true);
    expect(isPlan("gold")).toBe(false);
    expect(isPlan(null)).toBe(false);
  });
});
