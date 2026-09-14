# Architecture notes

Short notes for whoever maintains the app. The README describes the features; this file records decisions that are easy to break by accident.

## Server pages, client tables

Every page is a Server Component that runs its query on the server and passes plain rows to the table. Columns, `render` and `sortValue` functions live in the client components of `components/tables`, never in the page, because functions cannot cross the server to client boundary. Search, per column filters, sorting and pagination happen in the browser inside `DataTable`. Pages pass only rows and, when needed, the currency. `"use server"` is not used as a workaround for this.

## Resource ids in URLs

Azure resource ids contain slashes, so links encode them as base64url (`encodeResourceId` in `lib/data/parse.ts`), including Unicode, and the detail page decodes them back.

## Data store

`lib/data/store.ts` is the only module that reads CSV files or Azure SQL. In csv mode each dataset is parsed on first use; in sql mode the five tables are loaded sequentially at startup to keep memory bounded, with retries for transient connection resets. `lib/anomalies/store.ts` follows the same pattern for the cost anomaly tables.

## Business rules that must hold

- PRICED and HEURISTIC savings are never added together.
- `SecondaryMonthlySavings` is never added to a total.
- Official conservative sizing savings count each resource once.
- Recommendation aging and run to run changes only look at complete full scope runs.
