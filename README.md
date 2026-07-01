# attention-wizard

Personal project made to support individuals with ADHD.

Attention Wizard connects to your work tools (Outlook, Teams, Jira, Confluence, and
more), triages the traffic with an LLM, and helps you commit to just **three things a
day** — with kind nudges, effort estimates, and automatic calendar blocking.

## Planning docs

| Doc | Contents |
|---|---|
| [01 — Vision & Features](docs/01-vision-and-features.md) | Product principles, onboarding interview, traffic triage, Top 3, calendar blocking |
| [02 — Architecture](docs/02-architecture.md) | Stack (Angular + NestJS + Postgres + Azure), module layout, LLM Gateway, pipelines |
| [03 — Integrations](docs/03-integrations.md) | Microsoft Graph, Jira, Confluence APIs, scopes, sync strategy, LLM endpoint wiring |
| [04 — Data Model](docs/04-data-model.md) | Core entities, retention and privacy rules |
| [05 — Security & Privacy](docs/05-security.md) | Identity, token handling, GDPR special-category data, LLM safeguards |
| [06 — Roadmap](docs/06-roadmap.md) | Phased delivery plan with exit criteria and risks |

## Status

Planning phase — no application code yet. Phase 0 (foundations) is the next step; see
the [roadmap](docs/06-roadmap.md).
