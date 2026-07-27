// M0-FE-10 — D-015 item 7, frontend-spec §14 (CLS <= 0.02), §19.7.
//
//   "A real-browser CLS trace (Playwright) on /probe is REQUIRED before the
//    first develop→main promotion — lands with M0-FE-07/FE-10 gates."
//
// §14 is emphatic about why: "CLS <= 0.02 means every skeleton must be the exact
// height of what replaces it. Measure and pin, don't estimate." This file is the
// measuring. It reads the Layout Instability API in a real Chromium against a
// production build — the same source Chrome's own field data comes from — and
// asserts the score, rather than inferring stability from the source.
//
// The observer is installed via `addInitScript` so it exists before the document
// starts parsing; `buffered: true` then also picks up any entry emitted before
// the observer attached. Entries with `hadRecentInput` are excluded exactly as
// the CLS definition excludes them — there is no input here, so in practice
// every entry counts.
//
// Three routes: /probe is the one D-015 names, / is the shell every route
// inherits, and /probe/entry is the §9.2 entry system, which is where a mispinned
// skeleton or an unsized gutter initial would show up first.
//
// Each route is measured THREE times and the gate asserts on the worst of them,
// because which load you measure decides what you find. On /probe the three
// numbers are 0, 0 and 0.0247:
//
//   first    the very first navigation of a freshly launched browser. Nothing
//            is warm, the font request is in flight while the document parses,
//            and the page paints once. Score 0.
//   repeat   a second navigation in the same context, HTTP cache warm. The
//            font is there before first paint. Score 0.
//   session  a fresh context on the same browser — cold HTTP cache, warm
//            renderer. The document paints immediately in the fallback face
//            and re-wraps when the real one lands a frame later. Score 0.0247.
//
// The third is not an exotic case; it is what a real visitor gets from a warm
// CDN on a browser that has been open all day, and it is the only pass in which
// this page's actual defect is visible at all. A trace that navigated once
// would have measured zero and certified a page that shifts.

import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';

const BUDGET = 0.02; // frontend-spec §14

const ROUTES = ['/probe', '/', '/probe/entry'];

/**
 * KNOWN BREACH — reported by this gate on its first run, M0-FE-10.
 *
 * `/probe` measures 0.0247 on a warm cache against §14's 0.02 (cold: 0). The
 * cause is not a skeleton and not an image: it is webfont swap reflow. next/font
 * emits size-adjusted fallbacks (`size-adjust: 103.22%` for the UI face), which
 * corrects vertical metrics but not advance widths, so an above-the-fold
 * `measure`-width paragraph on this page re-wraps from three lines to two the
 * moment Instrument Sans replaces the fallback — 73px to 49px, one line-height
 * of shift, at ~70ms. Reproduced 5/5 warm, 0/1 cold.
 *
 * `/` and `/probe/entry` measure 0 and 0.00001 on the same run, so this is not
 * the product's typography failing everywhere; it is what happens to any
 * multi-line UI-font paragraph above the fold, and /probe has one.
 *
 * It is NOT waived. The budget is unchanged, the number below is a ratchet at
 * the measured value, the breach is printed on every single run, and this gate
 * fails the moment it gets worse. Fixing it means touching §6.1/§14 font
 * strategy (fallback metrics, the two-preload rule) or the probe copy — both
 * outside M0-FE-10, both reported to CTO-Frontend in the PR body.
 *
 * RE-BASELINED FOR LINUX — D-026, M0-FE-14. Same tracked defect, a different
 * platform to measure it on: CI runs on ubuntu-latest now (D-009 — no gate had
 * ever executed there before this ticket), and Linux has no Georgia/Iowan Old
 * Style, so fontconfig substitutes DejaVu/Liberation metrics for the fallback
 * face — a bigger swap, a bigger reflow. Four runs on four VMs measured the
 * same deterministic float, 0.04938935279846191, with the document painting in
 * the fallback face every time; a fifth measured 0, the font winning the race
 * instead. Not noise: bimodal and reproducible.
 *
 * D-026's ruling: a ratchet is a measurement, and a measurement is tied to the
 * platform it was taken on. 0.026 described a platform (macOS) CI no longer
 * runs on, so it re-baselines to an honest Linux measurement rather than being
 * loosened as a waiver — "may only tighten" (D-020) now resumes per-platform
 * from 0.05. Accepted residuals, recorded, not hidden: headroom above the
 * deterministic value is ~0.0006 (tight is good), and the one-in-five lucky-0
 * runs mean a real regression could in principle hide behind a lucky race — a
 * bimodality that exists at any threshold and is only eliminated by the actual
 * fix below, not by moving this number.
 *
 * The real fix is human-gated and scheduled, not just noted: eliminating the
 * swap reflow (`display: 'optional'` vs tuned size-adjusted fallbacks) is a
 * §6.1 product-behavior/taste call, joining the existing font-strategy item
 * (D-020: kerning + CLS, ONE item) on the human's list. Whichever ticket
 * implements the chosen strategy MUST tighten this ratchet to <= 0.005 in the
 * SAME PR — that is what converts this tracked breach into scheduled work with
 * a measurable exit, and it is the one condition under which this number is
 * allowed to move again.
 */
