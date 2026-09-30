# DASH-247 Specification Session

Date: 2026-09-29
Tool and model: GitHub Copilot (model not reported), authoring specification only; no specialist or reviewer invoked.

## Available Human Messages (Verbatim)

Initial attachment message:

```text
<attachments>
<attachment id="file:TICKET.md" filePath="c:\\training_mg\\seed\\docs\\TICKET.md">
# DASH-247 — Help customers understand whether their recent activity is normal

Customers looking at their dashboard can't tell whether this week's numbers are good, bad, or typical for them. Product wants the dashboard to help a customer answer *"is this normal for us?"* at a glance, without exporting data or calling their account manager.

**Notes from product:**

- probably involves comparing against some baseline
- multi-location customers matter
- a customer admin should be able to look at this Monday morning and act on it

**Out of scope per product:** alerting/notifications, ML/forecasting.
</attachment>
<attachment id="seed" folderPath="c:\\training_mg\\seed">
The user attached the folder `c:\training_mg\seed` which has the following structure: ```
README.md
schema.sql
seed.sql
docs/
	PRODUCT_BACKGROUND.md
	TICKET.md
```
</attachment>

</attachments>
```

Ticket intake message:

```text
Ok let's start, this is the ticket the I have assigned:

Product background

Relay is a fictional B2B SaaS that helps service businesses track inbound customer activity — calls, leads, appointments — across their locations. Customers range from single-site shops to groups with 15+ locations. Each customer gets a reporting dashboard: today it shows raw totals per location and not much else.

Two things the team keeps hearing:
Account managers say customers ask "is this number normal for us?" and can't answer it from the dashboard.
The support team says customers with multiple locations struggle to spot which location needs attention.
The team works spec-driven and AI-first: engineers get tickets like the one below, build a plan, and implement with AI agents by default.

The ticket is this #file:TICKET.md 

The ticket is deliberately light — that's realistic, not an oversight. Deciding what it actually means (what "normal" is, what window, what view) is part of the exercise. Your interpretation and scoping decisions are evaluated criteria, not just tolerated variance.

every submission must contain this skeleton:
Backend: at least one API endpoint that performs real aggregation over the seed data (not pass-through queries), serving your dashboard feature.
Frontend: an SPA view that consumes it, with at least one piece of user-controlled input (filter, date range, location selector, toggle — your call) whose state survives a page reload.
Tests that run, with a one-line note in the README on how to run them.
A relational database with a real schema and migrations (your stack's standard tooling), loaded from the provided seed data.
Stack (required): build this in .NET 8+ (C#) on the backend and Angular on the frontend. Use SQL server por the database.

Tell us in the README about the notable choices you made within the stack (ORM vs. raw SQL, state management approach, etc.) and why.
Don't invent your own dataset — use the #file:seed  seed data provided so your time goes into the feature, not data modeling. Handle the unglamorous parts of real data honestly: empty ranges, odd values, aggregate correctness.
Seed data
Schema + seed dataset (two tables:  and ) are provided in a starter repository (attached).

Explicitly out of scope
Skip these so they don't eat your budget. We won't penalize their absence:
Auth / login — assume a single trusted customer admin; a hardcoded identity is fine.
Alerting / notifications and ML / forecasting — per the ticket.
Production infra — no Kubernetes or CI required. Local run is fine.
Visual polish — function over form. Unstyled-but-clear beats pretty-but-broken.



```

## Available Agent Messages (Verbatim)

```text
I’ll start DASH-247 at the specification gate. I’ll read the supplied seed and product context, check the repository templates, then draft the product decisions that need your confirmation before implementation.

The supplied schema confirms UTC event timestamps, an account timezone, and location names stored on events. I’m checking the seed’s date span and value patterns now so the draft can distinguish supported behavior from assumptions, especially for a Monday-morning comparison.

The seed has 12,626 events from February 1 through July 27, 2026, so a “current week” dashboard would be empty today. I’ll draft a historical-data fallback, define the weekly baseline and location comparison explicitly, and leave those product judgments open for the required Grill Me discussion.

The draft now spells out the comparison math, missing-history behavior, and the snapshot freshness warning; a focused check confirms it remains Draft. I’ll record the available conversation and the seed inspection as evidence, then hand the draft to you for the mandatory Grill Me gate.
```

## Evidence and Decisions

