// Decision persistence for the product emulation. Decisions live in a JSON
// file under data/state, outside version control, behind the same repository
// pattern used for FinOps data so a database can replace it later.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import type { DecisionRepository, DecisionStatus, RecommendationDecision } from "@/types/finops";
import { DECISION_STATUSES } from "./metrics";

const STATE_DIR = join(process.cwd(), "data", "state");
const DECISIONS_FILE = join(STATE_DIR, "decisions.json");

/** Identity recorded on writes while the emulation has no authentication. */
export const DEMO_USER = "finops.admin";

/** Keeps only rows with the expected shape, so a hand edited file cannot break the pages. */
function isDecision(value: unknown): value is RecommendationDecision {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.resourceId === "string" &&
    row.resourceId.length > 0 &&
    typeof row.runId === "string" &&
    (DECISION_STATUSES as readonly string[]).includes(row.status as DecisionStatus)
  );
}

/**
 * Reads every stored decision. A file that no longer parses is moved aside
 * with a timestamp so the next save cannot overwrite it, and the pages carry
 * on with no decisions instead of failing.
 */
function readAll(): RecommendationDecision[] {
  if (!existsSync(DECISIONS_FILE)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(DECISIONS_FILE, "utf8"));
    return Array.isArray(parsed) ? parsed.filter(isDecision) : [];
  } catch (err) {
    const aside = `${DECISIONS_FILE}.corrupt-${Date.now()}`;
    console.error(`[decisions] ${DECISIONS_FILE} could not be parsed, moved to ${aside}:`, err instanceof Error ? err.message : err);
    renameSync(DECISIONS_FILE, aside);
    return [];
  }
}

/**
 * Writes through a temporary file so a crash never leaves a half written
 * file. The temporary name carries the pid so two processes sharing the
 * folder never rename each other's file.
 */
function writeAll(decisions: RecommendationDecision[]): void {
  mkdirSync(STATE_DIR, { recursive: true });
  const tmp = `${DECISIONS_FILE}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, JSON.stringify(decisions, null, 2));
  renameSync(tmp, DECISIONS_FILE);
}

export class JsonDecisionRepository implements DecisionRepository {
  async list(): Promise<RecommendationDecision[]> {
    return readAll();
  }

  async get(resourceId: string): Promise<RecommendationDecision | null> {
    return readAll().find((d) => d.resourceId === resourceId) ?? null;
  }

  async save(decision: RecommendationDecision): Promise<void> {
    const others = readAll().filter((d) => d.resourceId !== decision.resourceId);
    writeAll([...others, decision]);
  }
}

let singleton: DecisionRepository | null = null;

export function getDecisionRepository(): DecisionRepository {
  if (!singleton) singleton = new JsonDecisionRepository();
  return singleton;
}
