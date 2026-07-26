// M0-FE-10 — frontend-spec §19.5 / §14 / §1 row 22 / §4.3.
//
//   "Client-component count per route exceeded"
//   "RSC by default; 'use client' on leaves only."
//
// Two assertions, both ratchets:
//
//   1. TOTAL. apps/web contains exactly six files with a real `'use client'`
//      directive today (D-018 counted them and called them "justified leaves").
//      A seventh fails this gate. That is the requirement in the ticket and the
//      one number a reviewer can hold in their head.
//   2. PER ROUTE. §19.5 is written per route, so the import graph is walked from
//      every route entry in `src/app` and the client leaves reachable from each
//      are counted. The per-route ceiling is 4 — the measured maximum today
//      (`/probe/primitives`: the interactive fixture plus Meter, Sheet and
//      ToastRegion) with no headroom added, for the same reason the framework
//      baseline has none: a ratchet with slack is a ratchet already spent.
//
// Raising either number is a real decision (it is app-authored JS, §14) and
// belongs in DECISIONS.md, not in a quiet edit to the constants below.
//
// Also enforced here because it is the same directive and the same graph:
// §1 row 22 — `'use client'` may never sit on a page, layout, template, error,
// loading or not-found file. Those are route entry points; the boundary belongs
// on a leaf beneath them.
//
// ── What counts as a directive ─────────────────────────────────────────────
// Only a real directive prologue: the first statement in the file, after
// comments and whitespace, being the string `'use client'`. Half this app's
// components *discuss* `'use client'` in a doc comment explaining why they do
// not have one — a grep would count eleven files where there are six. This
// walks the top of the file instead.
//
// ── Limits ─────────────────────────────────────────────────────────────────
// The graph follows static relative imports and `import()` calls with a literal
// path. It does not follow a computed specifier, and it does not treat a
// package as client (a bare specifier is left to the bundle gate, which
// measures bytes and cannot be fooled by any of this). Every client file in the
// app is counted by assertion 1 regardless of whether a route reaches it, so
// nothing hides behind a resolution failure.

import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { blankComments, listSourceFiles, read, webRoot } from './lib/sources.mjs';

const GATE = 'client-components';

const TOTAL_CEILING = 6; // D-018: six justified leaves
const PER_ROUTE_CEILING = 4; // measured maximum today (/probe/primitives), no headroom

const ROUTE_ENTRY_BASENAMES = new Set([
  'page',
  'layout',
  'template',
  'error',
  'global-error',
  'loading',
  'not-found',
  'default',
  'route',
]);
const RESOLVE_EXTS = ['.tsx', '.ts', '.jsx', '.js', '.mjs'];