- Read only the supplied ticket, product background, seed README/schema/sample, and repository spec/plan and AI-log templates. No existing DASH-247 spec, plan, or TODO entry found.
- Read-only seed inspection observed 12,626 events, earliest UTC date 2026-02-01 and latest UTC date 2026-07-27. Did not change supplied data.
- Authored `docs/specs/DASH-247.md` in Draft; proposed a completed local week, four-week baseline, descriptive 20% band, fixed account, and historical snapshot label. These are **proposals**, not approvals. No rejected suggestions or engineer corrections yet.
- Focused draft validation checked all template sections and confirmed `Status: Draft`; passed. No application code, migrations, plan approval, subagent handoff, or application tests yet.

## Reflection

The supplied snapshot is historical relative to today's date. Product interpretation and the incomplete-week treatment require a real user decision through Grill Me before approving a specification.

## Grill Me Interview (Available Messages, Verbatim)

Assistant response before interview:

````text
DASH-247 is at the **specification gate**. I drafted the [specification](docs/specs/DASH-247.md) and recorded the [intake evidence](docs/ai-log/2026-09-29-spec-session.md). The draft proposes a completed-week view, a four-week baseline, and location comparisons. It also flags that the supplied data ends July 27, 2026, so the dashboard must not present it as current activity. The draft passed its section check and remains unapproved; no application code has been started.

**Next action:** Run `/grill-me` for DASH-247. We’ll use that interview to settle the proposed product choices before I present the specification for approval.
````

User interview invocation (prompt attachment contained the Grill Me instructions):

````text
Follow instructions in #prompt:SKILL.md with these arguments: for DASH-247
````

Assistant round 1:

````text
For DASH-247, the first decisions are what “normal” describes, which week the admin sees first, and how locations appear. The baseline and edge-case questions depend on these answers.

**Q1 - Meaning of normal:** Should this release compare event counts for calls, leads, and appointments, or also judge outcomes and call duration?

Recommended: Compare each event type’s count separately. The seed’s nullable outcomes and durations do not support a reliable quality judgment.

**Q2 - First week shown:** The supplied events end on July 27, 2026. Should the dashboard open on the latest completed week in the data, or on the current, likely empty week?

Recommended: Open on the latest completed week in the data and label it clearly as historical.

**Q3 - Location view:** Should the admin see all locations alongside the account total, or select one location at a time?

Recommended: Show an account summary and an all-location comparison table so a multi-location admin can spot where to investigate.

Please answer Q1–Q3. I’ll then ask the next round based on those decisions.
````

User round 1:

````text
Q1 - Compare each event type’s count separately.
Q2 - Open on the latest completed week in the data and label it clearly as historical.
Q3 - Show an account summary and an all-location comparison table so a multi-location admin can spot where to investigate.
````

Assistant round 2:

````text
Q1–Q3 are settled for the interview: separate event counts, the latest completed week in the data as the historical default, and an account summary with all locations visible. The next questions define the comparison.

**Q4 - Baseline:** What should a selected week be compared with?

Recommended: The average of the four immediately preceding complete weeks, calculated separately for each event type and location. Include weeks with zero events when history covers them.

**Q5 - “Typical” label:** What change is large enough to flag as above or below typical?

Recommended: Require both a change greater than 20% and a difference of at least 3 events. Show the counts and difference either way; the minimum avoids flagging a change from 1 to 2 as unusual.

**Q6 - Controls:** What should the admin be able to change?

Recommended: Let them select the event type and a completed week, and retain both selections after reload. Keep the account fixed to one trusted admin for this exercise.

Please answer Q4–Q6; I’ll use those answers to ask about sparse history and zero baselines.
````

User round 2:

````text
Q4 -The average of the four immediately preceding complete weeks, calculated separately for each event type and location. Include weeks with zero events when history covers them.
Q5 - use recommended but make 25 % instead of 20 
Q6 - Let them select the event type and a completed week, and retain both selections after reload. Keep the account fixed to one trusted admin for this exercise.
````

Assistant round 3:

````text
Q4–Q6 are settled for the interview. The flag will require **both** a change greater than 25% and a difference of at least 3 events. These are the remaining decisions about gaps and how to read the location table.

**Q7 - Limited history:** If a selected week has fewer than four fully covered prior weeks, should we calculate a shorter average or withhold the comparison?

Recommended: Show the selected week’s count and “insufficient history.” Do not treat weeks before the dataset begins as zero.

**Q8 - Zero baseline:** If all four prior weeks average zero, how should the selected week appear?

