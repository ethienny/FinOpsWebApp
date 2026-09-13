"use client";

// Form that records what the team decided about a recommendation. Submits to
// the saveDecision server action and shows the outcome inline.

import { useActionState } from "react";
import { saveDecision, type DecisionFormState } from "@/app/actions/decisions";
import { DECISION_LABELS, DECISION_STATUSES } from "@/lib/decisions/metrics";
import { DecisionBadge } from "@/components/badges";
import { formatDate } from "@/lib/formatters";
import type { RecommendationDecision } from "@/types/finops";

const INITIAL: DecisionFormState = { ok: false, message: "" };

export function DecisionPanel({
  resourceId,
  runId,
  decision,
}: {
  resourceId: string;
  runId: string;
  decision: RecommendationDecision | null;
}) {
  const [state, action, pending] = useActionState(saveDecision, INITIAL);
  const status = decision?.status ?? "open";

  return (
    <section className="card-surface p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-300">Decision</p>
          <p className="mt-1 text-sm text-slate-400">
            Record what the team decided about this recommendation. Tracked savings only count PRICED values.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <DecisionBadge value={status} />
          {decision ? (
            <span>
              Updated {formatDate(decision.updatedAt)} by {decision.updatedBy}
            </span>
          ) : null}
        </div>
      </div>

      {/* React resets the form when the action completes, before the refreshed
          decision arrives. Keying the form on the decision timestamp remounts it
          with the stored values once they land. */}
      <form key={decision?.updatedAt ?? "new"} action={action} className="mt-4 grid gap-3 md:grid-cols-[200px_1fr]">
        <input type="hidden" name="resourceId" value={resourceId} />
        <input type="hidden" name="runId" value={runId} />
        <label className="block text-[11px] uppercase tracking-wide text-slate-400">
          Status
          <select name="status" defaultValue={status} className="mt-1 w-full px-2 py-1.5 text-sm text-slate-100">
            {DECISION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {DECISION_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] uppercase tracking-wide text-slate-400">
          Owner
          <input
            name="owner"
            defaultValue={decision?.owner ?? ""}
            placeholder="Team or person responsible"
            maxLength={120}
            className="mt-1 w-full px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </label>
        <label className="block text-[11px] uppercase tracking-wide text-slate-400 md:col-span-2">
          Note
          <textarea
            name="note"
            rows={2}
            defaultValue={decision?.note ?? ""}
            placeholder="Context for the decision, ticket reference, expected date"
            maxLength={1000}
            className="mt-1 w-full px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save decision"}
          </button>
          {state.message ? (
            <p className={state.ok ? "text-xs text-emerald-300" : "text-xs text-rose-300"} role="status">
              {state.message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
