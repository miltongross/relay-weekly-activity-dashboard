# Keep active controls enabled during asynchronous reloads

Date: 2026-09-30
Context: DASH-247 frontend checkpoint 3b

## Decision or Correction
Disabling a fieldset containing a focused selector during an asynchronous request loses focus. When controls can remain available, guard against stale responses in state instead, and announce loading separately.

## Evidence
The original browser review observed focus moving to BODY on every selection. After removing loading-time disablement, 27 Chrome tests, a production build and independent live keyboard checks passed for both controls, slow requests and out-of-order responses. Checkpoint 3b PASSED.

## Reuse
Test actual keyboard focus during and after a delayed request, not only after a synchronous mock response. Ensure the loading announcement and stale-response handling remain effective.