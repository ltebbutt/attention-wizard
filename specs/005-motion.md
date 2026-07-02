# Spec 005 — Motion & Polish

Status: agreed
Derives from: spec 001 (DS-22, DS-30..33), spec 002 (WIZ-03..04), user direction:
"best in class animations and styling".

## Intent

Motion that makes the app feel alive and *calming*, never busy. Every animation earns
its place by communicating state (something started, something finished, something
needs you) — decoration-only motion is rejected in review. One exuberant moment exists
in the whole app: completing your third task.

## Requirements

### Motion tokens — MO-01

All timing/easing from tokens in the tokens file; components never hard-code durations:

| Token | Value | Use |
|---|---|---|
| `--aw-t-fast` | 150ms | button presses, hovers |
| `--aw-t-base` | 220ms | state changes, enters |
| `--aw-t-slow` | 400ms | sheet slide, celebration lead-in |
| `--aw-ease` | cubic-bezier(0.2, 0.8, 0.2, 1) | default swift-out |
| `--aw-ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) | pops (check, celebration) |

### Micro-interactions — MO-10…MO-13

- **MO-10** Buttons: press scales to 0.97 (`--aw-t-fast`); primary hover brightens via
  `--aw-emerald-press`. No tap-highlight flash (`-webkit-tap-highlight-color`).
- **MO-11** Slots and pile items enter with a fade-rise (12px, `--aw-t-base`),
  staggered ≤ 60ms per item, on first render only.
- **MO-12** Completing an entry: the check pops in with spring easing; the title's
  strikethrough *draws itself* left-to-right (`--aw-t-base`).
- **MO-13** The active (in-progress) slot breathes: a slow (3s) background pulse
  between `--aw-emerald-soft` and transparent. Subtle enough to ignore, present enough
  to anchor the eye.

### Focus timer — MO-20 (implements DS-22)

The in-progress slot shows elapsed focus time ("12 min in"), counting **up**, updating
per half-minute. Calm styling (`aw-small`), no seconds, no countdown, no deadline red.

### Bottom sheet — MO-30

The pile opens as a bottom sheet on mobile: slides up (`--aw-t-slow`), scrim fades in
behind (`--aw-scrim` token), tap-scrim-to-close, respects `env(safe-area-inset-bottom)`.
This sheet carries the app's single permitted shadow (DS-11).

### Celebration — MO-40

Completing the third task triggers the one exuberant moment: the wizard switches to
`celebrating`, and an emerald star-burst (pure CSS/SVG, 6–8 particles, ~1.2s, plays
once) radiates from the avatar. No libraries, no looping, no sound.

### Wizard life — MO-50

- Idle: slow blink every ~4s + hat-star shimmer (existing WIZ-04).
- State changes (hat tilt, expressions) transition smoothly via CSS transforms
  (`--aw-t-base`) instead of snapping.

### Discipline — MO-60…MO-62

- **MO-60** Only `transform` and `opacity` animate (compositor-friendly); never
  layout properties. The active-slot pulse (background-color) is the sole exception.
- **MO-61** All motion is removed under `prefers-reduced-motion: reduce` (existing
  global kill-switch). The app must remain fully usable and legible with zero motion.
- **MO-62** No animation buys features: everything remains reachable/complete-able
  before any animation finishes (no "wait for the transition" states).

## Acceptance criteria

- AC-1: with reduced motion, no element reports a running animation after load.
- AC-2: visual review at 360px: enter stagger, check pop, strike draw, sheet slide,
  celebration burst all present; nothing loops except the idle blink/shimmer and the
  active-slot pulse.
- AC-3: the focus timer renders on an in-progress entry and shows minutes, not seconds.
- AC-4: token check extended: no raw duration values (`\d+m?s`) in component styles
  except `0s`/`none` (tokens file exempt).
