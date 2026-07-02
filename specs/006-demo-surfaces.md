# Spec 006 — Undo, Connections Preview, Invite Preview, Wizard v2

Status: agreed
Derives from: user testing feedback on the live demo (2026-07-02): "can't see the
potential integrations", "cannot undo an action which is done", "can't see where I
will get the invites", "the wizard isn't the coolest".

## 1. Undo — UNDO-01…UNDO-03

- **UNDO-01** A `done` entry can return to `pending` (tap the check). Server rule:
  `done → pending` clears `doneAt`/`actualFeedback` and puts the task back to
  `in_top3`. Allowed until the plan is wrapped.
- **UNDO-02** Removing an entry stays possible pre-confirmation (existing); undo is
  the only post-completion reversal — no delete of a done entry.
- **UNDO-03** Undo copy is neutral (WIZ-11): no "are you sure", no guilt. One tap,
  it's pending again.

## 2. Connections preview — CONN-01…CONN-03

- **CONN-01** A "connections" surface (bottom sheet, same pattern as the pile) lists
  the planned connectors — Outlook Mail, Outlook Calendar, Teams, Jira, Confluence,
  Slack — each with a one-line "what I'll do with it" in the wizard's voice and a
  `coming soon` chip. No brand logos (trademark-safe glyph circles with initials).
- **CONN-02** The Outlook Calendar row explains invite-first booking explicitly:
  "I'll send you a meeting invite with a session plan — you just tap Accept."
- **CONN-03** Reached from a ghost button on Today. Purely informative in Phase 1;
  rows become connect flows when connectors land (docs/03-integrations.md).

## 3. Invite preview — INV-01…INV-03

- **INV-01** After the plan is confirmed, Today shows one dismissible **invite
  preview** card for the first entry with an estimate: styled like a mini calendar
  event (emerald rail, "Focus: <task>", suggested slot, "session plan inside"),
  labelled `preview`.
- **INV-02** Its Accept button doesn't book anything yet; it acknowledges through
  the wizard ("Once Outlook is connected, blocks like this land in your calendar —
  you just tap Accept") and dismisses the card.
- **INV-03** The card teaches the invite-first model (docs/03-integrations.md)
  without pretending a booking happened. Dismissal persists for the day.

## 4. Wizard v2 — WIZ2-01…WIZ2-05

- **WIZ2-01** Richer art, same geometric language: hat with band + bigger star,
  **beard** (the wizard finally looks like a wizard), eye highlights. All colours
  remain tokens.
- **WIZ2-02** The avatar *levitates*: a slow (~4s) vertical float with a soft
  elliptical shadow that scales in counterpoint. Present in all states; removed
  under reduced motion.
- **WIZ2-03** The hat star twinkles (scale + rotate) instead of only dimming.
- **WIZ2-04** `thinking` gains an orbiting spark; `celebrating` bounces once on
  entry and gains cheek dots.
- **WIZ2-05** Silhouette stays constant across states (WIZ-03 still holds); the
  beard is part of the silhouette, not an expression.

## 5. Greeting variety — GREET-01

- **GREET-01** The wizard's greeting respects the clock: morning / afternoon /
  evening variants from the copy registry (still ≤ 2 sentences, WIZ-11).

## Acceptance criteria

- AC-1: API test — `done → pending` restores the entry and the task's `in_top3`
  status; wrap-up afterwards still rolls it over correctly.
- AC-2: visual — connections sheet lists 6 connectors with coming-soon chips at
  360px; invite preview card renders after lock-in and dismisses.
- AC-3: avatar renders beard/band/star in all four states; reduced motion still
  yields zero running animations.
