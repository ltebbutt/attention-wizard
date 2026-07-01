# Attention Wizard — Data Model

Core entities (PostgreSQL). Names are indicative; the guiding rule is **store extracted
metadata, not raw traffic**.

```
User
  id, entra_oid, email, display_name, timezone
  created_at, last_active_at

Profile                     -- sensitive: encrypted at rest, never shared
  user_id (1:1)
  dimensions jsonb          -- {inattention: 0-4, time_blindness: 0-4, task_initiation: ...}
  working_style jsonb       -- {peak_hours: [...], nudge_tone: 'cheerleader', max_nudges: 5}
  interview_state jsonb     -- resumable onboarding progress
  version, updated_at       -- profiles are versioned; changes are proposed, not silent

Recommendation
  id, user_id, kind, title, rationale      -- rationale = the explainable "why"
  status (proposed|accepted|dismissed), created_at

ConnectorAccount
  id, user_id, provider (ms-graph|jira|confluence|...)
  scopes[], keyvault_secret_ref            -- tokens live in Key Vault, only a ref here
  sync_cursor jsonb, status, connected_at

ActionableItem              -- the normalised output of triage
  id, user_id, source (provider + type), external_ref, external_url
  title, ask_summary        -- LLM-extracted one-liner; NOT the raw body
  requester, deadline_at, deadline_confidence
  effort_estimate_min, effort_confidence
  classification (actionable|fyi|noise), urgency_signals jsonb
  embedding vector(1536)    -- pgvector, for dedup + "have I seen this ask before"
  status (new|snoozed|dismissed|in_top3|done|expired)
  created_at, snoozed_until

DailyPlan
  id, user_id, plan_date, status (proposed|confirmed|wrapped)
  proposed_at, confirmed_at, wrapped_at

Top3Entry                   -- max 3 per DailyPlan (enforced by constraint)
  id, daily_plan_id, actionable_item_id, position (1..3)
  status (pending|in_progress|done|rolled_over)
  effort_estimate_min, effort_actual_min   -- feeds personal estimation calibration
  calendar_event_id         -- Graph event id if a focus block was written
  checkins jsonb            -- [{at, response, sentiment}]

FocusBlock
  id, top3_entry_id, start_at, end_at, calendar_event_id, status (held|blown|replanned)

NudgeLog                    -- one table = one place to enforce "max nudges/day"
  id, user_id, channel, kind, sent_at, engaged (tapped|dismissed|ignored)

EstimationCalibration       -- rolling personal estimate-vs-actual factor
  user_id, category, ratio, sample_count, updated_at
```

## Retention & privacy rules (enforced by `privacy/` module jobs)

- Raw message/issue bodies: processed in memory during triage, **not persisted** (only
  `ask_summary` + metadata). A per-user opt-in can retain bodies for N days to improve
  triage quality; default off.
- `ActionableItem` rows: auto-expire (default 90 days after terminal status).
- `NudgeLog`: 30 days.
- `Profile`: kept until account deletion; export and hard-delete self-service endpoints
  (GDPR Arts. 15/17). Profile dimensions are health-adjacent → treated as special
  category data (see `05-security.md`).
- Embeddings are derived data: deleted whenever their `ActionableItem` is deleted.
