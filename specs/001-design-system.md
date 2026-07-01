# Spec 001 — Design System

Status: agreed
Derives from: `docs/02-architecture.md` (mobile-first rules), user aesthetic direction.

## Intent

A dark, minimalist visual language: **black + vibrant emerald**, generously rounded
edges, one primary action per screen. Calm by default; the emerald is spent sparingly —
it marks *the* thing that matters right now, never decoration.

## Requirements

### Colour — DS-01…DS-06

- **DS-01** All colours come from CSS custom properties on `:root`; components never
  hard-code hex values.
- **DS-02** Core palette:

  | Token | Value | Use |
  |---|---|---|
  | `--aw-bg` | `#0A0E0D` | App background (near-black, green undertone) |
  | `--aw-surface` | `#121816` | Cards, sheets |
  | `--aw-surface-2` | `#1A2320` | Raised/hover surfaces |
  | `--aw-line` | `#243029` | Hairline borders |
  | `--aw-emerald` | `#19E68C` | Primary actions, active states, the wizard |
  | `--aw-emerald-press` | `#10C475` | Pressed state |
  | `--aw-emerald-soft` | `rgba(25, 230, 140, 0.12)` | Tinted fills, focus rings |
  | `--aw-ink` | `#F1F7F4` | Primary text |
  | `--aw-ink-mute` | `#93A89E` | Secondary text |
  | `--aw-ink-on-emerald` | `#04140C` | Text on emerald fills |
  | `--aw-amber` | `#F5C044` | Gentle warnings (never red-alarm for missed tasks) |
  | `--aw-rose` | `#F2708A` | Destructive actions only |

- **DS-03** Emerald budget: at most **one** solid-emerald element visible per screen
  (the primary action or the active Top 3 item). Everything else uses
  `--aw-emerald-soft` or outline treatments.
- **DS-04** Text contrast ≥ 4.5:1 against its background (`--aw-ink-mute` on
  `--aw-surface` must pass; verified in CI where feasible).
- **DS-05** Dark theme only in v1 (black *is* the brand). Structure tokens so a light
  theme is a token swap, not a refactor.
- **DS-06** Missed/overdue states use amber + supportive copy, never red.

### Shape & depth — DS-10…DS-13

- **DS-10** Radius tokens: `--aw-r-sm: 10px`, `--aw-r-md: 16px`, `--aw-r-lg: 24px`,
  `--aw-r-pill: 999px`. Cards use `md`/`lg`; buttons and chips are pill. No square
  corners anywhere in the UI.
- **DS-11** Depth comes from surface steps (`bg → surface → surface-2`) and hairline
  borders, not drop shadows. Max one soft shadow, reserved for the bottom sheet.
- **DS-12** Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 (`--aw-s1…s7`); no off-scale
  margins.
- **DS-13** Buttons: primary = solid emerald pill; secondary = outline pill; ghost =
  text only. Minimum touch target 44×44px (from `docs/02-architecture.md`).

### Typography — DS-20…DS-22

- **DS-20** Single family: `Inter` with system-ui fallback stack. Two weights only
  (400, 600). Optional dyslexia-friendly family behind a settings toggle (later).
- **DS-21** Type scale: 32/24/18/16/14 px (`display/title/lead/body/small`), line-height
  ≥ 1.4 for body.
- **DS-22** Numbers that matter (Top 3 position, timers) render large and calm — no
  blinking, no countdown anxiety; timers count *up* elapsed focus, not down to failure.

### Minimalism & motion — DS-30…DS-33

- **DS-30** One primary action per screen. If a screen needs two, it's two screens.
- **DS-31** No decorative imagery, gradients, or background patterns. The wizard avatar
  (Spec 002) is the only illustrative element.
- **DS-32** Motion: 150–250ms ease-out transitions; a single celebration moment on task
  completion is the only exuberant animation. All motion honours
  `prefers-reduced-motion` (fall back to opacity fades).
- **DS-33** Empty states speak in the wizard's voice, one sentence, one action.

## Acceptance criteria

- AC-1: a lint/grep check fails the build if a component stylesheet contains a raw hex
  colour (tokens file exempt).
- AC-2: rendering the demo/storybook page at 360px shows no horizontal scroll.
- AC-3: automated contrast check of token pairs listed in DS-04 passes.
- AC-4: visual review confirms ≤1 solid-emerald element on each core screen.
