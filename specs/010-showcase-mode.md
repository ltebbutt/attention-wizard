# Spec 010 — Showcase Mode (shareable, memory-free demo)

Status: agreed
Derives from: user request 2026-07-07 ("deploy a free demo version, without memory,
with placeholders for integrations, code all correct").

## Intent

One deployment, two experiences. The existing demo keeps localStorage so the owner
can live with it day to day. Adding **`?fresh`** to the URL switches the same build
into **showcase mode**: nothing is read from or written to storage, example data is
seeded so first-time visitors see substance, and a reload wipes everything. Safe to
share publicly — no visitor data is ever retained.

## Requirements — SHOW-01…SHOW-05

- **SHOW-01** `?fresh` in the URL puts the app in showcase mode for that session.
  All persistence (demo store, profile, AI settings, AI call counter) becomes
  memory-only: no reads, no writes. Reload = clean slate.
- **SHOW-02** Storage access is centralised in one helper (`core/storage.ts`);
  stores may not touch `localStorage` directly (keeps the guarantee auditable).
- **SHOW-03** In showcase mode the pile is seeded with three example tasks so the
  picking experience is immediate; the header chip reads `showcase` instead of
  `demo`.
- **SHOW-04** Integration placeholders (connections sheet, invite preview) behave
  exactly as in the demo — visible, honest, "coming soon".
- **SHOW-05** BYO-AI still works in showcase mode but the key lives in memory only
  and dies with the tab (stated in the sheet copy is not required; SHOW-01 covers it).

## Share URL

`https://ltebbutt.github.io/attention-wizard/?fresh`

## Acceptance criteria

- AC-1: in `?fresh`, adding tasks + reloading yields the seeded state again
  (nothing persisted); without `?fresh`, persistence behaves as before.
- AC-2: grep check — no `localStorage` outside `core/storage.ts` (web app).
- AC-3: header chip shows `showcase` under `?fresh`, `demo` otherwise.
