# Select only fully covered local weeks

Date: 2026-09-29
Context: DASH-247 checkpoint 2

## Decision or Correction
The first selectable local week must start at or after the exact first event timestamp, not merely contain its date. If the first event arrives mid-week, the week containing it is partial and must not be selectable.

## Evidence
The reviewer found that the API offered 2026-01-26 for an account whose first local event fell on Sunday 2026-02-01. After the boundary fix, LocalDB tests passed 30/30 and the live API rejected January 26 with 400 while accepting February 2 with 200. Independent re-review PASSED.

## Reuse
Convert local period boundaries to UTC and compare complete intervals with exact coverage timestamps. Test both mid-period starts and events exactly on the boundary, including non-UTC timezones.