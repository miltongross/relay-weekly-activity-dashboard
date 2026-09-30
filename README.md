# Quick Start

Run these commands from the repository root in PowerShell. You need .NET 10, Node.js/npm,
`sqlcmd`, and a running local SQL Server instance (`.`) with Windows integrated access.
Backend integration tests also need SQL Server LocalDB; Angular browser tests need Chrome.

In terminal 1, create a **new** database, apply the EF Core migration, load the supplied seed,
and start the API on `http://localhost:5005`:

```powershell
dotnet tool restore --tool-manifest backend/dotnet-tools.json
$dbName = 'RelayQuickStart_' + [guid]::NewGuid().ToString('N').Substring(0,8)
./backend/scripts/setup-local-db.ps1 -DatabaseName $dbName
$env:ConnectionStrings__RelayDatabase = "Data Source=.;Initial Catalog=$dbName;Integrated Security=True;TrustServerCertificate=True;Encrypt=False"
dotnet run --project backend/Relay.Api
```

In terminal 2, install the frontend packages and start Angular (proxying `/api` to port 5005):

```powershell
npm ci --prefix frontend
npm start --prefix frontend
```

Open **http://localhost:4200**. In separate terminals at the repository root, run the tests:

```powershell
dotnet test backend/Relay.Tests/Relay.Tests.csproj
npm test --prefix frontend
```

The setup script loads `seed/seed.sql` only into a fresh database; it does not change the supplied
seed. Do not use `-Force` on a database you need to keep. The API connection string defaults to
the `Relay` database if `ConnectionStrings__RelayDatabase` is not set in its terminal.

## DASH-247: Weekly Activity Dashboard

A read-only dashboard for one trusted account (account id 1). It shows a selected completed
week's activity counts against a four-week baseline, for the account and each location. Backend:
.NET 10 ASP.NET Core minimal API, EF Core, SQL Server. Frontend: Angular 20 standalone SPA.

This answers "is this volume typical for us?" for a historical snapshot, not whether activity
is good or bad. The supplied data has 20 accounts and 12,626 events from February through July
2026; this view is fixed to account 1. The default week is the last complete account-local week
before the latest recorded event, not the current calendar week. The page names the latest
observed local date and marks the data as historical.

### Comparison rules

- Select calls, leads, or appointments independently and a completed Monday-Sunday week in the
  account's IANA timezone. Convert each local boundary to UTC before counting events in half-open
  intervals. The first selectable week must itself be fully covered by the observed data.
- For the account and each observed location, compare the actual count with the mean of the four
  immediately prior **fully covered** local weeks. Covered weeks with no events count as zero.
  Show an average to one decimal, signed count difference and percent difference.
- Only label a difference "below typical" or "above typical" when the **unrounded** absolute
  difference is at least 3 events **and** the **unrounded** percent difference is strictly greater
  than 25%. Otherwise it is "typical". Insufficient four-week history has no baseline or difference;
  a valid zero baseline shows "no prior activity" and no percent or typicality label.
- Show all locations ever observed for account 1, even if a location is quiet in the selected
  week. Put below-typical locations first by largest count shortfall, then by location name;
  baseline-unavailable rows sort last. Duration and outcome do not affect event counts.

The API is `GET /api/accounts/1/weekly-activity?metric=call_received&week=2026-06-01`;
`week` may be omitted to use the latest selectable week. Invalid metrics and malformed,
non-Monday or out-of-range dates return 400; a missing trusted account returns 404.
The [approved specification](docs/specs/DASH-247.md) owns the full rules.

### Prerequisites

- .NET SDK 10 (see `backend/Relay.Api/Relay.Api.csproj` for the target framework).
- Node.js and npm (see `frontend/package.json` for the Angular 20 toolchain).
- A running SQL Server instance reachable as the default local instance (`.`) for the app
  database, **and** SQL Server LocalDB (`(localdb)\MSSQLLocalDB`) for the backend integration
  tests. Both were used during development; Docker/Testcontainers is not part of this stack.
