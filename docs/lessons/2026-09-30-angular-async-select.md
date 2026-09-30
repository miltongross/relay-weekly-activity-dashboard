# Verify visible selection after async options render

Date: 2026-09-30
Context: DASH-247 frontend checkpoint 3a

## Decision or Correction
With options created asynchronously, setting `[value]` on a native select before its options exist can leave the first option visibly selected while application state holds another value. Bind selection when each option renders, or use an Angular forms value accessor.

## Evidence
The original frontend checkpoint observed mismatched selects and dashboard data after reload. After binding `[selected]` on each option, 24 Chrome tests and a production build passed; Architect and Relay Reviewer separately confirmed default, changed, persisted and invalid-value fallback selections in live Chrome. Checkpoint 3a PASSED.

## Reuse
Assert the actual select DOM value after options arrive, including at least one saved value that is not the first option. State-only persistence tests cannot catch a visible mismatch.