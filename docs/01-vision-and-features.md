# Attention Wizard — Vision & Features

## Vision

Attention Wizard is a companion app for neurodivergent people — ADHD first — that sits
across your work tools (Teams, Outlook, Jira, Confluence, and more), processes the noise,
and helps you decide what actually matters today. It behaves like a supportive friend, not
another dashboard: it reduces choices instead of adding them.

Three principles drive every feature:

1. **Reduce, don't aggregate.** ADHD brains drown in feeds. The app's job is to shrink a
   day's traffic into a handful of decisions, not to show everything in one place.
2. **Externalise executive function.** Prioritising, estimating effort, remembering to
   start, noticing time passing — the app takes over the parts of executive function that
   ADHD makes expensive.
3. **Kind accountability.** Nudges are encouraging and shame-free. Missing a task never
   produces guilt-inducing copy; it produces a re-plan.

## Core features

### 1. Onboarding interview ("Get to know you")

A conversational landing experience that gauges working style, symptoms, and preferences,
then builds a **Personal Profile** that tunes the whole app.

- Conversational flow (LLM-driven chat with structured question checkpoints), not a wall
  of form fields — ~10 minutes, resumable, skippable.
- Question domains:
  - **Symptom self-screening** — inspired by validated instruments (ASRS v1.1 adult ADHD
    self-report structure) covering inattention, hyperactivity/impulsivity, time
    blindness, task initiation, working memory.
  - **Working style** — peak focus hours, meeting tolerance, preferred nudge tone and
    frequency, hyperfocus patterns.
  - **Context** — role, tools used, typical traffic volume.
- Output: a scored profile (dimensions, not a diagnosis) + tailored recommendations
  (e.g. "You reported strong time blindness — we'll default to aggressive calendar
  blocking and pre-meeting alerts").
- **Hard rule:** the app never diagnoses. All screening copy carries a clear "this is not
  a medical assessment" disclaimer and signposts professional resources. The profile is
  treated as sensitive health-adjacent data (see `05-security.md`).
- Profile is re-tunable any time; the app also learns passively (e.g. which nudges the
  user dismisses) and proposes profile updates rather than silently changing behaviour.

### 2. Traffic processing ("Your inbox, triaged")

Connectors pull activity from integrated tools; a triage pipeline turns raw traffic into
**Actionable Items** with extracted deadlines, requesters, and urgency signals.

- Sources at launch: Outlook mail, Outlook calendar, Teams messages/mentions, Jira issues,
  Confluence mentions/tasks. Connector model is extensible (see `03-integrations.md`).
- The LLM classifies each item: *actionable / FYI / noise*, extracts the ask, estimates
  effort, and detects implied deadlines ("by EOD Thursday").
- The user sees a **short triage digest**, not a unified inbox: "You have 4 new things
  that need a decision" — each with a one-line summary and accept / snooze / dismiss.
- Raw message content is processed and discarded by default; only extracted task metadata
  is retained (privacy-first, see `05-security.md`).

### 3. Top 3 ("Only three things")

The centrepiece daily exercise: pick exactly **three** things for today and track them.

- Each morning (at a profile-tuned time) the app proposes a Top 3 drawn from actionable
  items, ranked by the prioritisation engine (deadlines, requester importance, effort fit
  for the day's available focus time, user's stated goals).
- The user confirms or swaps — the app never silently decides, but it always proposes so
  a blank page is never the starting point.
- Hard cap of three. Everything else lives in a collapsed "Later" list that is
  deliberately out of sight.
- Through the day: progress check-ins ("How's task 2 going?" at sensible moments — not on
  a dumb timer), celebration on completion, and a shame-free evening wrap-up that rolls
  unfinished items into tomorrow's proposal.
- Alerts adapt to the profile: tone (cheerleader vs. matter-of-fact), channel (push,
  Teams DM, email), and frequency are all tunable.

### 4. Effort estimation & calendar blocking

- The LLM estimates effort for each Top 3 item (with the user's historical
  estimate-vs-actual as feedback — ADHD time blindness means estimates improve a lot with
  personal calibration data).
- The app finds free slots in the Outlook calendar and proposes focus blocks sized to the
  estimate (+ a profile-tuned buffer, defaulting generous — planning fallacy is real).
- One tap writes the blocks to the calendar via Microsoft Graph, marked as busy, with the
  task linked in the event body.
- If a day gets blown up (meetings land on top of blocks), the app notices and proposes a
  re-plan instead of letting the plan silently rot.

### 5. Recommendations engine

- Ongoing, profile-driven suggestions: strategies (body doubling, pomodoro variants,
  task-initiation tricks), app-behaviour changes (nudge cadence), and workload
  observations ("your last 3 Wednesdays had zero focus time — want me to protect
  Wednesday mornings?").
- Recommendations are explainable: every suggestion says *why* ("because you scored high
  on X and we observed Y").

## Explicit non-goals (v1)

- Not a medical/diagnostic tool.
- Not a full task manager replacing Jira/Outlook — it orchestrates them.
- Not a general chat assistant — the LLM serves the features, it isn't an open chatbot.
- No team/manager visibility into anyone's profile or performance. This is a personal
  tool; that boundary is a trust promise.
