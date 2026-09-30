---
applyTo: "frontend/**"
description: "Use when editing Relay frontend files. Enforce strict typing, standalone patterns, explicit state, OpenAPI contract safety, accessibility, and focused validation."
---
# Frontend Instructions

## Toolchain
- For a new SPA, use the latest compatible stable Angular release available in the environment. Do not select a preview.
- Use the repository's established or Angular-generated test runner unless the approved plan changes it.

## Angular Patterns
- Use strict TypeScript; do not use `any`.
- Prefer standalone components, reactive forms, and Signals for local synchronous state.
- Use RxJS for HTTP streams, cancellation, event composition, and cross-component asynchronous flows.
- Keep components focused on presentation and orchestration; place HTTP calls and reusable behavior in feature services.

## Contracts and State
- Treat the approved OpenAPI document as the source of truth and use strongly typed request and response models. If it cannot be found, ask the user for its location instead of inferring or inventing request or response models.
- Report contract drift instead of silently compensating for it.
- Persist state only when required; define defaults, serialization, invalid-value recovery, and reload behavior.

## UX and Quality
- Use semantic, keyboard-accessible markup with labels, visible focus, and appropriate status announcements.
- Implement relevant loading, empty, error, and partial-data states.
- Treat supplied local design references as read-only and do not require external design services.
- Add or update focused tests when component, service, route, persistence, or error behavior changes.
- Run a focused test, typecheck, lint, or build after the first substantive edit and report observed results.

## Hygiene
- Do not edit generated files under `dist/`, `coverage/`, or `node_modules/`.