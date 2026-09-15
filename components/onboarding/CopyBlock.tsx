"use client";

// Code block with a copy button, used for the Lighthouse template and the CLI commands.

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

export function CopyBlock({ title, text, filename }: { title: string; text: string; filename?: string }) {
  const [copied, setCopied] = useState(false);
  const dict = useDictionary().connect.copyBlock;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-navy-900/60">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
        <p className="text-xs font-medium text-slate-200">
          {title}
          {filename ? <span className="ml-2 font-mono text-[11px] text-slate-500">{filename}</span> : null}
        </p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/5 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-300" /> : <Copy className="h-3 w-3" />}
          {copied ? dict.copied : dict.copy}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-slate-300">{text}</pre>
    </div>
  );
}
