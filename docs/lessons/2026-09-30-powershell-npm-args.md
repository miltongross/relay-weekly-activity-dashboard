# Verify npm argument forwarding in PowerShell

Date: 2026-09-30
Context: DASH-247 final checkpoint 4

## Decision or Correction
PowerShell's `npm.ps1` may not pass arguments after `--` to the npm script as expected. Put required single-run test flags in the package script, or invoke `npm.cmd` when forwarding script flags.

## Evidence
The approved `npm test --prefix frontend -- --watch=false` command prints an npm warning about `--watch`, but runs once because `frontend/package.json` defines `ng test --watch=false`. Relay Reviewer also observed `npm start --prefix frontend -- --port 4210` incorrectly reach Angular as `ng serve 4210`, while `npm.cmd` preserved the argument separator.

## Reuse
Test documented npm command lines in the shell users will run. Prefer a self-contained package script for essential flags; use `npm.cmd` on Windows when forwarding extra flags.