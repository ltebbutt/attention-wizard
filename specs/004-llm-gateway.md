# Spec 004 — LLM Gateway & Token Governance (skeleton)

Status: agreed
Derives from: `docs/02-architecture.md` §LLM Gateway, `docs/06-roadmap.md` Phase 0.

## Intent

One choke point for every LLM call, provider-open, with budgets and telemetry live from
the very first request. Phase 0 ships the gateway with the estimation use case wired;
triage/ranking/onboarding reuse it later without governance changes.

## Requirements

### Gateway core — LLM-01…LLM-05

- **LLM-01** Single internal interface; **no other module may import a provider SDK or
  call a provider URL** (enforced by lint rule / dependency-cruiser check):

  ```ts
  interface LlmGateway {
    complete<T>(req: {
      useCase: UseCase;            // 'estimation' | 'triage' | 'ranking' | 'onboarding' | 'nudge_copy'
      userId: string;
      prompt: PromptRef;           // registry key + version, never inline strings
      variables: Record<string, unknown>;
      schema: JsonSchema<T>;       // structured output, always
    }): Promise<GatewayResult<T>>;
  }
  ```

- **LLM-02** Providers are drivers behind the gateway: `openai-compatible` (base URL +
  key + model — covers Azure AI Foundry, OpenAI, Ollama, vLLM), `anthropic` (native).
  Driver + model chosen by per-deployment config (env), with per-use-case override
  (cheap model for triage, better model for onboarding).
- **LLM-03** Prompt registry: prompts are versioned files under `prompts/<useCase>/`,
  loaded at boot; a gateway call references `{useCase, version}`. Raw string prompts in
  application code are rejected in review.
- **LLM-04** Every response is validated against the request's JSON schema; invalid →
  one retry with repair instruction → `schema_invalid` result. Callers always receive a
  typed result or a typed failure, never raw text.
- **LLM-05** Provider content is untrusted: user/tool content is delimited in a data
  block; the gateway strips/refuses tool-call or action-like output (defence per
  `docs/05-security.md`).

### Token governance — LLM-10…LLM-15

- **LLM-10** Budget checks run **before dispatch**, in order: per-request cap (by use
  case) → per-user daily budget → per-feature hourly budget → global daily cost
  ceiling. First failure short-circuits with result `budget_denied` + which scope.
- **LLM-11** Budgets resolve from `LlmBudget` config (env-seeded in Phase 0; DB-backed
  later). Missing config = **deny**, not allow — fail closed.
- **LLM-12** Every call (including denied ones) writes one `LlmUsage` record: useCase,
  promptVersion, provider, model, input/output/cached tokens, costUsd (versioned price
  table), latencyMs, result, budgetSnapshot. **Never prompt or completion text.**
- **LLM-13** Token counts for accounting come from the provider response (`usage`
  field); estimates are used only for pre-dispatch budget checks.
- **LLM-14** Runaway guard: if a user's spend in the last hour > N× their trailing
  7-day hourly average (and above an absolute floor), the gateway locks that user's
  non-interactive use cases and emits an alert event.
- **LLM-15** `GET /admin/llm/usage` (dev-auth only in Phase 0) exposes per-day/per-use
  case aggregates — the "SQL-query dashboard" the roadmap requires at this stage.

### Degradation — LLM-20…LLM-21

- **LLM-20** On `budget_denied` or provider failure, callers receive a typed result
  that lets features degrade per the ladder (cheaper model → rules-only → defer).
  Gateway itself performs the cheaper-model hop when config marks a use case
  `degradable`; feature-level fallback is the caller's job.
- **LLM-21** Interactive use cases surface exhaustion honestly through the wizard
  (WIZ-11 tone); background use cases queue and retry after budget reset.

## Acceptance criteria

- AC-1: unit — call with no budget config is denied (fail closed) and still writes an
  `LlmUsage` row with `result: budget_denied`.
- AC-2: unit — 4th call breaching a 3-call/user/day test budget is denied; first 3 pass.
- AC-3: unit — schema-invalid provider response triggers exactly one repair retry,
  then returns `schema_invalid`.
- AC-4: integration (mock provider) — usage rows carry provider-reported token counts
  and correct cost from the price table.
- AC-5: lint/dep-cruise — importing the provider driver from outside `llm/` fails CI.
