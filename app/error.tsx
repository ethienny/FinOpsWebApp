"use client";

// Route level error boundary. Catches failures from the server queries, such as
// a missing or unreadable CSV, and offers a retry without a full reload.

import { useEffect } from "react";
import { ErrorState } from "@/components/kpi/States";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-4">
      <ErrorState
        title="This view could not be loaded."
        detail="The FinOps dataset could not be read. Check the data sources and try again."
      />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
