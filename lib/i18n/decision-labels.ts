// Glue between the decision status enum (lib/decisions) and its translated
// display labels (common.badges.decision), for the handful of server-side
// call sites that bake a label into chart/table data rather than rendering
// through <DecisionBadge>.

import type { DecisionStatus } from "@/types/finops";
import type { Dictionary } from "./dictionary";

export function decisionLabelsFromDict(dict: Dictionary): Record<DecisionStatus, string> {
  const labels = dict.common.badges.decision;
  return {
    open: labels.open,
    accepted: labels.accepted,
    in_progress: labels.inProgress,
    done: labels.done,
    dismissed: labels.dismissed,
  };
}