Recommended: Show “no prior activity,” the current count, and the absolute difference, but no percentage or typicality label. A percentage change from zero is undefined.

**Q9 - Quiet locations:** Should a location with no events in the selected week still appear?

Recommended: Yes, if it has events in the comparison period. This lets the admin spot a location that went quiet. The schema cannot identify locations that have never had an event.

**Q10 - Location priority:** How should the table help the admin choose where to look first?

Recommended: Put measurable below-typical locations first, ordered by the largest count shortfall. Keep “below typical” descriptive; lower volume does not necessarily mean poor performance.

Please answer Q7–Q10.
````

User round 3:

````text
Q7 - Show the selected week’s count and “insufficient history.” Do not treat weeks before the dataset begins as zero.
Q8 - Recommended solution
Q9 - Yes
Q10 - Put measurable below-typical locations first, ordered by the largest count shortfall. Keep “below typical” descriptive; lower volume does not necessarily mean poor performance.
````

Assistant confirmation request:

````text
That settles the design tree for DASH-247. The dashboard will compare each event type’s count for a selected completed local week with the average of the four prior complete weeks. It will flag a change only when it is **greater than 25% and at least 3 events**. It will show insufficient history and zero baselines explicitly, retain quiet locations, and put the largest measurable below-typical location shortfalls first. “Below typical” describes volume, not performance.

Please confirm **“Interview complete”** if that matches your understanding, or correct anything I’ve missed. I’ll update the draft specification only after that confirmation.
````

User confirmation:

````text
Interview complete
````

Agent progress message after confirmation:

````text
The interview is complete. I’ll fold your decisions into the draft specification, especially the 25% and 3-event rule, then verify the document and record the interview before asking for the separate specification approval.
````

Agent progress message before logging:

````text
The revised draft passed the focused check and still says Draft. I’ll append the interview exchanges to the AI log, then present the complete specification for your explicit approval.
````

## Post-Interview Evidence

- Accepted Q1-Q4, Q6-Q10 recommendations after user confirmation. Redirected Q5 from 20% to 25% at the user's request; revised threshold is strictly greater than 25% plus a minimum 3-event difference.
- Updated the draft specification after `Interview complete`. Focused text validation confirmed the 25% and 3-event criteria, no stale 20% rule, and `Status: Draft`; passed. No plan or application changes and no specialist handoff.
- The interview is complete; **specification approval is still pending** and must be an explicit `Approve specification` response to the presented complete draft.

## Specification Approval and Plan Draft

Assistant message presenting the complete specification (verbatim):

````text
**DASH-247 Specification**
[Full draft](docs/specs/DASH-247.md) · Status: **Draft** · Last updated: 2026-09-29

**Problem and User**
A trusted customer admin needs to tell whether weekly inbound activity is unusual for their account and which locations warrant investigation. The supplied data ends in July 2026; the dashboard must not present it as live September activity.

**Proposed Behavior**
- Show a selected, completed Monday–Sunday week in the account’s IANA timezone. Default to the last completed local week before the dataset’s latest event. Offer completed weeks within the dataset’s coverage, including early weeks without enough baseline history. Show the selected dates and latest event date, clearly labeled as historical.
- Compare each event type’s count separately: calls, leads, and appointments. The baseline is the mean of the four immediately preceding complete local weeks, calculated separately for the account and each location. Include zero-event weeks when the dataset fully covers them.
- Show the count, baseline average to one decimal, signed count difference, and percentage difference. Label a result “below typical” or “above typical” only when the *unrounded* difference is at least 3 events **and** the *unrounded* percentage difference is greater than 25%. Otherwise label it “typical.” These labels describe volume, not business performance.
- Provide event-type and completed-week selectors that survive reload. Show an account summary and all observed locations, including a location with baseline activity but none in the selected week. Put below-typical locations first, ordered by largest count shortfall; break ties by location name. Put rows without a baseline last.
- Assume one trusted admin for account ID 1, with no cross-account access. The .NET API performs the aggregation; the Angular SPA consumes its results rather than aggregating raw events.

**Decisions and Assumptions**
The completed Grill Me interview confirmed the separate counts, four-week baseline, 25% plus 3-event rule, historical default, persistent controls, all-location view, and descriptive labels. These decisions still require specification approval. The seed contains 20 accounts and 12,626 UTC events dated February 1 through July 27, 2026. It remains unchanged. Outcomes and durations do not affect event counts.

