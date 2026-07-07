#!/usr/bin/env node
/** Spec 003 AC-4: full happy path at 360px against the demo build —
 *  add task → pick 3 → lock in → done ×3 → celebration visible. */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'apps/web/dist/web/browser');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

const server = createServer((req, res) => {
  const path = (req.url ?? '/').replace(/^\/attention-wizard/, '').split('?')[0] || '/';
  const file = join(DIST, path === '/' ? 'index.html' : path);
  const target = existsSync(file) ? file : join(DIST, 'index.html');
  res.setHeader('content-type', MIME[extname(target)] ?? 'application/octet-stream');
  res.end(readFileSync(target));
});
await new Promise((resolve) => server.listen(4173, resolve));

const executablePath = process.env.CHROME_BIN || '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 360, height: 740 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

try {
  await page.goto('http://localhost:4173/attention-wizard/', { waitUntil: 'networkidle' });
  await page.getByText('tap to pick').first().click();
  for (const title of ['task one', 'task two', 'task three']) {
    await page.fill('input[name="title"]', title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.waitForTimeout(120);
  }
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Pick', exact: true }).first().click();
    await page.waitForTimeout(120);
  }
  await page.getByRole('button', { name: /Lock in/ }).click();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Start' }).first().click();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.waitForTimeout(200);
  }
  // celebration: burst present (zero-size particle anchor → check attachment)
  await page.waitForSelector('.burst', { state: 'attached', timeout: 3000 });
  await page.waitForSelector('svg.wiz-celebrating', { timeout: 3000 });
  const horizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (horizontalScroll) throw new Error('horizontal scroll at 360px (TOP3-34)');
  if (errors.length) throw new Error('page errors: ' + errors.join(' | '));
  console.log('e2e ok: happy path + celebration at 360px, no page errors');
} finally {
  await browser.close();
  server.close();
}
