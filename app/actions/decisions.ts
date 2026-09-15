"use server";

// Server action behind the decision form. Validates the submitted fields,
// stores the decision and revalidates the pages that display it.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DEMO_USER, getDecisionRepository } from "@/lib/decisions/store";
import { DECISION_STATUSES } from "@/lib/decisions/metrics";
import { getRepository } from "@/lib/repositories";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";

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
  const dict = getDictionary(await getLocale());
  const parsed = schema.safeParse({
    resourceId: formData.get("resourceId"),
    runId: formData.get("runId"),
    status: formData.get("status"),
    owner: formData.get("owner") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, message: dict.resources.decision.errorSave };
  }
  if (!(await getRepository().getResourceById(parsed.data.resourceId))) {
    return { ok: false, message: dict.resources.decision.errorResourceNotFound };
  }
  await getDecisionRepository().save({
    ...parsed.data,
    updatedAt: new Date().toISOString(),
    updatedBy: DEMO_USER,
  });
  revalidatePath("/", "layout");
  return { ok: true, message: dict.resources.decision.saved };
}
