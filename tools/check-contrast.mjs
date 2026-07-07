#!/usr/bin/env node
/** Spec 001 AC-3 (DS-04): WCAG contrast of core token pairs must be ≥ 4.5:1.
 *  Parses the tokens straight from styles.scss so drift is impossible. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const scss = readFileSync(join(ROOT, 'apps/web/src/styles.scss'), 'utf8');

const tokens = {};
for (const [, name, hex] of scss.matchAll(/(--aw-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
  tokens[name] = hex;
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// DS-04 pairs: text token on background token, minimum required ratio
const PAIRS = [
  ['--aw-ink', '--aw-bg', 4.5],
  ['--aw-ink', '--aw-surface', 4.5],
  ['--aw-ink-mute', '--aw-surface', 4.5],
  ['--aw-ink-mute', '--aw-bg', 4.5],
  ['--aw-ink-on-emerald', '--aw-emerald', 4.5],
  ['--aw-emerald', '--aw-bg', 3.0], // large text / UI accents
];

let failed = false;
for (const [fg, bg, min] of PAIRS) {
  if (!tokens[fg] || !tokens[bg]) {
    console.error(`Missing token ${fg} or ${bg}`);
    failed = true;
    continue;
  }
  const r = ratio(tokens[fg], tokens[bg]);
  const ok = r >= min;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${fg} on ${bg}: ${r.toFixed(2)}:1 (min ${min}:1)`);
}

process.exit(failed ? 1 : 0);
