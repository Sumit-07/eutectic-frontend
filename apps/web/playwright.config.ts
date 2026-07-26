// M0-FE-10 — frontend-spec §19.7 and D-015 item 7.
//
// Two things run here, and they are at very different stages of readiness:
//
//   · e2e/cls.spec.ts — REAL, and required. D-015 item 7: "A real-browser CLS
//     trace (Playwright) on /probe is REQUIRED before the first develop→main
//     promotion — lands with M0-FE-07/FE-10 gates." §14 budgets CLS at 0.02.
//     This is that trace, measured through the Layout Instability API in a real
//     Chromium, not inferred from source.
//
//   · e2e/visual.spec.ts — the §19.7 harness. §19.7 asks for visual regression
//     "on the seed dataset"; there is no seed dataset (it arrives with M1's
//     real data routes). Rather than ship an empty file, it snapshots the probe
//     pages that render deterministically today, and skips — loudly, with an
//     annotation the reporter prints — where a baseline for the current
//     platform does not exist. Adding the seed specs later is a new file in
//     this directory and nothing else.
//
// The server is a production `next start`, not `next dev`: dev-mode HMR and
// unminified React would make both the CLS number and the pixels meaningless.
// Port 3480 is this ticket's assigned port.
//
// Browsers are the ones already installed in the workspace; this config never
// downloads anything.

import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.EUTECTIC_E2E_PORT ?? 3480);
export const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  outputDir: './test-results',

  // A layout-shift measurement is a measurement: it must not be taken while
  // three other pages are competing for the same CPU.
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // frontend-spec §11: motion only where the spec lists it. Freezing what
      // motion there is (the Skeleton shimmer) is what makes a screenshot a
      // regression test rather than a coin flip.
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      maxDiffPixelRatio: 0.002,
    },
  },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // A fixed viewport, because a shifted layout and a resized layout look the
    // same in a diff.
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    // §11: motion only where the spec lists it. `reducedMotion` is a context
    // option rather than a top-level test option in Playwright 1.62, so it goes
    // here — and every context this suite opens by hand must repeat it.
    contextOptions: { reducedMotion: 'reduce' },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],

  webServer: {
    command: `./node_modules/.bin/next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