**Edge Cases**
- Convert local week boundaries to half-open UTC intervals, including across daylight-saving changes.
- An empty selected week has a zero count; a previously active but now quiet location remains visible. The schema cannot identify a location that has never had an event.
- Count an unobserved prior week as zero only if its *entire* local week falls within dataset coverage. With fewer than four covered prior weeks, show the selected count and “insufficient history,” with no baseline, difference, percentage, or typicality label.
- For a valid zero baseline, show the count and signed difference with “no prior activity,” but no percentage or typicality label, even when the current count is zero.
- Reject malformed or out-of-range API filters. Reset invalid saved UI selections to defaults. Nullable or unusual outcomes and durations do not change counts; unknown event types are excluded. Show explicit loading, empty, and failure states.

**Acceptance Criteria**
- [ ] A .NET 8+ API uses SQL Server, EF Core migrations, and the unchanged supplied seed to return backend-aggregated counts, baselines, differences, and labels.
- [ ] The Angular SPA shows the account and location comparison, historical dates and freshness, and the largest measurable shortfalls without an export.
- [ ] Metric and week selections survive reload; invalid selections recover.
- [ ] Tests cover local/UTC and DST boundaries, complete and zero-event weeks, insufficient history, zero baselines, both threshold boundaries, location sorting, event types, invalid input, API consumption, and saved selections.
- [ ] The README gives local migration, seed-loading, start, and test commands, including a one-line test instruction, and explains notable stack choices.

**Non-Goals**
Authentication, cross-account browsing, alerts, forecasting, production infrastructure, visual polish, changes to the supplied dataset, and quality scores derived from outcomes or duration.

**Open Questions**
None remain from the interview. Approval is still pending.

Reply exactly **`Approve specification`** to approve this draft, or provide feedback. No plan or application-code work starts before approval.
````

User approval message (verbatim):

````text
Approve specification
````

Agent progress messages after approval (verbatim):

````text
Your exact approval completes the specification gate. I’ll record it in the spec, check the local tooling needed for realistic validation commands, then draft the implementation plan and its review checkpoints.

The specification approval is recorded and verified. I’m checking the backend/frontend working rules and which local commands are available so the draft plan names concrete artifacts and checks without claiming they have run.

The required .NET and Node tooling is installed, while Docker is absent. I’ll check whether LocalDB is available; that determines whether the plan can require SQL Server-backed integration tests locally or must state an external SQL Server prerequisite.

LocalDB and a running SQL Server service are available, so the plan can require real SQL Server migration and aggregation checks. I’ll draft four ordered tasks: schema and seed load, aggregation API and OpenAPI contract, Angular view, then README and end-to-end checks, with review gates after each risk-bearing stage.

The plan’s gate check passed. I caught one mismatch with the backend rules while reviewing it: the machine has a stable .NET 10 SDK, so the new backend should target .NET 10 rather than the .NET 9 I first wrote. I’ll correct that and rerun the focused check.

The draft plan now targets .NET 10 and has passed the follow-up check. I’ll log the approval and planning evidence, then present the full plan for its own approval. No task will be delegated while the plan is Draft.
````

Evidence and decisions:

- User replied exactly `Approve specification`; Architect set spec Approved with user and date 2026-09-29, then verified the record. The earlier statement in this log that approval was pending describes the earlier gate only.
- Local inspection found .NET SDKs 6.0.428, 9.0.121, 9.0.317, 10.0.401; Node v24.9.0; npm 11.6.1; sqlcmd and SqlLocalDB available; MSSQLSERVER running; Docker unavailable. These are availability observations, not test results.
- Drafted `docs/plans/DASH-247.md`, with four tasks and reviews after each risk-bearing stage. Initially proposed .NET 9, then redirected to .NET 10 to match the installed stable SDK rule. Focused plan gate and .NET 10 correction checks passed; plan remains Draft. No `docs/TODO.md` entry or delegation before plan approval.

## Plan Approval and Checkpoint 1

User plan approval message (verbatim):

````text
Approve plan
````

The user approved the presented plan exactly; Architect set plan Approved with requester and date 2026-09-29, verified both approval statuses, created the four Pending tasks in `docs/TODO.md`, then moved task 1 In Progress before delegating. Relay Backend was delegated only task 1 with approved sources, acceptance criteria, files and required validation. The specialist created backend API/migration/test/setup files but returned no message; no specialist-side command log is available.

