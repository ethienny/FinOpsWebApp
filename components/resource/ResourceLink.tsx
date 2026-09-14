// Link to the detail page of a resource. The id is base64url encoded because
// Azure resource ids contain slashes.

import Link from "next/link";
import { encodeResourceId } from "@/lib/data/parse";

export function ResourceLink({
  resourceId,
  name,
}: {
  resourceId: string;
  name: string;
}) {
  return (
    <Link
      href={`/resources/${encodeResourceId(resourceId)}`}
      className="font-medium text-cyan-200 hover:text-white hover:underline"
    >
      {name}
    </Link>
  );
}
