# FinOps Insight Engine

Cloud Cost Intelligence & Optimization — a production-style FinOps SaaS dashboard for executive cost, showback, rightsizing and engine health.

The UI is a dark navy enterprise workspace with cyan highlights, KPI-first pages and drill-through from inventory to resource evidence.

## Architecture

The application is a Next.js App Router product. Pages are Server Components. CSV files are parsed only on the server and cached in memory. UI components never read CSV files.

```
UI (App Router pages + client islands)
        │
        ▼
FinOpsRepository contract
        │
        ├── CsvFinOpsRepository   (current)
        └── DatabricksFinOpsRepository (future, not implemented)
```

Official executive numbers always come from `vw_finops_latest_complete_run.csv`. Multi-run recommendation history lives in `azure_finops_multiservice_recommendation.csv` and is used only for cross-run trends.

Each CSV is parsed on first use and cached for the process, so a page only pays for the datasets it reads. Client tables receive `ResourceSummary`, a projection with the rendered columns only, never the full recommendation row.

Loading skeletons live in each route folder instead of the app root. A root `loading.tsx` would wrap `/resources/[resourceId]` in a streaming boundary and force a 200 response on resources that do not exist, so `/` and `/resources` keep their skeletons inside route groups.

## Folder structure

```
/app                  routes and layout
/components           layout, charts, KPIs, tables, filters, badges, resource views
/lib/data             CSV load/parse and in-memory store
/lib/repositories     FinOpsRepository implementations
/lib/formatters       money, percent, compact numbers
/lib/aggregations     shared filter matching
/lib/decisions        recommendation decisions: rules, JSON store, page service
/lib/insights         recommendation aging and quick win scoring, page service
/types                TypeScript models generated from CSV schemas
/data                 simulated Databricks tables/views
```

## How to install

```bash
npm install
```

## How to run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local data

The mock CSVs are not tracked by git. Compressed copies live in `data/mock/*.csv.gz` (the same dataset migrated to Azure SQL). `npm run dev` restores them into `data/` automatically on first run; `npm run data:restore` does the same by hand, and `--force` rewrites existing files. The plain CSVs stay ignored by git.

`DATA_SOURCE=csv` is the default. To read from Azure SQL instead, copy `.env.example` to `.env.local`, set `DATA_SOURCE=sql` and fill in the `AZURE_SQL_*` variables.

```bash
npm run build
npm start
npm run lint
npm run typecheck
npm test
```

## CSV data sources

| File | Role |
| --- | --- |
| `vw_finops_latest_complete_run.csv` | Official latest complete recommendations. Executive, showback, opportunities, resources. |
| `finops_engine_runs.csv` | Run quality, publication, engine health. |
| `vw_finops_target_options.csv` | Current official sizing options. |
| `vw_finops_target_options_all_runs.csv` | Sizing history and technical comparison. |
| `azure_finops_multiservice_recommendation.csv` | Multi-run raw recommendations. Never used for official executive totals. |

## Calculation rules

Executive layer:

- Monthly Cost Analyzed = `SUM(MonthlyCost)`
- Validated Savings (PRICED) = `SUM(EstimatedMonthlySavings) WHERE SavingsReliability = PRICED`
- Estimated Opportunity (HEURISTIC) = `SUM(EstimatedMonthlySavings) WHERE SavingsReliability = HEURISTIC`
- Actionable Resources = `COUNT WHERE IsActionable = true`

Do **not** calculate official executive values from `azure_finops_multiservice_recommendation.csv`. That file contains multiple runs and would duplicate totals.

## PRICED vs HEURISTIC

PRICED and HEURISTIC savings are never combined into one headline total.

`SecondaryMonthlySavings` is an alternative recommendation only and is never added to primary savings.

UNPRICED rows are shown in reliability distributions but do not contribute to either savings KPI.

## Sizing rules

- Profile selector is mandatory and single-select: Conservative (default), Moderate, Aggressive.
- Selected profile savings = `SUM(MonthlySavings)` for that profile only.
- Official Conservative Savings = `SUM(OfficialConservativeSavings)` on unique resources (Conservative profile).
- Never sum `MonthlySavings` across all profiles.

## Resource drillthrough

Resource names link to `/resources/[encoded-resource-id]` (base64url of `ResourceId`).

Detail tabs: Overview, Cost & Usage, Recommendation, Sizing, Metrics, History, JSON.

Raw JSON appears only in the JSON tab.

## Cost of inaction and quick wins

Two analyses derive from the multi run history and the recommendation evidence.

**Recommendation age.** For each resource actionable in the latest official run, the engine history is walked backwards over complete full scope runs while the same actionable recommendation was present. The streak gives runs open, days open and the first detection run. Missed savings accrue per interval between runs from the estimate of each run, only while it was PRICED. Buckets: New (1 run), Recurring (2 to 4), Persistent (5 or more). Filtered scope and failed runs do not count.

**Quick win score.** Value rank is the percentile of `RiskAdjustedMonthlySavings` among PRICED actionable rows in the current scope. Execution safety is the mean of four factors: confidence (HIGH 1, MEDIUM 0.6, LOW 0.3), conservative sizing performance risk (Low 1, Medium 0.6, High 0.2), metric coverage ratio, and destructiveness (destructive 0.4). Score = 100 × (0.5 × value rank + 0.5 × safety). Execution risk is low at safety 0.75 or more, medium at 0.5, high below. A quick win is a PRICED actionable row with low execution risk in the upper half of value.

Both live on the Insights page (Cost of Inaction and Quick Wins sections), with headline figures on Executive, columns on Opportunities (Age, Missed so far, Quick win score and Execution risk) and a strip on the resource detail page. The rules live in `lib/insights` and are unit tested.

## Recommendation decisions

The product emulation tracks what teams decide about each recommendation. A resource carries one decision with a status (`open`, `accepted`, `in_progress`, `done`, `dismissed`), an owner and a note. Decisions are recorded on the resource detail page and surface on Opportunities (status column, dismissed rows hidden by default), Executive (tracking KPIs) and the Tracking page (KPIs, decisions by status, tracked savings by owner and the list of everything decided).

Tracking rules:

- Savings In Progress = `SUM(EstimatedMonthlySavings) WHERE SavingsReliability = PRICED AND status IN (accepted, in_progress)`
- Realized Savings = `SUM(EstimatedMonthlySavings) WHERE SavingsReliability = PRICED AND status = done`
- HEURISTIC and UNPRICED savings never enter tracked totals, whatever the status.
- Dismissed and open rows contribute nothing to either amount.

Decisions are stored in `data/state/decisions.json`, outside version control, through the `DecisionRepository` contract in `lib/decisions/store.ts`. Writes go through the `saveDecision` server action and are attributed to a fixed demo identity until authentication exists. Replace `JsonDecisionRepository` with a database implementation without touching pages.

`npm test` runs the unit tests for these rules with Vitest.

## Repository abstraction

`getRepository()` currently returns `CsvFinOpsRepository`.

`DatabricksFinOpsRepository` implements the same contract and throws until wired to Unity Catalog / SQL warehouse views. Credentials must stay server-side. Do not put Databricks tokens in client components.

## Future Databricks integration

Replace the factory in `lib/repositories/finops-repository.ts` with a server env switch, for example `FINOPS_PROVIDER=databricks`. Map repository methods to the existing views without changing page components.
