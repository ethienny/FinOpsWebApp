"use server";

// Server action behind the demo plan switcher. Stores the chosen plan and
// revalidates every page, since the menu and the gates depend on it.

import { revalidatePath } from "next/cache";
import { isPlan } from "@/lib/entitlements/catalog";
import { savePlan } from "@/lib/entitlements/store";

export async function setPlan(formData: FormData): Promise<void> {
  const plan = formData.get("plan");
  if (!isPlan(plan)) return;
  await savePlan(plan);
  revalidatePath("/", "layout");
}
