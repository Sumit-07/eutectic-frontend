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
//
// ── M0-FE-14 — the Linux skip path is RETIRED, not the check ───────────────
// Until M0-FE-14, a run on a platform with no committed baseline SKIPPED with
// an annotation rather than writing a new baseline and calling it a pass — a
// screenshot test that generates its own expectation is not a test. That was
// right for a Linux baseline that could not yet be produced (CI had never
// executed a single gate on Linux, D-009). Real CI landed with this ticket, so
// the six `*-chromium-linux.png` baselines now exist and are committed
// alongside the `-darwin` set; a MISSING Linux baseline from here on means
// something is wrong (a new snapshot call with no baseline generated for it,
// or a baseline that was never committed) and is a hard FAILURE, not a skip.
// The failure message names the fix: dispatch the `regenerate-baselines` job
// in .github/workflows/ci.yml (the only sanctioned way to produce a
// `-linux` baseline from a macOS dev machine — Playwright can only write the
// platform it runs on), download the artifact, eyeball every PNG, commit.
// `EUTECTIC_WRITE_BASELINES=1` still lifts this locally, for exactly that flow
// and nothing else — it is not a way to make CI pass, because CI never sets it
// outside the dedicated job above.
//
// ── D-024 item 4 — a known limit of this gate, restated where it lives ─────
// This is a pixel-diff gate, not a human eye: `maxDiffPixelRatio` is 0.002
// (playwright.config.ts), so a REAL visual change under that ratio passes
// SILENTLY — no failure, no notice, nothing in the ci-gates summary. And
// `--update-snapshots` in its default "changed" mode only rewrites a baseline
// that already FAILED the comparison, so a passing-but-sub-threshold-changed
// baseline is never refreshed by the everyday flow either. FE-13 shipped a
// real ~0.0014 change that slipped exactly this way until an explicit
// before/after diff caught it. Protocol, standing: a PR that *intends* a
// visual change force-regenerates every baseline with
// `EUTECTIC_WRITE_BASELINES=1 pnpm --filter @eutectic/web exec playwright test
// --update-snapshots=all`, and review confines the old-vs-new diff to the
// intended region — a green run alone is never proof of pixel-identity for a
// sub-threshold change. "Changed" mode (`pnpm test:e2e:update`) stays the
// default for everyday runs; `=all` is only for a PR that means to move a
// baseline.

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
        `MISSING-LINUX-BASELINE: no committed baseline for ${process.platform} at ` +
        `${path.relative(here, baseline)}. The skip path retired at M0-FE-14 — dispatch the ` +
        '`regenerate-baselines` job in .github/workflows/ci.yml, download the `linux-baselines` ' +
        'artifact, review every PNG by eye, and commit it.';
      // Thrown, not skipped (M0-FE-14). A skip prints a dash in the list reporter
      // and swallows the reason, so a suite that quietly skips every case looks
      // exactly like a suite that passed — that was fine while Linux CI genuinely
      // did not exist yet (D-009), and is not fine now that it does. This is
      // deliberately NOT the retired `PENDING-BASELINE` sentinel that
      // scripts/ci-gates.mjs's NOT_YET_SATISFIED regex scrapes for a graceful
      // not-yet-satisfied notice: a missing Linux baseline is a hard failure, and
      // Playwright's own failure reporting (which ci-gates.mjs already treats as
      // a gate failure) is what surfaces it — no separate scrape needed.
      if (missing) {
        throw new Error(reason);
      }

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
