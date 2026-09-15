"use server";

// Server actions behind the onboarding page. In the emulation, connecting
// records the subscription without calling Azure; disconnecting removes it.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DEMO_USER } from "@/lib/decisions/store";
import { isGuid } from "@/lib/onboarding/lighthouse";
import { clearConnection, saveConnection } from "@/lib/onboarding/store";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export interface ConnectionFormState {
  ok: boolean;
  message: string;
}

export async function connectAzure(_prev: ConnectionFormState, formData: FormData): Promise<ConnectionFormState> {
  const dict = getDictionary(await getLocale());
  const schema = z.object({
    subscriptionId: z.string().trim().refine(isGuid, dict.connect.errors.subscriptionIdGuid),
    displayName: z.string().trim().min(1).max(120),
    method: z.enum(["lighthouse", "app-registration"]),
  });
  const parsed = schema.safeParse({
    subscriptionId: formData.get("subscriptionId"),
    displayName: formData.get("displayName") || "Customer subscription",
    method: formData.get("method"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? dict.connect.errors.checkFields };
  }
  await saveConnection({ ...parsed.data, connectedAt: new Date().toISOString(), connectedBy: DEMO_USER });
  revalidatePath("/", "layout");
  return { ok: true, message: dict.connect.success };
}

export async function disconnectAzure(): Promise<void> {
  await clearConnection();
  revalidatePath("/", "layout");
}
