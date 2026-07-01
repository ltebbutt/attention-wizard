# Attention Wizard — Delivery Roadmap

Phases are scoped so each one ends with something a real ADHD user (starting with you)
can use daily. Ship the habit loop first; integrations deepen it.

## Phase 0 — Foundations (1–2 weeks)

- Monorepo layout: `apps/web` (Angular), `apps/api` (NestJS), `packages/shared` (types).
- Entra ID app registration; login flow end-to-end (Angular → API → JWT).
- CI (build, lint, test, dependency + secret scanning), dev/prod environments on Azure.
- LLM Gateway skeleton with the Foundry driver and one working prompt ("hello triage").
- **Token metering from the first call:** `LlmUsage` recording, per-request caps, and a
  basic per-user daily budget ship with the gateway skeleton — governance is never
  retrofitted. The cost dashboard can be a SQL query at this stage; the data must be
  complete from day one.

**Exit criteria:** you can sign in with your Microsoft account and call one LLM-backed
endpoint in production.

## Phase 1 — The Top 3 habit loop (MVP core, 3–4 weeks)

- Manual task entry (no connectors yet) → daily Top 3 selection → check-in nudges (web
  push) → evening wrap-up → rollover.
- LLM effort estimation on manually entered tasks.
- Minimal profile: 5-question quick setup (peak hours, nudge tone/frequency) — the full
  interview comes later; this seeds the scheduler.

**Why this order:** Top 3 is the behavioural core and needs zero integrations to prove
itself. If the loop doesn't stick with manual entry, connectors won't save it.

**Exit criteria:** 2 weeks of real daily use; wrap-up completion rate is measurable.

## Phase 2 — Outlook + Calendar (3–4 weeks)

- MS Graph connector: mail read (delta) + calendar read.
- Triage pipeline v1: classify, extract asks/deadlines, digest UI (accept/snooze/dismiss).
- Accepted items flow into the Top 3 proposal (prioritisation engine v1: rules + LLM rank
  with explanations).
- **Invite-first focus blocks:** service mailbox sends meeting invites carrying the
  session plan; user accepts in Outlook; RSVP state read back. Blown-block detection
  and re-plan (fresh invite). Direct calendar write ships later as an opt-in power mode.

**Exit criteria:** morning proposal is drawn from real inbox traffic; accepting an
invite puts a session-planned focus block in Outlook.

## Phase 3 — Onboarding interview & recommendations (2–3 weeks)

- Conversational landing interview (LLM-driven, structured checkpoints, resumable) →
  scored profile dimensions → tailored app defaults + recommendations feed.
- Consent flow for special-category data; export/delete self-service.
- Estimation calibration starts using Phase 1–2 actuals ("you typically need 1.6× your
  estimate — buffering accordingly").

**Exit criteria:** a new user can land, do the interview, and get a personalised setup
without touching raw settings.

## Phase 4 — Teams, Jira, Confluence (4–5 weeks)

- Teams mentions/DMs into triage (graceful degradation where admin consent is missing).
- Jira assigned/mentioned issues; Confluence mentions + inline tasks.
- Optional Teams-DM nudge channel; presence-aware nudge timing.
- Cross-source dedup ("this Jira ticket and this email are the same ask") via pgvector.

**Exit criteria:** one morning digest covering all four sources, deduped.

## Phase 5 — Polish & widen (ongoing)

- Recommendation engine v2 (passive learning from nudge engagement + block outcomes).
- Connector roadmap: Slack, GitHub/Azure DevOps, Google Workspace (multi-IdP work).
- Teams app packaging (message extension) as a distribution channel.
- Accessibility audit (WCAG 2.2 AA + neurodivergent-specific review), pen test, beta.

## Key risks to watch

| Risk | Mitigation |
|---|---|
| Tenant admin consent blocks Teams/mail scopes at target workplaces | Graceful per-scope degradation is built into the connector UX from Phase 2 |
| LLM triage cost balloons with mail volume | Batch triage, cheap-model first pass, layered token budgets + spend circuit-breaker enforced in the gateway, digest cadence instead of realtime |
| Users ignore the focus-block invites | RSVP telemetry is free — measure accept rate from Phase 2; tune session-plan copy and slot choice before considering auto-write default |
| Nudges become noise and get ignored | NudgeLog engagement tracking from Phase 1; frequency auto-tunes down |
| iOS PWA push reliability | Measure in Phase 1; native shell (Capacitor) as contingency |
| Screening feature drifts toward "diagnosis" | Copy review + disclaimers as a release checklist item, every release |
