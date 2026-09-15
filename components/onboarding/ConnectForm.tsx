"use client";

// Records the customer subscription once the delegation is in place. Submits
// to the connectAzure server action and shows the outcome inline.

import { useActionState } from "react";
import { connectAzure, type ConnectionFormState } from "@/app/actions/connection";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

const INITIAL: ConnectionFormState = { ok: false, message: "" };

export function ConnectForm() {
  const [state, action, pending] = useActionState(connectAzure, INITIAL);
  const connectDict = useDictionary().connect;
  const dict = connectDict.form;
  return (
    <form action={action} className="grid gap-3 md:grid-cols-[1fr_1fr_200px]">
      <label className="block text-[11px] uppercase tracking-wide text-slate-400">
        {dict.subscriptionId}
        <input
          name="subscriptionId"
          required
          placeholder="00000000-0000-0000-0000-000000000000"
          className="mt-1 w-full px-3 py-1.5 font-mono text-sm text-slate-100 placeholder:text-slate-600"
        />
      </label>
      <label className="block text-[11px] uppercase tracking-wide text-slate-400">
        {dict.displayName}
        <input
          name="displayName"
          maxLength={120}
          placeholder={dict.displayNamePlaceholder}
          className="mt-1 w-full px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-600"
        />
      </label>
      <label className="block text-[11px] uppercase tracking-wide text-slate-400">
        {dict.method}
        <select name="method" defaultValue="lighthouse" className="mt-1 w-full px-2 py-1.5 text-sm text-slate-100">
          <option value="lighthouse">{connectDict.methodLighthouse}</option>
          <option value="app-registration">{connectDict.methodAppRegistration}</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3 md:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
        >
          {pending ? dict.checking : dict.verifyAndConnect}
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
