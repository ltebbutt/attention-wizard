# Spec 007 — Wrap-up Ritual, Day Navigator, Personalisation, Reversible States, PWA

Status: agreed
Derives from: user feedback 2026-07-02 ("calendar navigator", "personalisation when
logged in", "manage states — I just open up and cannot revert") + accepted
recommendations (wrap-up flow, wrapped-day summary, install experience).

## 1. Reversible states — ST-01…ST-04

Every loop state must have a way back (until the day is truly over):

- **ST-01** `confirmed → proposed`: "Edit my 3" unlocks the plan (swap/remove again).
  Allowed any time before wrap-up. Swaps counting (TOP3-05) still applies.
- **ST-02** `wrapped → confirmed`: "Reopen today" un-wraps: rolled-over entries return
  to `pending`, their tasks back to `in_top3` with `rolledOverCount` decremented.
  Done entries stay done.
- **ST-03** Done → pending already exists (UNDO-01). With ST-01/02 every state now
  has an exit; nothing is a dead end.
- **ST-04** Demo only: a "start fresh" reset (clears the local store) lives at the
  bottom of the connections sheet — deliberately out of the daily path.

## 2. Wrap-up ritual — WRAP-01…WRAP-04

- **WRAP-01** "Wrap up" / "Call it a day" opens a review sheet instead of executing:
  each unfinished entry asks **"Done or tomorrow?"**; each finished entry asks the
  one-tap estimate feedback **about right / took longer / was quicker** (TOP3-08).
- **WRAP-02** Feedback is optional — "Wrap the day" is always tappable; skipped
  questions default to no feedback and `rolled_over`.
- **WRAP-03** Outcomes go to the API in one `wrapup` call (existing endpoint;
  feedback now also applies to already-done entries).
- **WRAP-04** After wrapping, Today becomes a **day summary**: what got done, what
  moved to tomorrow (neutral copy), the wizard's sign-off, and "Reopen today" (ST-02).

## 3. Day navigator — NAV-01…NAV-03

- **NAV-01** A slim week strip on Today (7 chips: past 6 days + today) navigates
  between days. Today is interactive; past days are **read-only** views of that
  day's plan (entries + outcomes) or "no plan that day".
- **NAV-02** Past-day data comes from `GET /plans/:date` (server) / the local store
  (demo); reading never creates a plan (creation stays a today-only behaviour).
- **NAV-03** The strip marks each past day with a subtle outcome dot (all done /
  partial / none) — a calm streak view, never a guilt metric (no broken-chain UI).

## 4. Personalisation — PERS-01…PERS-03

- **PERS-01** First run, the wizard asks **"What should I call you?"** (inline, one
  field, skippable). The name personalises greetings ("Morning, Levi.") and the
  wrap-up sign-off.
- **PERS-02** The name lives in a local profile store for now (demo + Phase 1);
  it migrates into the server `Profile` when Entra ID lands (docs/04-data-model.md).
  Max 20 chars, editable from the connections sheet.
- **PERS-03** This is the seed of the onboarding interview (Phase 3): the profile
  object is shaped to grow (name now; peak hours, nudge tone later).

## 5. Install experience — PWA-01…PWA-03

- **PWA-01** Web app manifest: standalone display, black theme/background, the
  wizard as icon (192/512 + apple-touch 180). "Add to Home Screen" launches
  full-screen without browser chrome.
- **PWA-02** Works under the `/attention-wizard/` Pages subpath (relative
  `start_url`/`scope`).
- **PWA-03** Offline service worker is out of scope for now (localStorage already
  preserves data; assets need the network on first load).

## Acceptance criteria

- AC-1: API tests — unlock returns a confirmed plan to proposed; reopen restores a
  wrapped plan (rolled-over → pending, task counts decremented); wrap-up outcomes
  apply feedback to already-done entries.
- AC-2: visual — wrap review sheet, day summary with reopen, week strip with a
  read-only past day, name-personalised greeting, all at 360px.
- AC-3: manifest + icons ship in the build output; installed app opens standalone.