Architect's observed task 1 commands and results:

- Relative `dotnet build backend/Relay.Api/Relay.Api.csproj` initially failed because the shared terminal cwd had moved to `C:\training_mg\backend`; running it from `C:\training_mg` passed.
- `dotnet test backend/Relay.Tests/Relay.Tests.csproj` from workspace root passed 3/3 LocalDB tests.
- `backend/scripts/setup-local-db.ps1 -ServerInstance '.' -DatabaseName RelayDash247Check_e0277e06` ran EF migration and the unchanged `seed/seed.sql` via `sqlcmd` on a fresh isolated database, passing 20 accounts, 12,626 events and 0 orphaned FKs. This is the planned migration/import workflow on a safe unique DB, not a run of the plan's default `Relay` database command.
- Independent Relay Reviewer returned `PASSED` for checkpoint 1; reviewer independently built and tested (3/3), checked `has-pending-model-changes` (none), inspected seed/migration parity, and queried counts/nulls/FKs read-only. Reviewer did not rerun the fresh import but confirmed its result. Task 1 moved Review -> Done only after review passed.

Review suggestions: Accepted for later hardening: constrain operator-supplied database names and check SQL drop exit code in setup script; clarify `dotnet ef` working directory in README (manifest lives in `backend/`); strengthen FK test if time permits and exclude generated output from deliverables. None was a blocker for checkpoint 1, so no unapproved task remediation was started. Verified lesson: the manifest location controls the `dotnet ef` working directory. No engineer correction beyond the user's threshold change was reported.

## Checkpoint 2: API Contract and Remediation