- `sqlcmd` on `PATH` (used by the setup script and seed loading).

### Database: migration and seed (fresh, isolated database)

All commands below run from the **repo root** (`training_mg/`). The EF Core local tool is pinned
by the manifest at `backend/dotnet-tools.json`. Restore it once, pointing at that manifest, so
`dotnet ef` resolves to the pinned version:

```powershell
dotnet tool restore --tool-manifest backend/dotnet-tools.json
```

Apply the migration and load the unchanged seed (`seed/schema.sql` via the migration,
`seed/seed.sql` via `sqlcmd`) into a **fresh** database with the setup script. The seed is
read-only: it is loaded once with plain `INSERT` statements, so re-running against a database
that already has rows fails on duplicate keys.

```powershell
./backend/scripts/setup-local-db.ps1 -DatabaseName "Relay"
```

- Defaults to server instance `.` and database `Relay`; pass `-DatabaseName` for an isolated
  database (letters, digits, underscore only) instead of touching an existing one.
- Refuses to run against a database that already has rows unless `-Force` is supplied; `-Force`
  drops and recreates only the **named target database**, never an unrelated database.
- Verifies row counts after loading: 20 accounts, 12,626 events, 0 orphaned foreign keys.

To point the API at a database other than the connection string in `backend/Relay.Api/appsettings.json`
(`Data Source=.;Initial Catalog=Relay;...`), set the same environment variable the script uses
before running the API:

```powershell
$env:ConnectionStrings__RelayDatabase = "Data Source=.;Initial Catalog=<YourDbName>;Integrated Security=True;TrustServerCertificate=True;Encrypt=False"
```

`dotnet ef` commands (for example `dotnet ef database update`) resolve the local tool manifest only
when the working directory is `backend/`. Run them from the repo root with `Push-Location`/
`Pop-Location` so the shell returns to the repo root afterward and the remaining root-relative
commands in this README keep working:

```powershell
Push-Location backend
dotnet ef database update --project Relay.Api --startup-project Relay.Api
Pop-Location
```

### Running the stack

Backend API (listens on `http://localhost:5005`, per `backend/Relay.Api/Properties/launchSettings.json`):

```powershell
dotnet run --project backend/Relay.Api
```

Frontend SPA (serves on `http://localhost:4200` and proxies `/api` to `http://localhost:5005`,
per `frontend/proxy.conf.json`):

```powershell
npm start --prefix frontend
```

Then open `http://localhost:4200`. Changing the metric or week selector persists the choice in
the browser's `localStorage` and survives a reload.

### Tests and build (one-line commands)

```powershell
dotnet test backend/Relay.Tests/Relay.Tests.csproj
```

```powershell
npm test --prefix frontend -- --watch=false
```

```powershell
npm run build --prefix frontend
```

### Stack choices

- **EF Core with the SQL Server provider, no raw SQL/Dapper.** Migrations track the seed schema,
  `AsNoTracking()` DTO projections keep reads bounded and provider-translated, and the grouped
  baseline aggregation runs in SQL Server rather than pulling raw events to the app.
- **Angular signals for UI state, RxJS only where Angular requires it (HTTP, `takeUntilDestroyed`),
  browser `localStorage` for persisted selection.** `DashboardStore` exposes signals the templates
  read directly; persisted values are re-validated on load so a malformed or stale entry falls back
  to the default instead of reaching the API.
- **Hand-typed TypeScript models mirroring the reviewed OpenAPI contract snapshot**
  (`docs/contracts/DASH-247.openapi.json`), not a generated client. The contract is small and
  backend-owned; keeping models manual keeps the frontend from silently drifting from an
  unreviewed schema change.

### Where the work lives

