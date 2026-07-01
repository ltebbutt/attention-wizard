# Spec 002 — Wizard Avatar

Status: agreed
Derives from: `docs/01-vision-and-features.md` ("a friend, not a dashboard").

## Intent

The wizard is **how the app talks to you**. Every proposal, nudge, check-in, and
celebration is delivered by the wizard in first person ("I've picked three candidates
for today"). There is no second voice — no system toasts, no anonymous banners.

## Requirements

### Visual — WIZ-01…WIZ-05

- **WIZ-01** The avatar is a single inline SVG component (no raster assets): a
  minimalist geometric wizard — hat + face — drawn with the design-system tokens
  (emerald accents on near-black), rounded geometry only, consistent with DS-31.
- **WIZ-02** Sizes: `sm` 32px (inline in messages), `md` 56px (header), `lg` 96px
  (onboarding/empty states). SVG scales losslessly.
- **WIZ-03** Expression states, switchable via input:
  `idle` (default calm), `thinking` (used while LLM calls are in flight),
  `celebrating` (task completion), `concerned` (blown block / re-plan — soft, never
  disappointed). Expressions change eyes/mouth/hat-tilt only; silhouette is constant.
- **WIZ-04** Idle micro-motion (slow 4s blink / hat-star shimmer) is subtle and fully
  disabled under `prefers-reduced-motion` (DS-32).
- **WIZ-05** The avatar never blocks content and never moves around the screen.

### Voice & behaviour — WIZ-10…WIZ-14

- **WIZ-10** `WizardMessage` component: avatar (sm) + speech bubble (surface card,
  `--aw-r-lg`, tail toward avatar). All app-initiated copy renders through it.
- **WIZ-11** Tone rules: first person, ≤ 2 sentences per bubble, no exclamation marks
  except in `celebrating` state, no shame vocabulary (banned words list: "failed",
  "only", "still haven't", "again"). Copy review is part of PR review.
- **WIZ-12** The wizard always pairs a message with at most **one** suggested action
  (DS-30); further options collapse behind "something else?".
- **WIZ-13** During any LLM call ≥ 400ms, the wizard shows `thinking`; there are no
  generic spinners in the app.
- **WIZ-14** The wizard's copy is data — templated strings in a copy registry (per
  use case, versioned like prompts), not string literals scattered through components.

## Acceptance criteria

- AC-1: avatar component renders all four states at all three sizes in the demo page.
- AC-2: with `prefers-reduced-motion: reduce`, no animation runs (assertable via class).
- AC-3: grep check: no `matSnackBar`/toast usage; user-facing copy comes from the copy
  registry.
- AC-4: bundle check: avatar adds < 6KB to initial JS.
