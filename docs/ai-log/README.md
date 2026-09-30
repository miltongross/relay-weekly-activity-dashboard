# AI Interaction Log

Create dated Markdown files such as `2026-09-29-spec-session.md`. Preserve available human and agent messages verbatim, including rejected or redirected output.

For each session, record:
- tool and model, and whether it authored or reviewed;
- available raw messages or exported chat;
- decisions accepted, rejected, or redirected, with reasons;
- subagent handoffs, commands, and observed results;
- specific mistakes caught by the engineer;
- a short honest reflection.

Summarize routine search, read, and edit activity rather than reproducing every tool call. Do not reconstruct unavailable messages or a polished conversation later. Secrets and unrelated private data must be removed and noted as redacted.

## Summary and Handoff Style
- Use short, clear sentences and common words.
- Record what changed, why, key decisions, blockers, and open questions.
- Do not repeat obvious implementation details or information already in the approved plan or code.
- Prefer 1-3 bullets over paragraphs when that remains complete.
- Keep raw message sections verbatim. Apply brevity rules only to summaries, tool activity, and handoffs.
