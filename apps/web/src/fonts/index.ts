import localFont from 'next/font/local';

/*
 * frontend-spec §6.1 — three faces, three roles, self-hosted, latin subset,
 * combined ≤100KB (§14; enforced by scripts/check-font-budget.js, wired as
 * this app's "test" script).
 *
 * Sources (M0-FE-02 PR body has the exact subsetting commands):
 *   - Newsreader:      github.com/google/fonts, ofl/newsreader — variable TTF,
 *                       opsz + wght axes retained.
 *   - Instrument Sans: github.com/google/fonts, ofl/instrumentsans — variable
 *                       TTF, wght axis retained (wdth pinned to 100 — the spec
 *                       only names wght for this face).
 *   - Commit Mono:     github.com/eigilnikolajsen/commit-mono — variable TTF
 *                       (src/fonts/fontlab/CommitMonoV143-VF.ttf; the tagged
 *                       release only ships static weights), wght axis
 *                       retained (ital pinned to 0 — no italic voice in spec).
 * All three: wght axis narrowed to 400:600 (frontend-spec §6.3 weight policy —
 * 400/500 general use, 600 only for names/buttons, never 700+) via
 * `fonttools varLib.instancer`, then subset to latin with `pyftsubset
 * --flavor=woff2`, tabular numerals (`tnum`) kept, pair kerning (`kern`)
 * dropped — the biggest single contributor to file size at this glyph count
 * and not load-bearing for the type scale — to land combined weight well
 * inside the 100KB budget. OFL license files ship alongside each face.
 *
 * Wiring to `packages/tokens` (M0-SH-09 already emits --eu-font-prose/ui/mono
 * as literal family-name stacks): next/font/local generates a hashed,
 * unpredictable family name per build, so the literal 'Newsreader' etc. baked
 * into the tokens stack can never match what actually loaded. Each font below
 * is given a `variable` instead, and globals.css binds --eu-font-* to those
 * three CSS custom properties exactly once. Tokens remain the only thing any
 * component ever reads; nothing in the rest of this app restates a family
 * stack — see globals.css for the other half of this seam.
 */

export const prose = localFont({
  src: './newsreader/Newsreader-Variable.woff2',
  weight: '400 600',
  display: 'swap',
  preload: true,
  variable: '--font-prose-loaded',
  fallback: ['Georgia', 'Iowan Old Style', 'serif'],
});

export const ui = localFont({
  src: './instrument-sans/InstrumentSans-Variable.woff2',
  weight: '400 600',
  display: 'swap',
  preload: true,
  variable: '--font-ui-loaded',
  fallback: ['system-ui', 'sans-serif'],
});

export const mono = localFont({
  src: './commit-mono/CommitMono-Variable.woff2',
  weight: '400 600',
  display: 'swap',
  preload: false,
  variable: '--font-mono-loaded',
  fallback: ['ui-monospace', 'IBM Plex Mono', 'monospace'],
});
