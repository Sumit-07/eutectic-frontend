// M0-FE-10 — frontend-spec §19.4 / §14, D-012, D-019.
//
//   "Any web or native bundle budget exceeded (§14)"
//
// §14 as amended by D-012 counts **app-authored JS**: a route's First Load JS
// minus the framework baseline (the shared chunks a zero-client-component RSC
// page ships). D-019 ratcheted that baseline from 103KB to 102KB — it is a
// ceiling that only ever moves down, and a framework upgrade that raises it
// needs a DECISIONS entry, not a bumped constant here.
//
//   framework baseline            <= 102 kB   (D-019 ratchet; D-012 rule)
//   app-authored, `/`             <=  65 kB   (§14)
//   app-authored, `/thread/[id]`  <=  40 kB   (§14; route does not exist yet)
//   app-authored, any other route <=  25 kB   (§14 "per-route app-JS delta")
//   CSS total                     <=  30 kB   (§14)
//
// No per-route ceiling is invented here and none carries invented headroom:
// every number above is a line in §14 or a line in D-019.
//
// ── How the numbers are obtained ───────────────────────────────────────────
// `next build` prints the route table; this script runs the build and parses
// that table. The alternative — walking `.next/app-build-manifest.json` and
// gzipping each chunk — was rejected: it reproduces Next's First Load JS
// arithmetic by hand (dedupe of shared chunks, the polyfill and webpack runtime
// entries, its 1024-based `kB`), so the two would drift and the gate would
// police a number nobody else in the project ever sees. The printed table is
// what D-012, D-018 and D-019 quote, so it is what is enforced.
//
// The parse is defensive about everything except the shape it needs: if the
// shared-baseline line or the route rows are missing, the gate fails loudly
// rather than passing on zero routes.
//
// `--from-log <path>` parses an existing build log instead of building, so
// `ci-gates` can build once and share the output with the Lighthouse and
// Playwright runners. `--no-build` requires that log.
//
// Node builtins only; the only executable invoked is the app's own `next`.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { webRoot } from './lib/sources.mjs';

const GATE = 'bundle-budgets';

const FRAMEWORK_BASELINE_KB = 102; // D-019 ratchet
const ROUTE_BUDGETS_KB = { '/': 65, '/thread/[id]': 40 };
const DEFAULT_ROUTE_BUDGET_KB = 25; // §14 "per-route app-JS delta for any new route"
const CSS_BUDGET_KB = 30; // §14

export const BUILD_LOG = path.join(webRoot, '.next', 'eutectic-build-output.txt');

function fail(message, extra = '') {
  process.stderr.write(`${GATE}: FAILED — ${message}\n`);
  if (extra) process.stderr.write(`${extra}\n`);
  process.exit(1);
}

// ── build (or reuse a log) ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const fromLogIndex = args.indexOf('--from-log');
const logPath = fromLogIndex === -1 ? BUILD_LOG : args[fromLogIndex + 1];
const shouldBuild = !args.includes('--no-build') && fromLogIndex === -1;

if (shouldBuild) {
  process.stdout.write(`${GATE}: running \`next build\` (this is the measurement)\n`);
  const next = path.join(webRoot, 'node_modules', '.bin', 'next');
  if (!existsSync(next)) fail(`next binary not found at ${next} — is the workspace installed?`);
  const result = spawnSync(next, ['build'], { cwd: webRoot, encoding: 'utf8' });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  mkdirSync(path.dirname(BUILD_LOG), { recursive: true });
  writeFileSync(BUILD_LOG, output, 'utf8');
  if (result.status !== 0) {
    fail(`\`next build\` exited ${result.status} — a build that does not complete has no budget`, output);
  }
}

if (!existsSync(logPath)) {
  fail(`no build output at ${logPath} — run without --no-build, or point --from-log at a real log`);
}
const log = readFileSync(logPath, 'utf8');

// ── parse ──────────────────────────────────────────────────────────────────

/** Next prints sizes as `148 B`, `14.2 kB`, `1.1 MB`, with kB = 1024 bytes. */
function toKb(value, unit) {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return null;
  if (unit === 'B') return n / 1024;
  if (unit === 'kB') return n;
  if (unit === 'MB') return n * 1024;
  return null;
}

const SIZE = String.raw`(\d+(?:\.\d+)?)\s*(B|kB|MB)`;
// `┌ ƒ /probe/api    14.2 kB   116 kB`
const ROUTE_ROW = new RegExp(String.raw`^[┌├└]\s+\S?\s*(/\S*)\s+${SIZE}\s+${SIZE}\s*$`);
const SHARED_ROW = new RegExp(String.raw`^\+\s*First Load JS shared by all\s+${SIZE}\s*$`);

const routes = [];
let baselineKb = null;

