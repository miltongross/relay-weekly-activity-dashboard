---
name: grill-me
description: "Stress-test a plan, specification, decision, or design through a rigorous dependency-aware interview. Use when the user explicitly invokes /grill-me."
disable-model-invocation: true
---

# Grill Me

Interview the user until you reach a shared understanding. Map the topic as a design tree in which each decision branches into the decisions that depend on it.

Work in rounds. The frontier is every question whose prerequisites are settled. Ask the whole frontier in one round, number each question, and include your recommended answer. Wait for the user's answers before recomputing the frontier and asking the next round. A question that depends on another open question belongs in a later round.

Use this format:

```markdown
**Q1 - <question title>:** <question and choices>

Recommended: <answer and concise rationale>
```

Discover repository and environment facts yourself with read-only tools or subagents. Ask the user only for decisions, preferences, or information that cannot be discovered. Do not act on the resulting plan or design until the user confirms the interview is complete.