| Exercise requirement | Evidence and owner |
| --- | --- |
| Real backend aggregation, account isolation and read-only API | [Endpoint](backend/Relay.Api/Endpoints/WeeklyActivityEndpoints.cs), [bounded SQL Server grouping](backend/Relay.Api/Services/WeeklyActivityService.cs), [comparison calculator](backend/Relay.Api/Aggregation/MetricComparisonCalculator.cs) and [local-week conversion](backend/Relay.Api/Aggregation/LocalWeek.cs). The account id is fixed on the server. |
| Relational schema, migrations and supplied data | [EF model](backend/Relay.Api/Data/RelayDbContext.cs), [initial migration](backend/Relay.Api/Migrations/20260930044639_InitialCreate.cs), [setup script](backend/scripts/setup-local-db.ps1), and unchanged [schema](seed/schema.sql) and [seed](seed/seed.sql). Setup verifies 20 accounts, 12,626 events and no orphaned account keys. |
| Angular SPA, API consumption and reload-safe input | [Dashboard](frontend/src/app/app.html), [store](frontend/src/app/core/services/dashboard-store.service.ts), [selection storage](frontend/src/app/core/services/selection-storage.service.ts), [API client](frontend/src/app/core/services/weekly-activity.service.ts), and reviewed [OpenAPI snapshot](docs/contracts/DASH-247.openapi.json). Saved filters are checked on load; failed changes roll back visible controls and storage while Retry remembers the attempted choice. |
| Runnable tests and delivery checks | [Backend tests](backend/Relay.Tests/WeeklyActivityServiceTests.cs) and [migration tests](backend/Relay.Tests/RelayDbContextMigrationTests.cs) use SQL Server LocalDB; [Angular DOM tests](frontend/src/app/app.spec.ts) and [store tests](frontend/src/app/core/services/dashboard-store.service.spec.ts) run in Chrome. The [delivery record](docs/TODO.md) reports 30/30 backend and 34/34 frontend tests, builds, a fresh seed import and browser checks **at delivery**; these are historical results, not a claim of a new run. |

### Assumptions, tradeoffs and limits

- Account 1 represents one trusted admin. There is no authentication, account selector,
  authorization policy, or production infrastructure. These are approved non-goals, not
  features of the API. The fixed account id must not be reused as a security boundary.
- Dataset first/last event timestamps define observed coverage, not a guarantee of activity
  outside that range. Whole covered weeks with no events count as zero; a location never
  observed in the seed cannot be listed. Percent difference is undefined for a zero baseline.
- The snapshot is historical. The volume threshold is a product convention, not a statistically
  validated measure, alert or quality score. Do not interpret lower calls as worse outcomes.
- The table overflows horizontally on narrow phones. Review also noted imprecise 500/unreachable
  and 400/saved-week messages, and Retry focus loss when its button disappears. Browser checks
  covered Chrome, not a browser matrix; an account-wide empty week was mocked because the seed
  has none for account 1. These are deferred review notes, not claimed fixes.
- The reviewed OpenAPI snapshot has a permissive metric schema, a 404 media-type discrepancy,
  and a server port that can differ at runtime. The frontend uses the proxied endpoint rather
  than the snapshot server address; validate contract details before wider reuse.

### Open questions for a later decision

| Question and evidence | Suggested answer to evaluate | Decision owner |
| --- | --- | --- |
| **Open Question:** When should historical data be refreshed? The [seed](seed/seed.sql) is a fixed snapshot and the [dashboard](frontend/src/app/features/dashboard/dashboard-summary.component.html) labels it historical. | Keep snapshot-only behavior for this exercise; define ingestion and freshness targets before describing it as live. | Product and data engineering |
| **Open Question:** Does a 25% and 3-event volume change warrant business action? The [spec](docs/specs/DASH-247.md) calls it descriptive, not validated. | Keep the label neutral until account managers and customers validate it. | Product and customer stakeholders |
| **Open Question:** What changes before serving multiple customers or mobile-first use? The [endpoint](backend/Relay.Api/Endpoints/WeeklyActivityEndpoints.cs) fixes account 1 and the [review log](docs/ai-log/2026-09-29-spec-session.md) records narrow-screen overflow. | Add identity/account authorization and separately prioritize mobile table behavior before broader release. | Engineering and product/design |