for (const rawLine of log.split('\n')) {
  const line = rawLine.replace(/\[[0-9;]*m/g, '').trimEnd();
  const shared = SHARED_ROW.exec(line.trim());
  if (shared) {
    baselineKb = toKb(shared[1], shared[2]);
    continue;
  }
  const route = ROUTE_ROW.exec(line.trim());
  if (route) {
    routes.push({
      route: route[1],
      sizeKb: toKb(route[2], route[3]),
      firstLoadKb: toKb(route[4], route[5]),
    });
  }
}

if (baselineKb === null) {
  fail(
    'could not find the "First Load JS shared by all" line in the build output — ' +
      'the route table format changed and this parser must be updated, not bypassed',
    log.split('\n').slice(-30).join('\n'),
  );
}
if (routes.length === 0) {
  fail('parsed zero routes from the build output — refusing to pass a measurement of nothing');
}

// ── CSS total ──────────────────────────────────────────────────────────────

const cssDir = path.join(webRoot, '.next', 'static', 'css');
let cssRawBytes = 0;
let cssGzipBytes = 0;
let cssFiles = 0;
if (existsSync(cssDir)) {
  for (const name of readdirSync(cssDir)) {
    if (!name.endsWith('.css')) continue;
    const absolute = path.join(cssDir, name);
    cssRawBytes += statSync(absolute).size;
    cssGzipBytes += gzipSync(readFileSync(absolute), { level: 9 }).length;
    cssFiles += 1;
  }
}

// ── verdict ────────────────────────────────────────────────────────────────

const failures = [];

process.stdout.write(`\n  framework baseline (shared by all)  ${baselineKb.toFixed(1)} kB / ${FRAMEWORK_BASELINE_KB} kB\n`);
if (baselineKb > FRAMEWORK_BASELINE_KB) {
  failures.push(
    `framework baseline ${baselineKb.toFixed(1)} kB exceeds the D-019 ratchet of ${FRAMEWORK_BASELINE_KB} kB. ` +
      'The ratchet only moves down: this is either app code leaking into the shared chunks, or a ' +
      'framework upgrade — the latter needs a DECISIONS entry before the number here changes.',
  );
}

const width = Math.max(...routes.map((r) => r.route.length));
process.stdout.write('\n  route'.padEnd(width + 8) + 'first load   app-authored   budget\n');
for (const r of routes) {
  const appAuthoredKb = r.firstLoadKb - baselineKb;
  const budget = ROUTE_BUDGETS_KB[r.route] ?? DEFAULT_ROUTE_BUDGET_KB;
  const over = appAuthoredKb > budget;
  process.stdout.write(
    `  ${r.route.padEnd(width)}  ${`${r.firstLoadKb.toFixed(1)} kB`.padStart(9)}   ` +
      `${`${Math.max(0, appAuthoredKb).toFixed(1)} kB`.padStart(9)}   ` +
      `${`${budget} kB`.padStart(6)}  ${over ? 'OVER' : 'ok'}\n`,
  );
  if (over) {
    failures.push(
      `${r.route}: ${appAuthoredKb.toFixed(1)} kB app-authored JS exceeds §14's ${budget} kB ` +
        `(first load ${r.firstLoadKb.toFixed(1)} kB − ${baselineKb.toFixed(1)} kB baseline)`,
    );
  }
}

const cssRawKb = cssRawBytes / 1024;
const cssGzipKb = cssGzipBytes / 1024;
process.stdout.write(
  `\n  CSS total (${cssFiles} file(s))  ${cssGzipKb.toFixed(1)} kB gz / ${CSS_BUDGET_KB} kB` +
    `   [raw ${cssRawKb.toFixed(1)} kB]\n`,
);
if (cssGzipKb > CSS_BUDGET_KB) {
  failures.push(`CSS total ${cssGzipKb.toFixed(1)} kB gz exceeds §14's ${CSS_BUDGET_KB} kB`);
}

// §14's declared-but-not-yet-built routes. Reported every run so "the budget is
// green" can never quietly mean "the budgeted route does not exist".
const pending = Object.keys(ROUTE_BUDGETS_KB).filter((r) => !routes.some((x) => x.route === r));
if (pending.length > 0) {
  process.stdout.write(
    `\n  PENDING-ROUTE  §14 budgets a route this build does not contain: ${pending.join(', ')} ` +
      `— not a pass, not a failure; it lands with the route.\n`,
  );
}

if (failures.length > 0) {
  process.stderr.write(`\n${GATE}: FAILED — ${failures.length} budget(s) exceeded (frontend-spec §14, §19.4)\n\n`);
  for (const f of failures) process.stderr.write(`  · ${f}\n`);
  process.exit(1);
}

process.stdout.write(
  `\n${GATE}: OK — baseline ${baselineKb.toFixed(1)}/${FRAMEWORK_BASELINE_KB} kB, ` +
    `${routes.length} route(s) within their app-authored ceilings, CSS ${cssGzipKb.toFixed(1)}/${CSS_BUDGET_KB} kB gz` +
    `${pending.length > 0 ? `, ${pending.length} budgeted route(s) pending` : ''}\n`,
);
