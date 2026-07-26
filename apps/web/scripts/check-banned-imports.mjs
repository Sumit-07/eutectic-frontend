// M0-FE-10 — frontend-spec §19.10 / §1 rows 16 & 21 / §4.4 / CLAUDE.md rule 12.
//
//   "An import of a state, chart, animation, date or utility library"
//
// Three checks:
//
//   1. BANNED CATEGORIES, by name. The named packages below, imported anywhere
//      in src/ or declared in this app's package.json, fail. `Intl` for dates
//      and numbers, hand-written SVG for the curve, CSS for motion (§14).
//   2. THE RUNTIME MANIFEST IS AN ALLOWLIST. §14's budget breakdown ends "there
//      is no room for a fourth library — that is intentional", and CLAUDE.md
//      rule 12 makes any new dependency Fable's call. A name-based ban only
//      catches the libraries somebody thought to list; an allowlist catches the
//      one nobody predicted. `devDependencies` are not allowlisted — they never
//      reach a user — but they are still checked against the banned categories,
//      because a date library in a Storybook story is a date library.
//   3. BARREL FILES. `export * from` destroys tree-shaking (§1 row 21, §14).
//
// Adding a runtime dependency is not a lint fix. It is a DECISIONS entry, then
// an edit here — in that order.
//
// Node builtins only.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { blankComments, lineOf, lineTextOf, listSourceFiles, read, report, webRoot } from './lib/sources.mjs';

const GATE = 'banned-imports';
const SPEC = 'frontend-spec §19.10, §1 rows 16/21, CLAUDE.md rule 12';

/** CLAUDE.md rule 12's five categories, spelled out. */
const BANNED = new Map(
  Object.entries({
    'state management': [
      'redux',
      '@reduxjs/toolkit',
      'react-redux',
      'zustand',
      'jotai',
      'recoil',
      'mobx',
      'mobx-react',
      'mobx-react-lite',
      'valtio',
      'xstate',
      '@xstate/react',
      'effector',
      'nanostores',
      '@nanostores/react',
      'easy-peasy',
      'zedux',
    ],
    chart: [
      'chart.js',
      'react-chartjs-2',
      'recharts',
      'victory',
      'nivo',
      '@nivo/core',
      'apexcharts',
      'react-apexcharts',
      'highcharts',
      'echarts',
      'plotly.js',
      'react-plotly.js',
      'visx',
      '@visx/visx',
      'd3',
      'd3-scale',
      'd3-shape',
      'britecharts',
    ],
    animation: [
      'framer-motion',
      'motion',
      'gsap',
      'react-spring',
      '@react-spring/web',
      'animejs',
      'popmotion',
      'lottie-web',
      'lottie-react',
      'react-lottie',
      'auto-animate',
      '@formkit/auto-animate',
      'react-transition-group',
      'velocity-animate',
    ],
    date: [
      'moment',
      'moment-timezone',
      'dayjs',
      'date-fns',
      'date-fns-tz',
      'luxon',
      '@js-joda/core',
      'js-joda',
      'timeago.js',
      'ms',
      'pretty-ms',
    ],
    'general utility': [
      'lodash',
      'lodash-es',
      'lodash.merge',
      'underscore',
      'ramda',
      'rambda',
      'immutable',
      'immer',
      'just-extend',
      'fp-ts',
      'remeda',
    ],
  }),
);

/** `a` or `an`, so the message reads like English. */
const article = (word) => (/^[aeiou]/i.test(word) ? `an ${word}` : `a ${word}`);

const BANNED_LOOKUP = new Map();
for (const [category, names] of BANNED) {
  for (const name of names) BANNED_LOOKUP.set(name, category);
}

/**
 * Every runtime dependency apps/web is allowed to have. Each entry names the
 * spec line that put it there. Nothing else may appear in `dependencies`.
 */
