"use client";

// Opens the browser print dialog, where the report is saved as PDF.

import { Printer } from "lucide-react";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

export function PrintButton() {
  const dict = useDictionary();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/25"
    >
      <Printer className="h-4 w-4" />
      {dict.report.toolbar.printButton}
    </button>
  );
}
