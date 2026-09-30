---
applyTo: "backend/**"
description: "Use when editing Relay backend files. Enforce pragmatic SOLID design, ASP.NET Core boundaries, EF Core-only SQL Server access, contract safety, and focused validation."
---
# Backend Instructions

## Toolchain
- For a new backend, use the latest installed stable .NET SDK version 8 or newer. Do not select a preview unless the approved plan requires it.
- Use ASP.NET Core, EF Core, the SQL Server provider, EF Core migrations, and xUnit.

## Architecture
- Keep endpoints thin and move business behavior out of API transport code.
- Separate API contracts, business behavior, and persistence concerns using the smallest useful boundaries.
- Use constructor injection and registered abstractions; avoid service location and hidden dependencies.
- Apply SOLID pragmatically:
	- Give each class or method one cohesive reason to change.
	- Extend behavior through focused composition or strategies when variation is required; do not modify stable code with growing conditionals.
	- Keep implementations substitutable for their contracts, including validation, nullability, errors, and side effects.
	- Keep interfaces small and consumer-focused; do not force callers to depend on methods they do not use.
	- Make business behavior depend on abstractions at external boundaries such as persistence, time, messaging, and third-party services.
- Introduce interfaces only at real behavioral or external boundaries, or when multiple implementations or test substitution justify them. Do not create an interface for every class.

## Data and Contracts
- Use EF Core with SQL Server for persistence, migrations, and aggregation; do not add handwritten SQL, Dapper, or another ORM.
- Use `AsNoTracking()` and DTO projections for read-only queries.
- Keep queries bounded, asynchronous, cancellation-aware, provider-translatable, and free of N+1 access.
- Preserve approved API contracts and supplied data semantics. Handle relevant nulls, boundaries, time zones, empty results, and aggregate rules explicitly.

## Quality
- Add or update xUnit tests whenever backend behavior changes.
- Use an ephemeral SQL Server instance through the project's existing test fixture (for example, Testcontainers or LocalDB) for integration tests covering relational queries, migrations, and aggregate correctness. If no SQL Server fixture exists, do not create one unless the approved plan requires it, and do not substitute EF Core InMemory or SQLite. Still add unit tests for business logic that does not depend on the database. List the specific integration tests that could not be written, and state that no SQL Server fixture is available.
- For a new API, provide development-only OpenAPI/Swagger.
- Run focused build and test commands after the first substantive edit to catch problems early, then rerun them after the final edit. Report the observed results of the final run, including any failures.

## Hygiene
- Do not edit generated files under `bin/` or `obj/`.