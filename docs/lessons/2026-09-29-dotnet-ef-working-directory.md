# Run dotnet-ef from the tool manifest directory

Date: 2026-09-29
Context: DASH-247 checkpoint 1

## Decision or Correction
Document the working directory for `dotnet ef` commands when the local tool manifest is below the repository root. The DASH-247 manifest is in `backend/`, so commands invoked at the root do not resolve it.

## Evidence
Relay Reviewer observed `dotnet ef --version` fail at the repository root and `dotnet ef migrations has-pending-model-changes --project Relay.Api --startup-project Relay.Api` succeed from `backend/` after `dotnet tool restore`.

## Reuse
Place a tool manifest where documented commands run, or show the required working directory alongside each command.
