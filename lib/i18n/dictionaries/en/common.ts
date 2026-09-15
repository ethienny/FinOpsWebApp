// Strings shared by generic, reusable UI: the DataTable chrome and the
// prose-style badge labels (StatusBadge/etc. display raw technical codes
// as-is and are intentionally left untranslated).

export const common = {
  table: {
    searchPlaceholder: "Search...",
    filterAriaLabel: "Filter {column}",
    allOption: "All",
    previous: "Previous",
    next: "Next",
    noRows: "No rows in the current scope.",
    rowsCount: "{count} rows",
  },
  kpi: {
    viewDetails: "View details",
  },
  badges: {
    decision: {
      done: "Done",
      inProgress: "In progress",
      accepted: "Accepted",
      dismissed: "Dismissed",
      open: "Open",
    },
    age: {
      persistent: "Persistent",
      recurring: "Recurring",
      new: "New",
    },
    change: {
      new: "New",
      resolved: "Resolved",
      actionChanged: "Action changed",
      reliabilityChanged: "Reliability changed",
      savingsChanged: "Savings changed",
    },
    outcome: {
      found: "found",
      reconciled: "reconciled",
      sent: "sent",
      valid: "valid",
      owned: "owned",
      partial: "partial",
      missing: "missing",
      pendingsend: "pending send",
      unowned: "unowned",
      invalid: "invalid",
      lookup_failed: "lookup failed",
      not_reconciled: "not reconciled",
      failed: "failed",
    },
  },
  actions: {
    export: "Export",
    print: "Print",
    save: "Save",
    cancel: "Cancel",
  },
} as const;
