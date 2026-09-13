"use client";

// Records the customer subscription once the delegation is in place. Submits
// to the connectAzure server action and shows the outcome inline.

import { useActionState } from "react";
import { connectAzure, type ConnectionFormState } from "@/app/actions/connection";

const INITIAL: ConnectionFormState = { ok: false, message: "" };

export function ConnectForm() {
  const [state, action, pending] = useActionState(connectAzure, INITIAL);
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_200px]">
      <label className="block text-[11px] uppercase tracking-wide text-slate-400">
        Subscription id
        <input
          name="subscriptionId"
          required
          placeholder="00000000-0000-0000-0000-000000000000"
          className="mt-1 w-full px-3 py-1.5 font-mono text-sm text-slate-100 placeholder:text-slate-600"
        />
      </label>
      <label className="block text-[11px] uppercase tracking-wide text-slate-400">
        Display name
        <input
          name="displayName"
          maxLength={120}
          placeholder="Production subscription"
          className="mt-1 w-full px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600"
        />
      </label>
      <label className="block text-[11px] uppercase tracking-wide text-slate-400">
        Method
        <select name="method" defaultValue="lighthouse" className="mt-1 w-full px-2 py-1.5 text-sm text-slate-100">
          <option value="lighthouse">Azure Lighthouse</option>
          <option value="app-registration">App registration</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
        >
          {pending ? "Checking..." : "Verify and connect"}
        </button>
        {state.message ? (
          <p className={state.ok ? "text-xs text-emerald-300" : "text-xs text-rose-300"} role="status">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
