# Keep failed filter changes consistent with displayed data

Date: 2026-09-30
Context: DASH-247 full frontend checkpoint 3

## Decision or Correction
When a new filter request fails but old results remain visible, restore the controls and persisted selection to the last successful response. Keep the attempted selection separately so Retry still requests what the user tried.

## Evidence
The full frontend review was blocked because a failed change left new select values beside old data. After rollback was added, 34 Chrome tests and a build passed; independent live review verified rollback, focus and Retry for metric and week under network, 400, 404 and 500 failures. Checkpoint 3 PASSED.

## Reuse
Test success, loading and failure-after-success for user-controlled async filters. Verify the visible controls, data labels and stored values agree after a failure, and that Retry preserves the attempted action.