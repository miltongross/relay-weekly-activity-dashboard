# Relay Exercise Guidelines

## Scope
- Start ticket delivery with **Relay Architect** and provide the ticket plus its source or reference paths.
- Never assume a ticket ID, fixed source folder, dataset, or product behavior.
- Treat any supplied seed or reference input as read-only unless the user explicitly states otherwise.
- Build only from the active ticket's approved specification, plan, and supplied sources.
- Required stack: .NET 8+ backend, Angular SPA, and SQL Server with migrations.
- Do not replace or extend a supplied dataset.

## Scoped Instructions
- Backend C# rules are in `.github/instructions/backend.instructions.md`.
- Frontend Angular rules are in `.github/instructions/frontend.instructions.md`.

## Delivery Gate
- **Relay Architect** is the sole owner of workflow state, specifications, plans, approvals, delegation, and evidence tracking.
- Do not write application code until a spec in `docs/specs/` and a plan in `docs/plans/` both contain `Status: Approved`.
- Never treat silence or an ambiguous response as approval.

## Agent Workflow
- **Relay Backend** implements and validates delegated backend tasks.
- **Relay Frontend** implements and validates delegated frontend tasks.
- **Relay Reviewer** independently reviews the checkpoints defined in the approved plan.
- Specialists report evidence and blockers to Architect; they do not change workflow state or reinterpret approved product behavior.

## Communication and Documentation
- Use an ELI18 and ASD-STE100 style.
- Use short, clear sentences and common words.
- Avoid unnecessary jargon and repeated information.
- Use bullets and tables only when they improve clarity.
- State decisions and reasons directly.
- Do not restate the full task when reporting progress.
- Keep logs and handoffs concise but complete.
- Include only information useful to the next agent or reviewer.

## Documentation Rules
For summaries, logs, and handoffs:
- Record what changed and why.
- Record important decisions, blockers, and open questions.
- Do not describe obvious implementation details.
- Do not repeat information already available in the approved plan or code.
- Prefer 1-3 bullets over paragraphs when that preserves required evidence.
- Keep required raw messages verbatim; apply these brevity rules to the surrounding summary and handoff text.

## Evidence
- Preserve available human and agent messages verbatim in `docs/ai-log/`; summarize tool activity and subagent evidence without fabricating hidden transcripts.
- Record accepted, rejected, and redirected suggestions and why.
- Add only durable, verified decisions or corrections to `docs/lessons/`.
- Report commands and observed results honestly.
