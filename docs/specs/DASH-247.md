# DASH-247 Specification

Status: Approved
Owner: Relay Architect
Last updated: 2026-09-29

## Problem and User
A trusted customer admin needs to see whether weekly inbound activity is unusual for their own account and which locations warrant investigation. Raw totals alone do not provide a meaningful local comparison. The supplied snapshot ends in July 2026, so the dashboard must not imply it shows live September activity.

## Proposed Behavior
- Show a selected **completed Monday-Sunday week** in the account's IANA timezone. Default to the last completed local week before the latest event timestamp in the supplied dataset, not the machine's current week. Offer completed weeks within the dataset's coverage, including early weeks with insufficient baseline history. Show the selected dates and the dataset's latest event date in the account's timezone with a clear historical-data label.
- Use the mean of the four immediately preceding complete Monday-Sunday weeks as the per-metric baseline, separately for the account and for each location. Count `call_received`, `lead_created`, and `appointment_set` events independently; do not add them into a single funnel total. Include zero-count weeks in a valid four-week baseline.
- Show actual count, baseline average (one decimal), signed count difference, and percentage difference for the selected metric. Label a result "below typical" or "above typical" only when its unrounded absolute difference is at least 3 events **and** its unrounded percentage difference is greater than 25%; otherwise label it "typical". Display rounded numbers without using them to decide the label. These labels describe volume, not business success or failure.
- Give the admin a metric selector (calls, leads, appointments) and a completed-week selector; show an account summary and an all-location comparison table for the chosen metric, including locations with a baseline but zero activity in the selected week. Show below-typical locations first, sorted by largest count shortfall; use location name as a stable tie-breaker. Keep baseline-unavailable rows last. Persist the selected metric and week across reloads in browser storage, subject to validation against available options.
- Assume one trusted admin for one account (initially account ID 1); do not offer cross-account access. The backend performs the grouped aggregation for that account, selected week, and four comparison weeks; the SPA consumes that API rather than calculating aggregates from raw events.

## Decisions and Assumptions
- **Confirmed in Grill Me, awaiting specification approval:** Compare each event type's counts separately; use the four immediately preceding complete local weeks (including covered zero weeks). Flag only differences greater than 25% and at least 3 events. This is a descriptive usability rule, not a statistically validated threshold or an alert.
- **Confirmed in Grill Me, awaiting specification approval:** Open on the latest completed local week in the supplied data, mark it as historical, and let the admin select a completed week and event type with selections retained after reload. The latest event in the snapshot is an observation bound, not a guarantee that subsequent days have zero events.
- **Confirmed in Grill Me, awaiting specification approval:** Show an account summary and all observed locations; retain quiet locations and prioritize measurable below-typical shortfalls. A lower count is not necessarily poor performance.
- **Source facts:** The seed has 20 accounts and 12,626 events with UTC timestamps, account timezones, locations, three event types, nullable call duration and outcome; events span 2026-02-01 through 2026-07-27 UTC. The seed is read-only and must be loaded unchanged through the required SQL Server migration/seed workflow.
- **Confirmed in Grill Me, awaiting specification approval:** A week without four fully covered prior weeks has insufficient history; a valid zero baseline has no percentage or typicality label. Duration and outcome do not affect counts; location labels are scoped to their account.

## Edge Cases
- Convert local week boundaries to half-open UTC intervals before querying; handle DST changes and midnight crossing without treating UTC dates as local dates.
- Empty selected weeks produce zero current counts but keep valid historical baselines. A location with events in the comparison window remains visible even when its current count is zero; a never-observed location cannot be inferred from this schema.
- A prior week is covered only when its full local Monday-Sunday UTC interval lies between the earliest and latest dataset timestamps; unobserved days within that interval count as zero. If fewer than four prior weeks are covered, show the selected count and "insufficient history" without a baseline, difference, percentage, or typicality label. Do not treat missing weeks before the dataset begins as zero.
- If a valid baseline is zero, show the selected count and signed count difference with "no prior activity", but no percentage or typicality label; this also applies when the current count is zero. Do not divide by zero.
- Dates outside the available complete-week range or malformed filter values are rejected by the API; invalid persisted UI selections fall back to the default.
- Nullable or unexpected outcomes/durations do not change counts. Unknown event types are excluded from the three displayed metrics; negative or odd durations are not interpreted as activity volume.
- The UI shows explicit empty, loading, and failure states; no observed events for an account do not cause division by zero or a fabricated baseline.

## Acceptance Criteria
- [ ] A .NET 8+ API backed by SQL Server and EF Core migrations loads the supplied accounts and events unchanged and returns actual, four-week average, signed and percentage differences, and the 25% plus 3-event label calculated by backend aggregation for the selected account-local week and metric.
- [ ] The Angular SPA displays account totals and all observed location rows with the selected date window, baseline method, and historical-data freshness clearly visible; the largest measurable below-typical shortfalls appear first without an export.
- [ ] A metric and a week selection survive page reload; malformed or unavailable selections recover gracefully.
- [ ] Tests cover UTC/local boundaries including DST, four prior complete weeks, zero-event weeks, zero baseline, insufficient history, both threshold boundaries, location separation and sorting, event-type counts, and invalid input; frontend tests cover API consumption and persisted selection.
- [ ] README documents local database migration and seed loading, start and test commands (including a one-line test instruction), and notable stack choices and their rationale.

## Non-Goals
- Authentication, cross-account browsing, alerting/notifications, ML/forecasting, production infrastructure, or visual polish.
- Creating, modifying, extending, or replacing the supplied seed dataset; interpreting outcomes or duration as quality scores.

## Open Questions
- None remain from the completed Grill Me interview.

## Approval
Approved by: User (explicit chat approval: "Approve specification")
Approved on: 2026-09-29