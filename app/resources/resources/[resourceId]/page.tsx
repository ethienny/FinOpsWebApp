import { notFound } from "next/navigation";
import { getRepository } from "@/lib/repositories";
import { decodeResourceId } from "@/lib/data/parse";
import { ResourceDetail } from "@/components/resource/ResourceDetail";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ resourceId: string }>;
}) {
  const { resourceId } = await params;
  const id = decodeResourceId(resourceId);
  const data = await getRepository().getResourceById(id);
  if (!data) notFound();
  return <ResourceDetail data={data} />;
}