### AI-assisted delivery record

The ticket and [product background](seed/docs/PRODUCT_BACKGROUND.md) were intentionally open-ended.
The [approved spec](docs/specs/DASH-247.md) and [revised approved plan](docs/plans/DASH-247.md)
were agreed before implementation. The required Grill Me interview changed the proposed 20%
threshold to **more than 25%** with at least 3 events. GitHub Copilot is named in the
[AI development log](docs/ai-log/2026-09-29-spec-session.md); the model is **not reported**.
That log preserves available human and agent messages, accepted and rejected suggestions,
delegation to Relay Backend/Frontend, independent Relay Reviewer checkpoints, failed reviews,
corrections and final validation. The [task record](docs/TODO.md) tracks the final state;
[verified lessons](docs/lessons/README.md) capture reusable corrections. There is no root
`PLAN.md` or `AI_LOG.md`: the corresponding records live under `docs/plans/` and `docs/ai-log/`.
No elapsed development time or unavailable agent transcript is inferred from these records.

### Agentic planning and decision process

I created the Relay agents for this exercise, each with a focused responsibility. I used
specification-driven development (SDD): Relay Architect gathered the ticket and seed facts,
owned the draft specification and plan, and coordinated approvals. I used `/grill-me` to test
assumptions against the ongoing conversation; it helped clarify the baseline, historical view,
and threshold before I approved the specification. Relay Backend and Relay Frontend then worked
on approved tasks, while Relay Reviewer independently checked their results at planned gates.

Each agent has model options configured for its role; some options are shared. I chose them to
fit planning, coding, or independent review, with the aim of improving accuracy, not as a measured
accuracy claim. Architect handed off a small, task-specific packet with the approved spec and
plan, relevant sources, expected output, and checks. This kept each agent's working context
focused and gave the next agent the evidence needed to continue.

The process puts inspection, validation planning, and human approval before significant coding.
Requirements and design choices could be corrected while they were still drafts. After the plan
was approved, failed checks sent work back for correction and review before dependent work moved
forward. The [AI development log](docs/ai-log/2026-09-29-spec-session.md) records those decisions
and checkpoints; approval of the plan did not mean the finished code was approved in advance.

After each coding handoff, I checked the reported work against the approved criteria: tests and
builds, SQL Server seed counts and API contract where relevant, and live browser behavior for the
SPA. Relay Reviewer repeated the planned checks independently. A failed check meant Blocked and
another correction and review, not Done; the [task record](docs/TODO.md) shows the final passes.

### Agent workflow for future tickets

Start work by giving **Relay Architect** a ticket plus the paths or attachments containing its requirements and reference material. Agents do not assume a ticket ID or source folder. Supplied seed and reference inputs remain read-only; application code and agentic artifacts belong at the workspace root.

1. Select **Relay Architect** in GitHub Copilot and provide the ticket details and source locations.
2. Run `/grill-me` for every draft specification. Complete the interview, incorporate its decisions, then reply `Approve specification` when the revised draft is ready.
3. Review the ticket-specific implementation plan and reply `Approve plan` when it is ready. No application code is written before both approvals.
4. Let Architect delegate approved tasks to **Relay Backend** and **Relay Frontend**, track their validation evidence, and manage contract handoffs.
5. **Relay Reviewer** independently checks the plan's risk-based checkpoints and final ticket state.

Workspace guidance lives in `.github/copilot-instructions.md`. All agents and skills live under `.github/`. Templates live in `docs/specs/`, `docs/plans/`, `docs/ai-log/`, and `docs/lessons/`.