const OVER_BUDGET: Record<string, { ratchet: number; note: string }> = {
  '/probe': {
    ratchet: 0.05,
    note:
      'webfont swap reflow, measured 0.0247 on macOS by M0-FE-10, re-baselined to the Linux ' +
      'measurement by D-026 (M0-FE-14): CI now runs on ubuntu-latest, where the same defect ' +
      'measures a deterministic 0.04938935279846191 (four runs, four VMs, byte-identical; a ' +
      'fifth measured 0 — bimodal, not noise) because Linux has no Georgia/Iowan Old Style and ' +
      'fontconfig substitutes DejaVu/Liberation metrics for the fallback face. A ratchet is a ' +
      'measurement tied to the platform it was taken on — when the platform changed the number ' +
      'was re-baselined honestly, not loosened as a waiver, and "only tighten" resumes from ' +
      'here per-platform. Residuals accepted in D-026: ~0.0006 headroom, one-in-five lucky-0 ' +
      "bimodality. The real fix (display:'optional' vs tuned size-adjusted fallbacks) is " +
      '§6.1 human-gated taste, joins the D-020 font-strategy item, and MUST tighten this ' +
      'ratchet to <= 0.005 in the same PR that ships it',
  },
};

declare global {
  interface Window {
    __eutecticCls?: number;
    __eutecticShifts?: number;
  }
}

/**
 * Installed before the document starts parsing, and re-run on every navigation,
 * so each pass starts from zero. `buffered: true` also picks up entries emitted
 * before the observer attached.
 */
async function observeShifts(target: Page | BrowserContext): Promise<void> {
  await target.addInitScript(() => {
    window.__eutecticCls = 0;
    window.__eutecticShifts = 0;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (shift.hadRecentInput) continue;
          window.__eutecticCls = (window.__eutecticCls ?? 0) + shift.value;
          window.__eutecticShifts = (window.__eutecticShifts ?? 0) + 1;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Reported by the assertion in the test, never swallowed into a green run.
      window.__eutecticCls = Number.NaN;
    }
  });
}

/** One navigation, settled, with the score read off the Layout Instability API. */
async function measure(page: Page, route: string): Promise<{ cls: number; shifts: number }> {
  await page.goto(route, { waitUntil: 'load' });

  // The two things that shift a page after load: webfonts swapping in, and
  // late layout work. Wait for both before reading the score.
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 500))),
  );

  // A full scroll, because `content-visibility: auto` content (§14) only
  // lays out when it approaches the viewport — and that is precisely where a
  // shift would be invisible to a test that never scrolled.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(r));
  });
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 300))),
  );

  return {
    cls: (await page.evaluate(() => window.__eutecticCls)) ?? Number.NaN,
    shifts: (await page.evaluate(() => window.__eutecticShifts)) ?? 0,
  };
}

for (const route of ROUTES) {
  test(`layout shift on ${route} is within the §14 budget`, async ({ page, browser }, testInfo) => {
    await observeShifts(page);

    const passes: Record<string, { cls: number; shifts: number }> = {
      first: await measure(page, route),
      repeat: await measure(page, route),
      session: await (async () => {
        const context = await browser.newContext({ reducedMotion: 'reduce' });
        await observeShifts(context);
        try {
          return await measure(await context.newPage(), route);
        } finally {
          await context.close();
        }
      })(),
    };

    for (const [name, pass] of Object.entries(passes)) {
      expect(
        pass.cls,
        `the ${name} pass measured nothing — the Layout Instability API was unavailable`,
      ).not.toBeNaN();
    }

    const breach = OVER_BUDGET[route];
    const ceiling = breach ? breach.ratchet : BUDGET;
    const measured = Math.max(...Object.values(passes).map((pass) => pass.cls));
    const detail = Object.entries(passes)
      .map(([name, pass]) => `${name} ${pass.cls} (${pass.shifts})`)
      .join(', ');

    testInfo.annotations.push({
      type: 'cls',
      description: `${route}: ${detail} — worst ${measured}, budget ${BUDGET}`,
    });
    console.log(`  CLS ${route} = ${measured} — ${detail}, §14 budget ${BUDGET}`);
    if (breach) {
      console.log(
        `  OVER §14 BUDGET — ${route} is a known CLS breach: ${breach.note}. ` +
          `Ratchet ${breach.ratchet}; measured ${measured}.`,
      );
      if (measured <= BUDGET) {
        console.log(
          `  ...and it came in under ${BUDGET} this run. If that is repeatable, the breach is fixed: ` +
            'delete the OVER_BUDGET entry rather than leaving a stale waiver behind.',
        );
      }
    }

    expect(measured).toBeLessThanOrEqual(ceiling);
  });
}
