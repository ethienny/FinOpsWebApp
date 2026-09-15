"use client";

// Last resort error boundary. The root layout reads the data sources, and a
// failure there (missing CSV, paused SQL) never reaches app/error.tsx, so this
// boundary renders its own html and body with the same retry affordance.

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#07152c", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, margin: "15vh auto", padding: "0 24px", textAlign: "center" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#67e8f9" }}>FinOps Insight Engine</p>
          <h1 style={{ fontSize: 22, margin: "12px 0" }}>The data sources could not be read.</h1>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>
            Check that the CSV files were restored with <code>npm run data:restore</code>, or that the Azure SQL credentials in the
            environment are valid, then try again.
          </p>
          {error.digest ? <p style={{ fontSize: 12, color: "#64748b" }}>Reference: {error.digest}</p> : null}
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, padding: "8px 16px", borderRadius: 12, border: "1px solid #ffffff22", background: "transparent", color: "#e2e8f0", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
