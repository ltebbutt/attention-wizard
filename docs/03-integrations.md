# Attention Wizard — Integrations

All integrations are OAuth 2.0 (authorization code + PKCE), least-privilege scopes,
tokens encrypted in Azure Key Vault, revocable from Settings at any time. Read scopes are
requested at connect time; **write scopes (calendar blocking, Teams DM nudges) are asked
for separately, only when the user enables that feature** — progressive consent builds
trust.

## Microsoft Graph (Outlook + Teams — one connector)

| Capability | Graph API | Scope | Mode |
|---|---|---|---|
| Read mail | `/me/messages` (delta) | `Mail.Read` | Delta query + change notifications |
| Read calendar | `/me/calendar/events` (delta) | `Calendars.Read` | Delta + notifications |
| Focus-block invites | Service mailbox `POST /users/{svc}/events` with user as attendee | none on the user | Default (see below) |
| Direct block write | `POST /me/events` | `Calendars.ReadWrite` | Optional power mode only |
| Teams mentions/DMs | `/me/chats/getAllMessages` or per-chat delta | `Chat.Read` | Notifications + poll fallback |
| Send nudge as Teams DM | `POST /chats/{id}/messages` | `Chat.ReadWrite` | Optional, off by default |
| Presence-aware nudging | `/me/presence` | `Presence.Read` | Optional (don't nudge mid-meeting) |

### Invite-first calendar blocking

The default booking flow sends the user a **meeting invite** rather than writing to
their calendar:

1. The planner finds a free slot (via the user's `Calendars.Read` delta feed) and
   drafts a **session plan**: the task, why it made the Top 3, a suggested first step
   (task-initiation helper), the effort estimate, and a link back to the app.
2. An app-owned **service mailbox** (e.g. `wizard@attention-wizard.app`) creates the
   event in *its own* calendar with the user as the only attendee — an application
   permission scoped to that single mailbox via Graph application access policy. The
   user receives a normal Outlook meeting invitation with the session plan as the body.
3. The user taps **Accept** — the block lands on their calendar like any meeting.
   Decline and propose-new-time work natively; the connector reads the response from
   the service mailbox event and feeds it back (declines teach the prioritiser, counter
   proposals reschedule the block).
4. Fallback for non-Graph users later: plain email with an `ICS METHOD:REQUEST`
   attachment — the same accept flow works in any calendar client.

Why invite-first is the default: the app needs **zero write scopes on the user's
data** for its flagship feature, the accept tap is a moment of deliberate commitment
(which the ADHD literature suggests beats silent auto-scheduling for follow-through),
and RSVP state gives free telemetry on whether proposed blocks are realistic.

Notes:
- `Chat.Read` for all-chats access can require admin consent in many tenants — the
  connector must degrade gracefully to mail+calendar only and say so clearly in the UI.
- Use Graph **delta queries** as the backbone and **change notifications (webhooks)**
  for freshness; subscriptions need renewal jobs (max lifetime ~3 days for messages).
- Throttling: honour `Retry-After`, batch with `$batch`, per-user sync cursors.

## Jira Cloud

| Capability | API | Mode |
|---|---|---|
| Assigned/mentioned issues | REST v3 `/search` with JQL (`assignee = currentUser() AND updated > cursor`) | Poll (webhooks need admin) |
| Issue detail/comments | `/issue/{key}` | On demand |
| Optional: transition/comment | `/issue/{key}/transitions` | Later phase, on user action |

- Auth: Atlassian OAuth 2.0 (3LO) with `read:jira-work` (+ `write:jira-work` later);
  refresh via rotating refresh tokens.
- Signals mined: assignments, @mentions, due dates, sprint boundaries, priority field.

## Confluence Cloud

| Capability | API | Mode |
|---|---|---|
| @mentions & inline tasks | `/wiki/rest/api/content/search` (CQL: `mention = currentUser()`), inline-tasks API | Poll |
| Page context for triage | `/wiki/rest/api/content/{id}` | On demand |

- Auth: same Atlassian 3LO app as Jira (`read:confluence-content.summary`).
- Confluence inline tasks assigned to the user are first-class actionable items.

## Connector roadmap ("and more")

The `Connector` interface (see `02-architecture.md`) makes these additive:

1. **Slack** (mentions/DMs) — near-parity with Teams for non-MS shops.
2. **GitHub / Azure DevOps** — review requests and assigned work items.
3. **Google Workspace** (Gmail/Calendar) — opens the app to non-Microsoft users; requires
   making Entra ID one of several identity providers rather than the only one. Flagged
   now so auth design keeps the door open (design `auth/` around OIDC generically).
4. **ICS feed import** — cheap universal calendar read fallback.

## LLM endpoint wiring

- **Default:** Azure AI Foundry project endpoint — model deployment name, endpoint URL,
  and key (or better, managed identity) held in Key Vault; swappable per environment.
- **BYO endpoint:** enterprise tenants can point the LLM Gateway at their own Foundry /
  Azure OpenAI deployment so traffic never leaves their tenancy.
- **Copilot note:** Microsoft 365 Copilot is not a callable general-purpose API for this
  use case; the practical "Copilot" path is (a) Foundry-hosted models for our own
  pipeline — the default above — and (b) optionally surfacing Attention Wizard *inside*
  Teams later as a message extension / plugin. Treat (b) as a distribution channel in a
  later phase, not core architecture.
- Provider drivers for Anthropic and OpenAI APIs exist behind the same gateway interface
  from day one to avoid lock-in and enable model evals.