- Task 2 delegated to Relay Backend after checkpoint 1 PASSED. Specialist added bounded EF Core aggregation, UTC/local-week comparison, tests and `docs/contracts/DASH-247.openapi.json`. Specialist and Architect each ran backend build and tests: 25/25 passed. Specialist observed a live seeded default response and served OpenAPI matching snapshot.
- First Relay Reviewer check returned **BLOCKED**, not a pass: earliest selectable Jan 26 was only partially covered (account's first event Sunday Feb 1), yet API returned 200. Reviewer reproduced with a live GET, matched counts independently to SQL and specified Feb 2 as the first full selectable week. Task 2 moved Review -> Blocked, cycle 1, while task 3 stayed Pending.
- Architect returned task 2 In Progress for focused backend remediation. Specialist changed the earliest-week boundary helper and added five tests including midpoint, exact Monday, and omitted-week default. Specialist observed live Jan 26 -> 400, Feb 2 -> 200, default Jul 20 -> 200 on isolated seeded SQL Server; reported OpenAPI shape unchanged (server port varies). Architect independently reran build and tests, 30/30 passed.
- Same Relay Reviewer checkpoint re-run returned **PASSED**: independently verified live default, dates and validation, seeded SQL counts, 30/30 tests and served OpenAPI matching snapshot except server port. Task 2 moved Review -> Done; task 3 now has its reviewed contract. Nonblocking review notes remain: OpenAPI metric schema is permissive, 404 media type differs from served response, and port in snapshot is incidental; frontend should use the actual runtime URL rather than snapshot server field. No contract expansion was approved or needed for these notes.
- Accepted verified lesson on excluding partial first local weeks. Rejected lesson candidate on `Sum(predicate ? 1 : 0)` as insufficiently general for EF provider versions; local query translation is validated by SQL Server integration tests, so no global rule is persisted.

## Checkpoint 3: Frontend Blocked

- Task 3 delegated to Relay Frontend with the approved spec/plan, reviewed OpenAPI snapshot and commands. First invocation returned only `Now the app.html template:` and left the Angular starter template. Architect's `npm run build --prefix frontend` failed on missing `title()`; `npm test --prefix frontend -- --watch=false` unexpectedly entered watch mode and 2/2 starter tests failed for missing HttpClient provider. Architect stopped the watcher, marked task Blocked, then reopened the same task for targeted remediation. This was task 3 failed validation cycle 1.
- Relay Frontend completed dashboard markup, service/component tests and non-watching test script. Architect independently observed Angular tests 20/20 and production build passing. Specialist observed direct and proxied live API responses matching against the seeded SQL Server; task moved to Review.
- Relay Reviewer independently observed tests 20/20 and build pass, then **BLOCKED** checkpoint 3 based on live headless Chrome: metric and week selects display their first options rather than the current/persisted values after load/reload; disabling the fieldset while fetching sends keyboard focus to BODY and does not restore it. Reviewer specified binding options or using Angular forms and keeping controls enabled or restoring focus, plus DOM/focus regression tests. This is task 3 failed review cycle 2. Nonblocking notes: mobile table horizontal overflow, failed-selection wording, document title, and baseline method visibility.
- Per the approved workflow's two-cycle stop gate, Architect marked task 3 Blocked and task 4 Pending; asks the user whether to revise the plan, split the task, or stop it. No new remediation or reviewer pass is claimed. Do not persist the proposed Angular `<select>` lesson until a fix has passed tests and review.

## Plan Revision Requested (2026-09-30)

User message (verbatim):

````text
yes lets splitting it so selection display and keyboard focus each recive a targeted test and review 
````

- Accepted the user's choice to split the blocked frontend work; no change to the approved specification. Read the current `frontend/src/app/app.html` after the environment reported intervening edits and did not alter it. Read the controls and nearby tests to confirm both reviewer findings remain present.
- Returned `docs/plans/DASH-247.md` to Draft. Proposed task 3a for selection DOM/persistence, task 3b for focus retention, independent reviews after each, then a rerun of the original checkpoint 3. Tasks 1 and 2 remain Done; task 3 remains Blocked; task 4 remains Pending. Proposed 3a/3b are not entered as approved task state until the revised plan is approved.
- Focused gate validation passed: revised plan Draft with both checkpoints, governing specification still Approved. No specialist work or frontend file change was delegated under the draft revision. User approval of the complete revised plan remains pending.

## Revised Plan Approval (2026-09-30)

User clarification message (verbatim):

````text
before approving the plan expllain to me what task 3 exactly is, why is blocked and what would you do to unblocked it 
````

Architect explained the original frontend task, both browser findings, and the proposed 3a/3b sequence without changing the plan. The user's next message was not the exact approval phrase:

````text
ok the plan  is approved then Approve plan
````

Architect did not approve that response because it contained extra words; the plan remained Draft. User then replied (verbatim):

````text
Approve plan
````

- Accepted the exact revised-plan approval on 2026-09-30; recorded Approved status, approver and date, then verified both 3a and 3b remain in the plan. No ambiguous approval was inferred.
- Updated `docs/TODO.md`: 3a and 3b Pending with their own checks, original task 3 Blocked pending their pass and repeat checkpoint, task 4 Pending. Prior passed backend reviews remain Done.

## Checkpoint 3a: Selection Display (2026-09-30)

- Delegated only approved task 3a to Relay Frontend after marking it In Progress; current `app.html` had been read and was preserved. Specialist bound option selection when async options render and added four DOM tests for default, changes, persisted Leads/June 1, and invalid week fallback. Specialist reported 24/24 Chrome tests and successful build, but lacked live browser automation; Architect marked 3a Blocked for missing required live check.
- Architect independently ran `npm test --prefix frontend -- --watch=false` (24/24) and `npm run build --prefix frontend` (passed). Using existing temp `puppeteer-core` with live backend on 5005 and SPA on 4200, Architect observed select values and heading: Calls/Jul 20 by default; Leads/Jun 1 after changing both; Leads/Jun 1 after reload. No application files were changed by Architect.
- Task 3a moved Blocked -> Review when live validation became available. Relay Reviewer independently reran tests/build and live browser selection/fallback checks, compared served OpenAPI shape (unchanged except port), and returned **PASSED**; 3a moved Review -> Done. Remaining nonblocking notes: test coverage for changing the week through the DOM, and pre-existing error-state stale-data wording for the full checkpoint 3 review. Focus remains in task 3b.
- Accepted and recorded the verified lesson on visible native select values when options are created asynchronously.

## Checkpoint 3b: Keyboard Focus (2026-09-30)

- Delegated 3b to Relay Frontend after 3a PASSED. Specialist kept selects enabled during requests, removed unused disabled input and added three active-element DOM tests. Specialist reported 27/27 tests and successful build but lacked live keyboard automation; Architect independently reran tests/build and used headless Chrome to verify ArrowDown metric -> Leads and Tab/ArrowUp week -> Jul 13 while each control remained focused and enabled.
- Relay Reviewer independently returned **PASSED** for checkpoint 3b after testing delayed and out-of-order live responses, persistent focus, updating announcement, stale-response guard and 3a selection persistence. Task 3b moved Review -> Done; original checkpoint 3 remains to be repeated.
- Nonblocking reviewer feedback: rapid-change unit test does not prove stale-response guard, updating-status assertion is missing, and fixture cleanup should happen even if a test fails. Reviewer verified these behaviors live; no unapproved follow-up code change was made. Deferred lesson candidate on stale-response tests until such a test is improved and validated.

## Full Frontend Checkpoint 3 (2026-09-30)

- After 3a and 3b passed, original task 3 returned to Review. Relay Reviewer independently ran frontend tests 27/27 and build, plus live Chrome checks of default, freshness, quiet rows, order, loading, empty and saved values. Reviewer returned **BLOCKED** (revised-plan cycle 1): failed metric/week requests left new controls and stored selection beside old response data and a misleading table caption. Mobile overflow and brief baseline copy were noted but not blocking. Task 3 moved Review -> Blocked; task 4 stayed Pending.
- Architect delegated a focused same-task failure-state correction to Relay Frontend after moving task 3 In Progress. Specialist rolled controls/storage back to the last successful response on failure, preserving attempted filters for Retry, and added tests. Architect independently ran frontend tests 34/34 and build; live Chrome with network-aborted metric and HTTP 500 week GET confirmed consistent controls/heading/storage/focus and Retry to the attempted choice.
- Same full checkpoint 3 re-review returned **PASSED**. Reviewer independently verified 34/34 tests, build, default/reload/keyboard/ordering/quiet/empty cases, plus rollback and Retry under network, 400, 404 and 500 errors for both controls. Task 3 moved Review -> Done; task 4 may start. Nonblocking notes: HTTP 500 error wording incorrectly says service unreachable, one 400 fallback says 'saved week' for a clicked option, mobile table overflows horizontally, Retry button focus drops when it disappears. These remain residual risks, not fabricated successes.
- Accepted verified lesson on failed filter rollback and preserving Retry intent. No changes to approved product scope or API contract were required.

## Final Checkpoint 4 and Delivery (2026-09-30)

- Task 4 delegated to Relay Backend after task 3 PASSED. Specialist updated README local setup/start/test instructions and stack decisions, hardened the setup script's database name validation and drop exit check, and added root ignore rules for generated build outputs. Specialist loaded the unchanged seed in isolated SQL Server DB `RelayDash247Task4b_7353c799` (20 accounts, 12,626 events, 0 orphaned FKs). Architect independently ran backend tests 30/30, frontend tests 34/34, both builds, read-only seed counts, and live Chrome through the SPA proxy; default historical view showed six locations, and Leads/Jun 1 persisted after reload.
- Relay Reviewer initially returned **BLOCKED** at checkpoint 4: README `cd backend` broke later root-relative commands, and existing root-generated API logs were not ignored. Architect moved task 4 Blocked -> In Progress and delegated focused documentation/ignore remediation. Specialist changed root-level EF tool restore, script example and `*.log` ignore; did not remove or edit generated logs. Architect then found that the manual README `dotnet ef database update` example without API project flags also failed (`No project was found`), and sent the same specialist a correction before re-review. Specialist added `--project Relay.Api --startup-project Relay.Api`.
- Architect verified root tool restore, migration listing with API project flags and cwd restoration, post-remediation fresh DB `RelayDash247Task4Cyc1_41989339` counts 20/12626/0, final backend tests 30/30, frontend tests 34/34 and both builds. Task 4 returned to Review. Relay Reviewer repeated the **same** final checkpoint, followed README commands in order using a new isolated DB (20/12626/0), tested API/proxy on alternate ports, ran tests/builds, confirmed `*.log` covers existing logs, and returned **PASSED**. No database was dropped; temporary review DBs remain. Task 4 moved Review -> Done; all planned reviews passed.
- Remaining nonblocking notes: PowerShell's npm shim warns on the redundant `--watch=false` passthrough although the package test script runs once; the frontend has a horizontally overflowing location table on narrow phones, sparse baseline explanation, and imprecise 500/400 wording. Browser tests were Chrome only; empty account-wide week was mocked because none exists for account 1 in the seed. These were not hidden or marked as tested beyond observed evidence.
- Accepted verified lesson on shell working directory (existing dotnet-ef lesson) and PowerShell/npm argument forwarding. Rejected specialist's standing-dev-server lesson as context-specific local coordination rather than a durable product correction; preserving existing servers was still the right action here.