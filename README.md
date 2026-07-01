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

## Specs

Development is spec-driven: features start as numbered specs in [`specs/`](specs/), and
acceptance criteria become tests. See the [spec index](specs/README.md).

## Repository layout

```
apps/web    Angular 20 frontend (dark emerald design system, wizard avatar, Today screen)
apps/api    NestJS API (Top 3 loop, LLM gateway with token budgets + telemetry)
specs/      numbered feature specs (source of truth for behaviour)
docs/       product vision, architecture, roadmap
tools/      repo checks (design-token lint)
```

## Getting started

```bash
npm install          # workspace install (Node >= 20)
npm run dev:api      # NestJS on :3000 (in-memory store, mock LLM provider)
npm run dev:web      # Angular on :4200, proxies /api to :3000
npm test             # API unit + e2e, web unit tests
npm run lint:tokens  # design-system token check (DS-01)
```

The LLM gateway defaults to a deterministic mock provider. To use a real endpoint set
`AW_LLM_PROVIDER` (`openai-compatible` | `anthropic`), `AW_LLM_BASE_URL`,
`AW_LLM_API_KEY`, and `AW_LLM_MODEL`. Budgets are env-seeded via `AW_LLM_BUDGETS`
(JSON); with no config for a use case the gateway fails closed (spec 004).

## Status

Phase 0/1 in progress: Top 3 daily loop works end-to-end with manual task entry, the
LLM gateway meters every call, and the web app ships the black + emerald design system
with the wizard avatar. Auth (Entra ID), persistence (Postgres), and connectors are
next; see the [roadmap](docs/06-roadmap.md).
