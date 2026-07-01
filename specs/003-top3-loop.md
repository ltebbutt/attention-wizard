# Spec 003 — Top 3 Daily Loop (Phase 1, manual entry)

Status: agreed
Derives from: `docs/01-vision-and-features.md` §3, `docs/06-roadmap.md` Phase 1.

## Intent

The behavioural core: pick exactly three things today, track them kindly, roll over
what's left. Phase 1 works with **manually entered tasks** — no connectors — to prove
the habit loop.

## Domain rules — TOP3-01…TOP3-08

- **TOP3-01** A `DailyPlan` exists per user per local calendar date, states:
  `proposed → confirmed → wrapped`. At most one non-wrapped plan per date.
- **TOP3-02** A plan holds **at most 3** entries (positions 1–3). The API rejects a 4th
  (`422`, code `TOP3_FULL`) — the cap is a server-side invariant, not a UI nicety.
- **TOP3-03** Entry states: `pending → in_progress → done`, plus terminal
  `rolled_over` (set only at wrap-up). Only one entry may be `in_progress` at a time
  (single-focus rule); starting another auto-pauses the first back to `pending`.
- **TOP3-04** Tasks live in a backlog (`ActionableItem` with `source: manual`).
  Adding a task takes exactly: title (required), note, deadline, estimate (optional).
- **TOP3-05** Confirming a plan is explicit ("Lock in my 3"). After confirmation,
  swapping an entry is allowed but recorded (`swaps` count — feeds later insights,
  never shown as a guilt metric).
- **TOP3-06** Evening wrap-up: user marks remaining entries; anything not `done`
  becomes `rolled_over` and is flagged as a priority candidate for tomorrow's
  proposal. Rollover copy is neutral (WIZ-11): "Task X moves to tomorrow's pile."
- **TOP3-07** Completion of the 3rd entry triggers the single celebration moment
  (DS-32) delivered by the wizard in `celebrating` state.
- **TOP3-08** Estimates: optional minutes on each entry; when an entry is `done`, the
  user can confirm/adjust actual time with one tap (three choices: "about right",
  "took longer", "was quicker") — this seeds `EstimationCalibration` without a form.

## API — TOP3-20…TOP3-24

Base: `/api/v1` (all endpoints scoped to the authenticated user; Phase 0 uses a
dev-user stub until Entra ID lands).

- **TOP3-20** `POST /tasks` create backlog task; `GET /tasks?status=` list;
  `PATCH /tasks/:id`; `DELETE /tasks/:id`.
- **TOP3-21** `GET /plans/today` returns (creating if absent) today's plan with
  entries, in the user's timezone.
- **TOP3-22** `POST /plans/today/entries {taskId}` add entry (enforces TOP3-02);
  `DELETE /plans/today/entries/:id` remove/swap-out (enforces TOP3-05 recording).
- **TOP3-23** `POST /plans/today/confirm`; `POST /plans/today/wrapup {outcomes}`.
- **TOP3-24** `POST /entries/:id/status {status}` with single-focus enforcement
  (TOP3-03) and actual-time capture (TOP3-08).

## UI — TOP3-30…TOP3-34

- **TOP3-30** **Today** is the home screen: wizard greeting, the three slots (empty
  slots render as inviting outlines, not errors), primary action follows the loop
  state: `Pick my 3 → Lock in → (during day) per-entry actions → Wrap up`.
- **TOP3-31** Picking view: backlog list with one-tap add-to-slot; rolled-over items
  pinned on top with a soft emerald tint.
- **TOP3-32** Entry card: position number (DS-22 large), title, estimate chip,
  state action (Start / Done), swipe (mobile) or hover actions (desktop) for swap.
- **TOP3-33** "Later" list (backlog) is collapsed by default on Today — visible only
  behind an explicit tap (reduce, don't aggregate).
- **TOP3-34** Everything works at 360px width; entry actions meet DS-13 touch targets.

## Out of scope (Phase 1)

Connectors, LLM-proposed Top 3, calendar invites, push nudges (the check-in *schedule*
ships Phase 1.5 once web push is wired; the domain model above already supports it).

## Acceptance criteria

- AC-1: API test — adding a 4th entry returns 422 `TOP3_FULL`.
- AC-2: API test — starting entry B while A is `in_progress` moves A to `pending`.
- AC-3: API test — wrap-up marks non-done entries `rolled_over`; next day's
  `GET /plans/today` proposal lists them first.
- AC-4: e2e — full happy path at 360px viewport: add task → pick 3 → lock → start →
  done ×3 → celebration visible.
- AC-5: unit — plan/date logic respects user timezone (entry added at 23:55 local
  lands on the correct plan).
