// Streaming placeholder for this route only. Keeping loading files out of the
// resource detail segment lets notFound() answer with a real 404 status there.

import { LoadingSkeleton } from "@/components/kpi/States";

export default function Loading() {
  return <LoadingSkeleton />;
}
