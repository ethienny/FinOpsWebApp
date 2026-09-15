"use client";

// Collapsible JSON block for the raw evidence of a resource.

import { useMemo, useState } from "react";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

export function JsonViewer({ title, value }: { title: string; value: unknown }) {
  const dict = useDictionary();
  const [open, setOpen] = useState(false);
  const text = useMemo(() => {
    try {
      return JSON.stringify(value ?? {}, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-200"
      >
        {title}
        <span className="text-xs text-cyan-300">{open ? dict.resources.jsonViewer.hide : dict.resources.jsonViewer.show}</span>
      </button>
      {open ? (
        <pre className="max-h-80 overflow-auto border-t border-white/10 p-4 text-xs leading-relaxed text-slate-300">
          {text}
        </pre>
      ) : null}
    </div>
  );
}