/** True when the file opens with a real `'use client'` directive prologue. */
function hasClientDirective(source) {
  let i = 0;
  if (source.charCodeAt(0) === 0xfeff) i = 1;
  for (;;) {
    while (i < source.length && /\s/.test(source[i])) i += 1;
    if (source.startsWith('//', i)) {
      const nl = source.indexOf('\n', i);
      if (nl === -1) return false;
      i = nl + 1;
      continue;
    }
    if (source.startsWith('/*', i)) {
      const close = source.indexOf('*/', i + 2);
      if (close === -1) return false;
      i = close + 2;
      continue;
    }
    break;
  }
  return /^(['"])use client\1\s*;?/.test(source.slice(i));
}

const allFiles = listSourceFiles({ exts: ['.ts', '.tsx', '.js', '.jsx', '.mjs'], dirs: ['src'] });

const clientFiles = [];
const byAbsolute = new Map();
for (const file of allFiles) {
  const source = read(file);
  const isClient = hasClientDirective(source);
  byAbsolute.set(file.absolute, { ...file, source, isClient });
  if (isClient) clientFiles.push(file.relative);
}

// ── import graph ───────────────────────────────────────────────────────────

const SPECIFIER = /(?:\bfrom\s*|^\s*import\s*|\bimport\(\s*|\brequire\(\s*)(['"])([^'"]+)\1/gm;

function resolve(fromAbsolute, specifier) {
  if (!specifier.startsWith('.')) return null; // a package: not this gate's business
  const base = path.resolve(path.dirname(fromAbsolute), specifier);
  const candidates = [base, ...RESOLVE_EXTS.map((e) => base + e)];
  for (const ext of RESOLVE_EXTS) candidates.push(path.join(base, `index${ext}`));
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function importsOf(entry) {
  const text = blankComments(entry.source);
  const out = [];
  SPECIFIER.lastIndex = 0;
  let m;
  while ((m = SPECIFIER.exec(text)) !== null) {
    const resolved = resolve(entry.absolute, m[2]);
    if (resolved && byAbsolute.has(resolved)) out.push(resolved);
  }
  return out;
}

/** Route path for an app-router entry file: src/app/probe/api/page.tsx → /probe/api */
function routePathOf(relative) {
  const withoutPrefix = relative.replace(/^src\/app\//, '').replace(/\.[^.]+$/, '');
  const segments = withoutPrefix.split('/').slice(0, -1);
  const visible = segments.filter((s) => !(s.startsWith('(') && s.endsWith(')')));
  return `/${visible.join('/')}`.replace(/\/+$/, '') || '/';
}

const routeEntries = allFiles.filter(
  (f) =>
    f.relative.startsWith('src/app/') &&
    ROUTE_ENTRY_BASENAMES.has(path.basename(f.relative).replace(/\.[^.]+$/, '')),
);

const violations = [];

// §1 row 22 — never on a route entry.
for (const entry of routeEntries) {
  if (byAbsolute.get(entry.absolute).isClient) {
    violations.push(
      `${entry.relative}: \`'use client'\` on a route entry file — §1 row 22 / §4.3 put the boundary on a leaf beneath it`,
    );
  }
}

const perRoute = new Map();
for (const entry of routeEntries) {
  const route = routePathOf(entry.relative);
  const seen = new Set();
  const stack = [entry.absolute];
  const found = new Set();
  while (stack.length > 0) {
    const absolute = stack.pop();
    if (seen.has(absolute)) continue;
    seen.add(absolute);
    const node = byAbsolute.get(absolute);
    if (!node) continue;
    if (node.isClient) found.add(node.relative);
    for (const next of importsOf(node)) stack.push(next);
  }
  const existing = perRoute.get(route) ?? new Set();
  for (const f of found) existing.add(f);
  perRoute.set(route, existing);
}

// ── report ─────────────────────────────────────────────────────────────────

process.stdout.write(`  client leaves (real \`'use client'\` directive): ${clientFiles.length}\n`);
for (const f of clientFiles) process.stdout.write(`    ${f}\n`);

const routeNames = [...perRoute.keys()].sort();
const width = Math.max(...routeNames.map((r) => r.length), 5);
process.stdout.write('\n  route'.padEnd(width + 6) + 'client leaves\n');
for (const route of routeNames) {
  const files = [...perRoute.get(route)].sort();
  process.stdout.write(
    `  ${route.padEnd(width)}  ${String(files.length).padStart(2)}${files.length > 0 ? `  ${files.map((f) => path.basename(f)).join(', ')}` : ''}\n`,
  );
  if (files.length > PER_ROUTE_CEILING) {
    violations.push(
      `${route}: ${files.length} client components reachable, ceiling is ${PER_ROUTE_CEILING} (§19.5, §14)`,
    );
  }
}

if (clientFiles.length > TOTAL_CEILING) {
  violations.push(
    `${clientFiles.length} client components in apps/web, ratchet is ${TOTAL_CEILING} (D-018). ` +
      'Every one of them is app-authored JS on some route (§14). If the seventh is genuinely a ' +
      'justified interactive leaf, raise the ratchet in DECISIONS.md and then here — in that order.',
  );
}

if (violations.length > 0) {
  process.stderr.write(`\n${GATE}: FAILED — ${violations.length} violation(s) (frontend-spec §19.5)\n\n`);
  for (const v of violations) process.stderr.write(`  · ${v}\n`);
  process.exit(1);
}

const worst = routeNames.reduce(
  (a, r) => Math.max(a, perRoute.get(r).size),
  0,
);
process.stdout.write(
  `\n${GATE}: OK — ${clientFiles.length}/${TOTAL_CEILING} client components total; ` +
    `busiest route has ${worst}/${PER_ROUTE_CEILING}; no route entry carries the directive\n`,
);
