import localFont from 'next/font/local';

/*
 * M0-FE-12 — same font setup as apps/web (src/fonts/index.ts), reused.
 *
 * `next/font/local` requires font files to live inside the app that loads
 * them, and cross-app source imports are banned (CLAUDE.md), so the woff2
 * files and this file's contents are copied here unchanged from apps/web
 * rather than imported. This is asset duplication, not token duplication —
 * accepted, and noted in this ticket's PR body as tracked debt for a possible
 * future shared-assets package. If apps/web's fonts ever change, this copy
 * must change with them.
 *
 * frontend-spec §6.1 — three faces, three roles, self-hosted, latin subset,
 * combined ≤100KB. See apps/web/src/fonts/index.ts for the exact subsetting
 * commands and provenance of each face.
 *
 * Wiring to `packages/tokens` (M0-SH-09 emits --eu-font-prose/ui/mono as
 * literal family-name stacks): next/font/local generates a hashed,
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
