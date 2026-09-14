// Resource detail page. Loads the recommendation of one resource with its
// sizing options, run history, insight fields and the team decision, gated by
// the modules of the active plan.

import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repositories";
import { decodeResourceId } from "@/lib/data/parse";
import { getDecisionRepository } from "@/lib/decisions/store";
import { getResourceInsight } from "@/lib/insights/service";
import { getEntitlements } from "@/lib/entitlements/store";
import { hasModule } from "@/lib/entitlements/catalog";
import { ResourceDetail } from "@/components/resource/ResourceDetail";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const id = decodeResourceId(resourceId);
  const [data, decision, insight, entitlements] = await Promise.all([
    getRepository().getResourceById(id),
    getDecisionRepository().get(id),
    getResourceInsight(id),
    getEntitlements(),
  ]);
  if (!data) notFound();
  return (
    <ResourceDetail
      data={data}
      decision={decision}
      insight={insight}
      showDecision={hasModule(entitlements, "tracking")}
      showInsight={hasModule(entitlements, "insights")}
    />
  );
}
