# Action Plan - DASH-247

Status: Approved
Governing spec: docs/specs/DASH-247.md
Last updated: 2026-09-30

Prior plan approved by the user on 2026-09-29. This approved revision splits blocked task 3 after two failed validation/review cycles; tasks 1 and 2 and their passed checkpoints remain complete.

## Objective
Deliver the approved historical weekly comparison from the unchanged seed using .NET, SQL Server, and an Angular SPA with persisted controls.

## Tasks
| # | Description | Owner | Dependencies | Output | Required Validation |
|---|-------------|-------|--------------|--------|---------------------|
| 1 | Scaffold .NET 10 ASP.NET Core/EF Core SQL Server projects and xUnit tests. Create an EF migration matching both seed tables, a repeatable local setup that applies the migration then loads the unchanged `seed/seed.sql` into a fresh database, and a LocalDB-backed integration fixture. Keep the seed read-only and check counts, keys, and null/odd data without rewriting it. | Relay Backend | None | `backend/Relay.Api/`, `backend/Relay.Tests/`, migration, local seed/setup instructions or script | `dotnet build backend/Relay.Api/Relay.Api.csproj`; `dotnet test backend/Relay.Tests/Relay.Tests.csproj`; `dotnet ef database update --project backend/Relay.Api --startup-project backend/Relay.Api`; `sqlcmd -S . -d Relay -E -b -i seed/seed.sql` on a fresh migrated DB, then verify 20 accounts and 12,626 events. |
| 2 | Implement a bounded asynchronous EF Core grouped query and comparison service, thin read-only endpoint for the fixed account, input validation, precise timezone/week and zero-history rules, xUnit unit and SQL Server integration tests. Publish the development-only OpenAPI endpoint and an inspectable `docs/contracts/DASH-247.openapi.json` contract snapshot. | Relay Backend | 1 and checkpoint 1 passed | `backend/Relay.Api/` endpoint/service/DTOs, `backend/Relay.Tests/` tests, OpenAPI snapshot with endpoint, filters, responses, and errors | `dotnet build backend/Relay.Api/Relay.Api.csproj`; `dotnet test backend/Relay.Tests/Relay.Tests.csproj` on LocalDB, including seeded aggregate correctness; verify the development OpenAPI endpoint and contract snapshot agree. |
| 3 | Build a strict standalone Angular SPA using the reviewed OpenAPI contract for typed request/response models. Implement account and location views, accessible metric/week controls, valid persisted selection, shortfall sorting, and loading/empty/error states with focused tests. | Relay Frontend | 2 and checkpoint 2 passed; reviewed OpenAPI snapshot supplied by Backend | `frontend/` SPA and tests | `npm test --prefix frontend -- --watch=false`; `npm run build --prefix frontend`; manually reload after changing metric/week against the live API and check quiet-location and empty-week views. |
| 3a | Correct the displayed metric/week selection after initial load, a control change, persisted reload, and invalid saved-value fallback. Keep the existing dashboard and contract; add DOM assertions for both selects, including persisted `lead_created` and `2026-06-01` and the default week. | Relay Frontend | 3 implementation exists; checkpoint 2 passed; revised plan approved | `frontend/src/app/features/dashboard/dashboard-controls.component.html`, focused frontend DOM tests | `npm test --prefix frontend -- --watch=false`; `npm run build --prefix frontend`; in a live browser verify both selectors agree with the displayed data on default load and after changing both values and reloading. |
| 3b | Preserve keyboard focus on the initiating metric/week select through loading and response (including rapid changes), without losing the loading announcement. Add a DOM focus regression test and check keyboard behavior with the live API. | Relay Frontend | 3a and checkpoint 3a passed | Frontend controls/template and focused DOM tests | `npm test --prefix frontend -- --watch=false`; `npm run build --prefix frontend`; in a live browser use keyboard to change each selector and verify focus remains on the same control after the response. |
| 4 | Document SQL Server prerequisites, migration/seed procedure, .NET and Angular startup, test commands in one line, and reasons for EF Core, local state, and API contract choices. Perform a fresh local setup and full-stack smoke check against the unchanged seed; report exact commands and observed results. | Relay Backend | 3, 3a, 3b and their frontend checkpoints passed | `README.md`, optional local run script, observed setup/API/UI smoke evidence | `dotnet test backend/Relay.Tests/Relay.Tests.csproj`; `npm test --prefix frontend -- --watch=false`; `npm run build --prefix frontend`; fresh migration and seed check; query the API for an account-local week and verify the SPA loads and retains controls after reload. |

