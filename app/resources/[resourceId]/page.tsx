import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repositories";
import { decodeResourceId } from "@/lib/data/parse";
import { getDecisionRepository } from "@/lib/decisions/store";
import { getResourceInsight } from "@/lib/insights/service";
import { ResourceDetail } from "@/components/resource/ResourceDetail";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const id = decodeResourceId(resourceId);
  const [data, decision, insight] = await Promise.all([
    getRepository().getResourceById(id),
    getDecisionRepository().get(id),
    getResourceInsight(id),
  ]);
  if (!data) notFound();
  return <ResourceDetail data={data} decision={decision} insight={insight} />;
}
