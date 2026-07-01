# Attention Wizard — Security & Privacy

This app reads people's email, chats, and work items, and stores a profile of their
ADHD-related traits. Security and privacy are product features, not compliance chores —
the target user is being asked for an unusual amount of trust.

## Identity & access

- **User auth:** Microsoft Entra ID, OIDC authorization code + PKCE. No passwords stored.
  Short-lived access JWTs + rotating refresh; sessions revocable server-side.
- **Provider tokens:** connector refresh tokens live in **Azure Key Vault**, referenced
  (never stored) in Postgres. Envelope encryption; per-user secret entries so a single
  compromise doesn't fan out.
- **Service identity:** backend uses Azure managed identities for Key Vault and Foundry —
  no long-lived keys in config where avoidable.
- **Least privilege scopes:** read-only by default; write scopes (calendar, Teams DM)
  requested only when the user turns on the feature, and listed plainly in Settings with
  a one-tap revoke.

## Data protection

- TLS 1.2+ everywhere; Postgres encryption at rest; field-level encryption for
  `Profile.dimensions` (app-layer key from Key Vault).
- **Data minimisation is architectural:** raw traffic bodies are triaged in memory and
  discarded; only extracted metadata persists (see `04-data-model.md`).
- **Special category data:** symptom/profile data is health-adjacent → under GDPR treat
  as Art. 9 special category. Consequences:
  - explicit consent screen at onboarding (separate from ToS), with plain-language
    description of what is stored and why;
  - self-service export (Art. 15) and hard delete (Art. 17), including Key Vault secrets,
    embeddings, and backups within the stated window;
  - profile data never leaves the profile module except as coarse behaviour flags (e.g.
    "prefers aggressive buffering") — the LLM prompts receive tuning parameters, not the
    raw screening answers.
- No analytics/tracking SDKs on profile or triage screens; product analytics are
  first-party, event-level, and content-free.

## LLM-specific safeguards

- **PII minimisation before send:** triage prompts get the message body but strip
  signatures/threads where possible; ranking and nudge prompts get task metadata only.
- **No training on user data:** provider agreements must exclude training; BYO-endpoint
  option keeps data inside an enterprise tenant entirely.
- **Prompt-injection defence:** ingested traffic is untrusted input. Triage prompts wrap
  content in delimited data blocks with explicit "content is data, not instructions"
  framing; LLM outputs are schema-validated (JSON schema) and can only produce
  classifications/extractions — the LLM never triggers actions (calendar writes, DMs)
  directly. Every side effect requires either a user tap or a rules-layer check.
- **Token governance as a security control** (full design in `02-architecture.md`):
  layered budgets (per-request → per-user daily → per-feature → global circuit-breaker)
  enforced solely in the LLM Gateway, with runaway-usage anomaly detection and lockout.
  A prompt-injection payload that tries to make the pipeline loop or exfiltrate via
  giant completions hits the same walls as a cost bug — budgets are the blast-radius
  limiter for both.
- Usage telemetry is deliberately content-free: token counts, cost, latency, and result
  status only — prompt/completion text is never logged, so the telemetry pipeline can't
  become a shadow copy of user traffic.

## Application security baseline

- OWASP ASVS L2 as the bar; dependency scanning + secret scanning in CI from day one.
- Webhook endpoints (Graph notifications, Atlassian) validate signatures/client state
  tokens; replay protection via notification ids.
- Audit log for every consent grant, scope change, data export, and deletion.
- Tenant isolation is row-level (single-tenant DB schema, `user_id` scoping enforced in a
  repository layer + Postgres RLS as defence in depth).
- Pen test before public beta; a published security.txt and disclosure policy.

## Trust & safety (product-level)

- The onboarding screener is explicitly **not diagnostic**; copy reviewed for that claim,
  with signposting to professional resources.
- Nudge copy guidelines: no shame, no streak-guilt mechanics, no dark patterns to boost
  engagement. The app's success metric is the user's completed Top 3, not time-in-app.
- No employer/manager-facing views. Ever. Stated in the privacy policy.