const RUNTIME_ALLOWLIST = new Map(
  Object.entries({
    '@eutectic/contracts': 'D-001 — the contract, generated client',
    '@eutectic/core': 'D-001 — shared pure helpers',
    '@eutectic/tokens': 'frontend-spec §5 — the only source of design values',
    '@tanstack/react-query': 'frontend-spec §4.4 / §14 ("TanStack Query ~13KB")',
    next: 'frontend-spec §4.1',
    react: 'frontend-spec §4.1',
    'react-dom': 'frontend-spec §4.1',
  }),
);

const violations = [];

// ── 1 + 3: source ──────────────────────────────────────────────────────────

const files = listSourceFiles({ exts: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css'] });
const SPECIFIER = /(?:\bfrom\s*|^\s*import\s*|\bimport\(\s*|\brequire\(\s*|@import\s*)(['"])([^'"]+)\1/gm;
const BARREL = /^\s*export\s+\*\s+from\s/gm;

/** `lodash/merge` and `@nivo/core` both reduce to the package name. */
function packageOf(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('/')) return null;
  if (specifier.startsWith('node:')) return null;
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

for (const file of files) {
  const raw = read(file);
  const text = blankComments(raw);

  SPECIFIER.lastIndex = 0;
  let m;
  while ((m = SPECIFIER.exec(text)) !== null) {
    const pkg = packageOf(m[2]);
    if (!pkg) continue;
    const category = BANNED_LOOKUP.get(pkg);
    if (category) {
      violations.push({
        file: file.relative,
        line: lineOf(raw, m.index),
        message: `imports "${m[2]}" — ${article(category)} library (§19.10, CLAUDE.md rule 12)`,
        snippet: lineTextOf(raw, m.index),
      });
    }
  }

  BARREL.lastIndex = 0;
  while ((m = BARREL.exec(text)) !== null) {
    violations.push({
      file: file.relative,
      line: lineOf(raw, m.index),
      message: 'barrel file (`export * from`) — destroys tree-shaking (§1 row 21, §14)',
      snippet: lineTextOf(raw, m.index),
    });
  }
}

// ── 2: the manifest ────────────────────────────────────────────────────────

const manifestPath = path.join(webRoot, 'package.json');
const manifestRaw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestRaw);
const lineOfKey = (key) => lineOf(manifestRaw, manifestRaw.indexOf(`"${key}"`));

for (const [name] of Object.entries(manifest.dependencies ?? {})) {
  const category = BANNED_LOOKUP.get(name);
  if (category) {
    violations.push({
      file: 'package.json',
      line: lineOfKey(name),
      message: `dependency "${name}" is ${article(category)} library (§19.10, CLAUDE.md rule 12)`,
    });
    continue;
  }
  if (!RUNTIME_ALLOWLIST.has(name)) {
    violations.push({
      file: 'package.json',
      line: lineOfKey(name),
      message:
        `runtime dependency "${name}" is not on the allowlist in scripts/check-banned-imports.mjs. ` +
        '§14: "there is no room for a fourth library — that is intentional". CLAUDE.md rule 12 ' +
        'makes this Fable\'s approval, recorded in DECISIONS.md, before the allowlist changes.',
    });
  }
}

for (const [name] of Object.entries(manifest.devDependencies ?? {})) {
  const category = BANNED_LOOKUP.get(name);
  if (category) {
    violations.push({
      file: 'package.json',
      line: lineOfKey(name),
      message: `devDependency "${name}" is a ${category} library — the ban is on the library, not on where it is declared`,
    });
  }
}

report({
  gate: GATE,
  spec: SPEC,
  violations,
  okMessage:
    `${files.length} file(s) and package.json clean — no state/chart/animation/date/utility import, ` +
    `no barrel file; ${Object.keys(manifest.dependencies ?? {}).length} runtime dependencies, ` +
    `all allowlisted (${BANNED_LOOKUP.size} banned names checked)`,
  hint:
    'Use `Intl` for dates and numbers, hand-written SVG for the curve, and CSS for motion (§14).\n' +
    'If the dependency is genuinely unavoidable, it is a CLAUDE.md rule 12 escalation to Fable\n' +
    'and a DECISIONS.md entry — this file is edited after that, never instead of it.',
});
