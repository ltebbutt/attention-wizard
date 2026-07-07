# Spec 009 — Bring-Your-Own AI & Traffic Capture Without Connectors

Status: agreed
Derives from: user question 2026-07-07 ("could we not do Teams another way? Can the
LLM key be something a user links to a free LLM?"), docs/03-integrations.md (open
gateway), spec 004 (governance, mirrored client-side).

## Intent

Neither real intelligence nor real traffic should wait for a backend. The demo runs
in the browser, so: the user links their **own** LLM key (free tiers work), calls go
**directly from their device to their provider**, and message traffic arrives by
**paste/share** instead of connectors. Honest scope: real Graph/Atlassian connectors
still arrive with the backend; this is the no-desk path.

## 1. BYO AI — AI-01…AI-06

- **AI-01** "Your AI" settings (from the connections sheet): provider preset
  (**Groq**, **OpenRouter**, or custom OpenAI-compatible base URL), API key, model.
  Presets carry get-a-key hints ("console.groq.com — free key, phone-friendly").
- **AI-02** The key is stored **on-device only** (localStorage), calls go browser →
  provider directly, and the UI says exactly that. Recommend a free-tier key, not a
  billing-attached one. Disconnect wipes it.
- **AI-03** A "test the link" button makes a one-word call and reports through the
  wizard (thinking → linked / failed with reason).
- **AI-04** Client-side governance mirrors spec 004 in miniature: a daily call cap
  (default 50), fail-closed when unset, and a content-free local call counter.
  (Full budgets/telemetry stay server-side when the API deploys.)
- **AI-05** With AI linked, **"size it up" uses the real model** (same JSON schema
  as the server prompt registry: `{estimateMin, firstStep}`, ADHD-aware system
  prompt, `<data>` delimiting per LLM-05). Without it, the deterministic mock.
- **AI-06** All provider failures degrade to the existing honest fallbacks
  (LLM-20/21 behaviour); the app never blocks on the model.

## 2. Traffic capture — CAP-01…CAP-05

- **CAP-01** **Brain dump**: the pile sheet gains a paste box — paste anything
  (Teams thread, email, meeting notes) and tap "Sort this out".
- **CAP-02** With AI linked: the model extracts up to 8 actionable items
  (title + estimate) from the pasted text — the triage pipeline of
  docs/02-architecture.md, with the user as transport. Without AI: a line/sentence
  heuristic proposes items.
- **CAP-03** Extracted items are **proposals**: listed with one-tap add (and
  add-all); nothing enters the pile silently.
- **CAP-04** URL capture: opening the app with `?add=<text>` prefills the brain
  dump — this enables an iOS Shortcut ("share → send to Wizard") and deep links.
- **CAP-05** The manifest registers a **share target** (Android: native share sheet
  → Wizard). iOS ignores it; the Shortcut route covers iPhones.

## 3. Honesty — HON-01

- **HON-01** The connections sheet explains the two tiers plainly: paste/share
  capture works now; automatic Teams/Outlook/Jira ingestion arrives with the
  backend + app registrations. "Coming soon" chips stay on connector rows.

## Acceptance criteria

- AC-1: with no AI configured, estimation uses the mock and brain dump uses the
  heuristic — no network calls attempted (fail closed, AI-04).
- AC-2: brain-dump proposals render and add to the pile; `?add=` prefills the box.
- AC-3: with a (stubbed) OpenAI-compatible endpoint, estimation and triage parse
  the schema and update tasks; provider errors fall back per AI-06.
