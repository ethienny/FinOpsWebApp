"use server";

// Server action behind the decision form. Validates the submitted fields,
// stores the decision and revalidates the pages that display it.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DEMO_USER, getDecisionRepository } from "@/lib/decisions/store";
import { DECISION_STATUSES } from "@/lib/decisions/metrics";
import { getRepository } from "@/lib/repositories";

// Azure resource ids stay well under 512 characters; the caps keep a forged
// submission from growing the state file without limit.
const schema = z.object({
  resourceId: z.string().min(1).max(512),
  runId: z.string().min(1).max(200),
  status: z.enum(DECISION_STATUSES),
  owner: z.string().trim().max(120),
  note: z.string().trim().max(1000),
});

export interface DecisionFormState {
  ok: boolean;
  message: string;
}

export async function saveDecision(_prev: DecisionFormState, formData: FormData): Promise<DecisionFormState> {
  const parsed = schema.safeParse({
    resourceId: formData.get("resourceId"),
    runId: formData.get("runId"),
    status: formData.get("status"),
    owner: formData.get("owner") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, message: "The decision could not be saved. Check the fields and try again." };
  }
  if (!(await getRepository().getResourceById(parsed.data.resourceId))) {
    return { ok: false, message: "The resource is not part of the published dataset." };
  }
  await getDecisionRepository().save({
    ...parsed.data,
    updatedAt: new Date().toISOString(),
    updatedBy: DEMO_USER,
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Decision saved." };
}
