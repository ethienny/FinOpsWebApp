// Resolves the current plan for the product emulation. The demo switcher
// writes data/state/plan.json; FINOPS_PLAN in the environment is the fallback
// and enterprise is the default so nothing is hidden until a plan is chosen.
// A licensing service replaces this file without touching pages.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import type { Entitlements, Plan } from "@/types/entitlements";
import { entitlementsFor, isPlan } from "./catalog";

const STATE_DIR = join(process.cwd(), "data", "state");
const PLAN_FILE = join(STATE_DIR, "plan.json");

function readStoredPlan(): Plan | null {
  if (!existsSync(PLAN_FILE)) return null;
  try {
    const parsed: unknown = JSON.parse(readFileSync(PLAN_FILE, "utf8"));
    const plan = (parsed as { plan?: unknown })?.plan;
    return isPlan(plan) ? plan : null;
  } catch {
    return null;
  }
}

export async function getEntitlements(): Promise<Entitlements> {
  const stored = readStoredPlan();
  if (stored) return entitlementsFor(stored, "state");
  const env = process.env.FINOPS_PLAN;
  if (isPlan(env)) return entitlementsFor(env, "env");
  return entitlementsFor("enterprise", "default");
}

export async function savePlan(plan: Plan): Promise<void> {
  mkdirSync(STATE_DIR, { recursive: true });
  const tmp = `${PLAN_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify({ plan }, null, 2));
  renameSync(tmp, PLAN_FILE);
}
