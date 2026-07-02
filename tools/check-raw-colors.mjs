#!/usr/bin/env node
/** Spec 001 AC-1 (DS-01): component stylesheets must use design tokens, never raw
 *  colours. Only the tokens file (apps/web/src/styles.scss) may define hex values. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const STYLE_DIR = join(ROOT, 'apps/web/src/app');
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d|hsla?\(/;
// Spec 005 AC-4: durations come from motion tokens, never literals (0s exempt)
const RAW_DURATION = /(?<![\w-])(?!0(?:\.0+)?m?s\b)\d+(?:\.\d+)?m?s\b/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(scss|css)$/.test(name)) yield path;
  }
}

const offenders = [];
for (const file of walk(STYLE_DIR)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (RAW_COLOR.test(line) || RAW_DURATION.test(line)) {
      offenders.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
    }
  });
}

if (offenders.length > 0) {
  console.error('Raw colours found outside the tokens file (DS-01):');
  for (const line of offenders) console.error('  ' + line);
  process.exit(1);
}
console.log('DS-01 ok: no raw colours outside the tokens file.');
