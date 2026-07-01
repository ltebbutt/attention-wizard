# Specs

Spec-driven workflow: every feature starts as a numbered spec here; code changes cite
the requirements they implement; a spec's acceptance criteria become its tests.

## Rules

1. **Spec before code.** No feature lands without a spec (small fixes exempt).
2. **Requirements are numbered** (`DS-01`, `TOP3-04`, …) so commits, code comments, and
   tests can reference them precisely.
3. **Acceptance criteria are testable.** Each spec ends with criteria that map 1:1 onto
   automated tests where possible.
4. **Specs are living.** When behaviour changes, the spec changes in the same PR.
   A spec's `Status` line tracks: `draft → agreed → implemented → superseded`.

## Index

| # | Spec | Status |
|---|---|---|
| 001 | [Design system](001-design-system.md) | implemented (tokens, buttons, cards; AC-2/AC-3 checks pending) |
| 002 | [Wizard avatar](002-wizard-avatar.md) | implemented (AC-3/AC-4 checks pending) |
| 003 | [Top 3 daily loop](003-top3-loop.md) | implemented — Phase 1 scope (AC-4 browser e2e pending) |
| 004 | [LLM gateway & token governance](004-llm-gateway.md) | implemented (AC-5 dep-cruise check pending) |

Planning docs in [`../docs/`](../docs/) hold the product vision and architecture these
specs derive from.