## Agents Involved
- Relay Backend: schema/migrations, unchanged seed loading, aggregation/API, OpenAPI contract, SQL Server-backed tests, README and full-stack smoke evidence.
- Relay Frontend: Angular SPA, API consumption, persisted state, accessibility, and focused frontend tests.
- Relay Reviewer: independent review at each checkpoint; review is not an implementation task.

## Review Checkpoints
| After Tasks | Scope | Reason | Required Validation |
|-------------|-------|--------|---------------------|
| 1 | Schema, migration, seed loader, and SQL Server test fixture | Migration and data fidelity are high risk; block dependent API work on a bad import. | Check migration/schema parity, untouched seed, 20/12,626 counts, migration and LocalDB test results. |
| 2 | Aggregation, timezone and threshold logic, input validation, API response shape, and OpenAPI snapshot | Queries, user input, serialization, and the cross-stack API contract are high risk. Reviewer must pass the contract before frontend work begins. | Backend build and unit/SQL Server integration results; compare contract snapshot with served development OpenAPI and example seeded responses. |
| 3a | Displayed metric/week values on default load, changes, and persisted reload | User-controlled input and persisted state are high risk; check visible DOM values, not just stored state. | Frontend tests/build and live browser selection/reload assertions for both controls and summary data. |
| 3b | Focus retention through metric/week loading and response | Keyboard accessibility is high risk; independently review focus with real keyboard interaction. | Frontend tests/build, DOM active-element test and live browser keyboard/focus check for both controls. |
| 3 | Full SPA data consumption, table ordering, browser persistence, and accessible states after 3a/3b pass | Original blocked checkpoint must be rerun before task 3 can be Done. | Frontend test/build results and live reload, keyboard, quiet-location, empty and error-state checks against the reviewed contract. |
| 4 | README and fresh migration/seed/API/SPA workflow | Final independent review before completion. | Repeat backend/frontend required tests; verify fresh setup and full-stack smoke evidence plus documentation. |

## Risks
- .NET 10 SDK, Node/npm, LocalDB, and a running SQL Server service were observed locally on 2026-09-29; Docker was not found. Validate the exact connection string and installed `dotnet ef` tool at implementation time. Do not replace SQL Server integration with EF InMemory or SQLite. No database admin credentials should enter source or logs.
- UTC timestamps and IANA timezones require explicit conversion on Windows; test DST and boundary weeks using account-local half-open intervals before grouping. Ensure EF translates the bounded aggregation to SQL Server; do not pull all events to the SPA or client memory.
- Treat earliest/latest seed timestamps as coverage bounds, not assumed zero outside them. Seed only a freshly migrated database; avoid duplicate-key imports. Tests may use isolated fixture rows but must not alter the supplied seed dataset.
- The frontend cannot infer contract models. Backend supplies the development OpenAPI URL and snapshot path plus contract-change summary to Architect; Reviewer checks both before Architect delegates task 3. Generated build outputs are not deliverables.
- The endpoint uses a fixed trusted account; validate all week/type parameters and prevent accidental cross-account queries. Show only descriptive volume labels, never business-good/bad claims.
- The blocked frontend review found select values that contradict loaded data and focus loss while loading. Preserve the existing application code (including user edits) and let 3a and 3b address those findings in order; do not claim task 3 complete until both narrow checkpoints and the original checkpoint 3 pass.

## Validation Strategy
- After the first substantive edit in each specialist task, run the cheapest focused build/test for that slice; rerun the task's required commands after the final edit. Architect records observed results, not anticipated results.
- Task 1: apply the migration to a fresh `Relay` SQL Server database, load `seed/seed.sql` with `sqlcmd -b` once, confirm counts and FK integrity; use ephemeral LocalDB databases for tests. Task 2: run seeded SQL Server aggregation checks, OpenAPI consistency check, and backend tests. Task 3a: assert actual select DOM values after default, persisted, changed, and invalid-value loads; verify in a live browser. Task 3b: assert active element after changing each selector and receiving a response; verify real keyboard focus in a live browser. After both narrow reviews pass, rerun the original task 3 review including reload/quiet-location/empty-week checks. Task 4: repeat commands and verify an end-to-end request/UI on the seeded database.
- If LocalDB or SQL Server setup fails in practice, mark the task Blocked with the exact failure and request a user decision; do not silently substitute another database or claim unrun integration tests passed.

## Definition of Done
- [x] All tasks completed and required validation passed
- [x] Every planned review checkpoint passed
- [x] AI log is current and applicable documentation is updated
- [x] No unresolved high-severity findings

## Approval
Approved by: User (explicit reply: "Approve plan", revised plan)
Approved on: 2026-09-30