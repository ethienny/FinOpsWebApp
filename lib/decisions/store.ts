// Decision persistence for the product emulation. Decisions live in a JSON
// file under data/state, outside version control, behind the same repository
// pattern used for FinOps data so a database can replace it later.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import type { DecisionRepository, RecommendationDecision } from "@/types/finops";

const STATE_DIR = join(process.cwd(), "data", "state");
const DECISIONS_FILE = join(STATE_DIR, "decisions.json");

/** Identity recorded on writes while the emulation has no authentication. */
export const DEMO_USER = "finops.admin";

function readAll(): RecommendationDecision[] {
  if (!existsSync(DECISIONS_FILE)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(DECISIONS_FILE, "utf8"));
    return Array.isArray(parsed) ? (parsed as RecommendationDecision[]) : [];
  } catch {
    return [];
  }
}

/** Writes through a temporary file so a crash never leaves a half written file. */
function writeAll(decisions: RecommendationDecision[]): void {
  mkdirSync(STATE_DIR, { recursive: true });
  const tmp = `${DECISIONS_FILE}.tmp`;
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
