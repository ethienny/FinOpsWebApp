// Server side gate for module pages. Returns the entitlements when the module
// is included in the plan, or the locked element to render instead.

import { ModuleLocked } from "@/components/layout/ModuleLocked";
import type { Entitlements, Module } from "@/types/entitlements";
import { hasModule } from "./catalog";
import { getEntitlements } from "./store";

export async function requireModule(
  module: Module,
): Promise<{ entitlements: Entitlements; locked: React.ReactElement | null }> {
  const entitlements = await getEntitlements();
  if (hasModule(entitlements, module)) return { entitlements, locked: null };
  return { entitlements, locked: <ModuleLocked module={module} entitlements={entitlements} /> };
}
