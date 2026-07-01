# Attention Wizard — System Architecture

## Stack summary

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Angular 18+ PWA | Repo is already Angular-scaffolded; PWA gives installability + push notifications without app-store friction for v1 |
| Backend | NestJS (TypeScript, Node 20+) | One language across the stack; NestJS modules map cleanly onto the connector/service design below; first-class OpenAPI |
| Database | PostgreSQL 16 (+ `pgvector`) | Relational core for tasks/profiles; pgvector for semantic dedup/recall of triaged items |
| Queue / jobs | BullMQ on Redis | Ingestion polling, nudge scheduling, digest generation |
| Auth | Microsoft Entra ID (OAuth 2.0 + PKCE) | Users live in the MS ecosystem; one identity unlocks Graph scopes |
| Secrets/tokens | Azure Key Vault | Encrypted storage for connector refresh tokens and API keys |
| LLM | Azure AI Foundry endpoint behind an internal LLM Gateway | See below — provider-agnostic by design |
| Hosting | Azure Container Apps (API + workers), Azure Static Web Apps (frontend) | Stays in one cloud with the identity + Key Vault story |

Native mobile apps are deferred; the PWA covers push notifications on Android and
(iOS 16.4+) Safari. Revisit native if nudge reliability on iOS proves insufficient.

## High-level diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  Angular PWA (Static Web Apps)                                         │
│  onboarding · triage digest · Top 3 board · calendar view · settings   │
└──────────────────────────────┬─────────────────────────────────────────┘
                               │ HTTPS / JWT (Entra ID)
┌──────────────────────────────▼─────────────────────────────────────────┐
│  API Gateway (NestJS)                                                  │
│  ┌───────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │ Profile & │ │ Task &    │ │ Prioritisa-  │ │ Notification         │ │
│  │ Onboarding│ │ Top 3     │ │ tion Engine  │ │ Service              │ │
│  └───────────┘ └───────────┘ └──────────────┘ └──────────────────────┘ │
│  ┌───────────────────────────┐ ┌─────────────────────────────────────┐ │
│  │ Connector Hub             │ │ LLM Gateway                         │ │
│  │ Graph · Jira · Confluence │ │ Foundry / OpenAI / Anthropic drivers│ │
│  └───────────┬───────────────┘ └───────────────┬─────────────────────┘ │
└──────────────┼─────────────────────────────────┼───────────────────────┘
               │                                 │
   ┌───────────▼───────────┐          ┌──────────▼──────────┐
   │ Ingestion Workers     │          │ Azure AI Foundry    │
   │ (BullMQ, poll+webhook)│          │ endpoint            │
   └───────────┬───────────┘          └─────────────────────┘
               │
   ┌───────────▼───────────────────────────────┐
   │ PostgreSQL (+pgvector) · Redis · Key Vault│
   └───────────────────────────────────────────┘
```

## Backend modules (NestJS)

```
src/
  auth/            # Entra ID OIDC, session/JWT handling, scope consent flows
  profile/         # onboarding interview state machine, profile scoring, recommendations
  connectors/
    core/          # Connector interface, registry, token lifecycle, sync scheduling
    ms-graph/      # Outlook mail/calendar + Teams (one connector, shared Graph client)
    jira/
    confluence/
  ingestion/       # workers: fetch -> normalise -> triage (LLM) -> ActionableItem
  tasks/           # ActionableItem + Top3 domain: selection, tracking, rollover
  planning/        # effort estimation, calendar free-slot search, block writing, re-plan
  prioritisation/  # ranking engine (rules + LLM scoring, explainable output)
  notifications/   # nudge scheduling, channel adapters (web push, email, Teams DM)
  llm/             # LLM Gateway: provider drivers, prompt registry, budget/rate limits
  privacy/         # retention jobs, export, delete-my-data
```

### Connector Hub

Every integration implements one interface so adding "and more" tools later is cheap:

```ts
interface Connector {
  id: string;                          // 'ms-graph', 'jira', ...
  authorize(userId): Promise<AuthUrl>; // provider OAuth consent
  sync(userId, cursor): Promise<RawItem[]>;   // incremental pull
  webhookHandler?(payload): RawItem[];        // push where supported
  capabilities: Capability[];          // READ_MAIL, WRITE_CALENDAR, READ_ISSUES...
}
```

- **Delta-first:** use Graph delta queries and Jira `updated >` JQL cursors; webhooks
  (Graph change notifications, Jira/Confluence webhooks) where tenancy allows, polling
  fallback everywhere.
- All raw items are normalised to a common `RawItem` envelope (source, author, timestamp,
  body, link) before triage, so the pipeline is source-agnostic.

### Ingestion → triage pipeline

```
RawItem ──► dedup (hash + pgvector similarity)
        ──► LLM triage (classify: actionable/FYI/noise; extract ask, deadline, effort)
        ──► ActionableItem persisted (metadata only; raw body discarded by default)
        ──► candidate pool for the Prioritisation Engine
```

Triage runs in batches on workers to control LLM cost; urgent signals (direct @mention,
"urgent" flags, imminent deadlines) get a fast path.

### Prioritisation Engine

Hybrid, and always explainable:

1. **Rules pass (cheap, deterministic):** hard deadlines, calendar conflicts, requester
   weighting, staleness/rollover count.
2. **LLM pass (contextual):** ranks the shortlisted candidates against the user's profile
   and stated goals, and writes the one-line "why this is in your Top 3" justification.
3. Output is a *proposal* — the user always confirms. Every ranking factor is stored so
   the UI can show its reasoning.

### LLM Gateway

Single internal interface; providers are drivers behind it:

```ts
interface LlmProvider {
  complete(req: PromptRequest): Promise<PromptResponse>; // structured-output first
}
// drivers: AzureFoundryProvider (default), AnthropicProvider, OpenAiProvider
```

- **Default: Azure AI Foundry endpoint** (fits the Entra ID + Key Vault story; also the
  path to Copilot-adjacent deployment if the app is later distributed inside a tenant).
- Provider choice is per-deployment config, not code — a BYO-endpoint setting (base URL +
  key from Key Vault) covers enterprise tenants that mandate their own Foundry project.
- Prompt registry: versioned prompt templates per use case (triage, estimation, ranking,
  onboarding, nudge copy) with structured/JSON-schema outputs and eval fixtures.
- Guardrails: per-user token budgets, PII minimisation before send (see `05-security.md`),
  no raw traffic ever used for provider training (contractual, and enforced by config).

### Notification Service

- Channels: Web Push (PWA), email digest, Teams DM (via Graph, optional consent).
- All nudges flow through one scheduler that respects the profile (quiet hours, tone,
  max nudges/day) — no feature is allowed to send ad-hoc notifications directly.

## Frontend structure (Angular)

```
src/app/
  core/            # auth interceptor, API client, push registration
  onboarding/      # landing page + conversational interview flow
  triage/          # digest view, accept/snooze/dismiss
  top3/            # daily board, check-ins, evening wrap-up
  planner/         # calendar view, block proposals, re-plan flow
  profile/         # profile view/edit, recommendations feed
  settings/        # connectors, notification prefs, privacy (export/delete)
  shared/          # design system: low-stimulation theme, reduced-motion support
```

ADHD-informed UI rules: one primary action per screen, no infinite feeds, visible timers
for focus blocks, celebration micro-interactions on completion, respects
`prefers-reduced-motion`, dyslexia-friendly font option.
