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

```bash
npm run build
npm start
npm run lint
npm run typecheck
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

## Repository abstraction

`getRepository()` currently returns `CsvFinOpsRepository`.

`DatabricksFinOpsRepository` implements the same contract and throws until wired to Unity Catalog / SQL warehouse views. Credentials must stay server-side. Do not put Databricks tokens in client components.

## Future Databricks integration

Replace the factory in `lib/repositories/finops-repository.ts` with a server env switch, for example `FINOPS_PROVIDER=databricks`. Map repository methods to the existing views without changing page components.
