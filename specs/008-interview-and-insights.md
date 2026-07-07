# Spec 008 — Onboarding Interview, Recommendations, Calibration, Check-ins, Gestures

Status: agreed
Derives from: docs/01-vision-and-features.md §1/§5, docs/06-roadmap.md Phase 3 (pulled
forward in demo form), user direction "work on all unfinished features".

## 1. Onboarding interview — INT-01…INT-06

- **INT-01** A wizard-led interview of **5 structured questions**, one at a time,
  chip answers, progress dots, fully skippable, resumable. ~2 minutes. (The
  LLM-conversational version arrives when the real API is deployed; the question
  set and profile shape are shared.)
- **INT-02** Questions cover: peak focus time; time blindness; hardest phase
  (starting / switching / finishing); cheer tone; estimate reality ("when you guess
  30 minutes, reality says…").
- **INT-03** Answers score a profile: `{ peak, timeBlindness 0–4, hardestPhase,
  tone: 'cheer' | 'calm', bufferX: 1 | 1.5 | 2 }`, stored in the local profile
  (PERS-02 migration note applies).
- **INT-04** Entry points: offered by the wizard after the name ask on first run;
  re-runnable from the connections sheet ("tune the wizard").
- **INT-05** **No diagnosis, ever**: intro copy states this is tuning, not
  assessment (hard rule from docs/01).
- **INT-06** Finishing the interview immediately and visibly changes the app
  (INT-effects below) and presents the recommendations (REC).

### Interview effects

- **INT-10** `bufferX` pads displayed estimates: "~30 min · 60 at your pace" on
  slots and the invite preview. Padding is presented as *your pace*, never as
  slowness.
- **INT-11** `tone` selects celebration/nudge copy variants (cheer = exclamation
  marks allowed per WIZ-11; calm = quiet acknowledgement).
- **INT-12** `peak` adds a planning hint when picking during the user's peak
  window ("These are your good hours — maybe start the heavy one").

## 2. Recommendations — REC-01…REC-03

- **REC-01** The interview generates 2–3 recommendation cards, each **explainable**:
  what to try + "because you said X" rationale (vision doc requirement).
- **REC-02** Recommendations live in a profile sheet ("about you") reachable from
  the connections sheet; dismissible; regenerate on re-interview.
- **REC-03** Rule-based for now (deterministic from profile); LLM-personalised
  later through the same shape.

## 3. Estimate calibration — CAL-01…CAL-02

- **CAL-01** Wrap-up feedback (spec 007) accumulates into a calibration signal:
  ≥3 feedback points with a majority `took_longer` ⇒ effective buffer increases a
  step (capped ×2); majority `was_quicker` ⇒ decreases a step (floored ×1).
  Interview `bufferX` is the starting point.
- **CAL-02** The profile sheet shows the insight in wizard voice ("Your tasks tend
  to run long — I pad your estimates ×1.5") — an observation, never a criticism.

## 4. In-app check-ins — CHK-01…CHK-03

- **CHK-01** While the app is open and an entry is `in_progress` past its padded
  estimate, the wizard checks in once per entry: "Still on X? Finish line or a
  break — both count."
- **CHK-02** Check-ins are per-entry once, tone-aware (INT-11), and never use
  shame vocabulary. No timers count down; the check-in references elapsed time.
- **CHK-03** Push notifications (closed-app nudges) remain Phase 1.5 — requires a
  service worker; out of scope here and noted honestly in the connections sheet.

## 5. Gestures & haptics — GES-01…GES-02

- **GES-01** On touch devices, swiping a slot right ≥ 64px completes it (same as
  Done); swipe affordance never replaces the buttons (TOP3-32: buttons stay).
- **GES-02** Completing a task vibrates briefly where supported
  (`navigator.vibrate`, no-op elsewhere). No sound.

## 6. Quality gates (outstanding spec ACs) — QG-01…QG-03

- **QG-01** Contrast check (001 AC-3): script computes WCAG ratios for the token
  pairs in DS-04 from the tokens file; fails under 4.5:1. Runs with `lint:tokens`.
- **QG-02** Browser e2e (003 AC-4): scripted happy path at 360px against the demo
  build (add task → pick 3 → lock → done ×3 → celebration visible), run in CI.
- **QG-03** Remaining: dep-cruiser (004 AC-5) and bundle guard (002 AC-4) —
  tracked, not in this change.

## Acceptance criteria

- AC-1: completing the interview updates greetings/padding immediately; profile
  sheet shows profile + recommendations with rationales.
- AC-2: with 3 `took_longer` feedbacks, padded estimates increase a step (unit
  or scripted check).
- AC-3: QG-01 and QG-02 run green in CI.
