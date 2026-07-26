// M0-FE-10 — frontend-spec §19.7.
//
//   "Playwright visual regression on the seed dataset"
//
// The seed dataset does not exist: no route in apps/web renders real data yet
// (D-018 — the probe pages render fixtures). So this file covers what there is
// to cover and is explicit about the rest:
//
//   COVERED today — the probe pages that render a fixed fixture with no clock,
//   no randomness and no network: /probe/entry, /probe/entry/private and
//   /probe/shells/reading, in both themes. Those exercise §9.2's entry system,
//   §7.1's reading and private columns, and §6's three faces — which is most of
//   what a seed-dataset snapshot would be looking at anyway.
//
//   PENDING — the seed dataset itself (M1), and the feed. /probe/api is
//   deliberately not snapshotted: it renders whatever the Prism mock returns,
//   which is not this repo's to pin.
//
// Baselines are per-platform (Playwright suffixes them `-darwin`/`-linux`).
// A run on a platform with no committed baseline SKIPS with an annotation
// rather than writing a new baseline and calling it a pass — a screenshot test
// that generates its own expectation is not a test. The skip is visible in the
// reporter and in the ci-gates summary; it is never silent.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = path.join(here, 'visual.spec.ts-snapshots');

const PAGES = [
  { route: '/probe/entry', name: 'probe-entry' },
  { route: '/probe/entry/private', name: 'probe-entry-private' },
  { route: '/probe/shells/reading', name: 'probe-shells-reading' },
] as const;

const THEMES = ['light', 'dark'] as const;

for (const { route, name } of PAGES) {
  for (const theme of THEMES) {
    test(`visual regression — ${route} (${theme})`, async ({ page, baseURL }, testInfo) => {
      const file = `${name}-${theme}.png`;
      const baseline = path.join(
        SNAPSHOT_DIR,
        `${file.replace(/\.png$/, '')}-${testInfo.project.name}-${process.platform}.png`,
      );
      const missing = !existsSync(baseline) && !process.env.EUTECTIC_WRITE_BASELINES;
      const reason =
        `PENDING-BASELINE: no committed baseline for ${process.platform} at ${path.relative(here, baseline)}. ` +
        'Generate with `pnpm test:e2e:update`, review the PNG by eye, and commit it.';
      if (missing) {
        // Printed, not just annotated. Playwright's list reporter shows a skipped
        // test as a dash and swallows the reason, so a suite that quietly skips
        // every case looks exactly like a suite that passed. scripts/ci-gates.mjs
        // scrapes stdout for PENDING-BASELINE and reprints it in the
        // NOT-YET-SATISFIED block — it can only do that if the line is on stdout.
        console.log(`  ${reason}`);
      }
      test.skip(missing, reason);

      // The theme is a server-side cookie (D-018 / M0-FE-09), so it is set
      // before the first paint rather than toggled after it — which is also
      // the only way to screenshot dark without capturing a flash of light.
      await page.context().addCookies([
        { name: 'theme', value: theme, url: baseURL ?? 'http://127.0.0.1:3480' },
      ]);
      await page.goto(route, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(file, { fullPage: true });
    });
  }
}
