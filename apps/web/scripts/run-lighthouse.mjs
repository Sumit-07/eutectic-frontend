// M0-FE-10 — frontend-spec §19.6: "Lighthouse budgets on `/` and `/thread/[id]`".
//
// Two things this script does that a bare `lighthouse --budget-path` would not:
//
//   1. It enforces the budgets. Lighthouse 13 dropped budget support — passing
//      --budget-path is accepted and then ignored (the LHR comes back with
//      `configSettings.budgets: undefined` and no performance-budget or
//      timing-budget audit at all). A budgets file handed to Lighthouse today is
//      a budget nobody checks. So lighthouse-budgets.json is read here and
//      asserted against the LHR by this script.
//
//   2. It refuses to score a route that does not exist. §19.6 names
//      `/thread/[id]`; that route arrives with M1. It is reported as
//      PENDING-ROUTE on every run and never counted as a pass.
//
// It runs against a production `next start`, which it brings up itself on
// EUTECTIC_LH_PORT (default 3482) and tears down again, so `pnpm ci-gates` needs
// no server of its own. Chrome is the Chromium that Playwright already installed;
// nothing is downloaded.
//
// Node builtins plus the `lighthouse` CLI. No new runtime dependency (CLAUDE.md
// rule 12) — lighthouse is devDependencies only and is never imported by the app.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUDGETS_FILE = path.join(webRoot, 'lighthouse-budgets.json');
const OUT_DIR = path.join(webRoot, '.next', 'lighthouse');
const PORT = Number(process.env.EUTECTIC_LH_PORT ?? 3482);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const GATE = 'lighthouse';
const SPEC = 'frontend-spec §19.6, §14';

const budgets = JSON.parse(readFileSync(BUDGETS_FILE, 'utf8'));

/* ------------------------------------------------------------------ chrome */

// Lighthouse finds Chrome by CHROME_PATH or by looking in the OS's install
// locations. In this workspace the browser that exists is Playwright's, so it is
// located explicitly rather than depending on whatever Chrome the machine has —
// a gate that scores a different browser than the one the e2e suite drives is
// two gates measuring two products.
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  const cache =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    (process.platform === 'darwin'
      ? path.join(process.env.HOME ?? '', 'Library', 'Caches', 'ms-playwright')
      : path.join(process.env.HOME ?? '', '.cache', 'ms-playwright'));

  let dirs = [];
  try {
    dirs = readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort();
  } catch {
    return null;
  }

  // M0-FE-14: the extracted folder *inside* each chromium-<rev> revision
  // directory is not a stable literal — it moved from a bundled Chromium
  // (`chrome-linux/chrome`) to Chrome for Testing artifacts as Playwright
  // upgraded, and the runner's actual layout after M0-FE-14's first CI run
  // was `chrome-linux64/chrome`, not `chrome-linux/chrome` (mac already
  // carried an arch suffix — `chrome-mac-arm64` — for the same reason).
  // Pinning one exact literal here rots the next time upstream renames the
  // folder, so this matches by platform-prefix instead of a fixed name.
  const platformPrefix =
    process.platform === 'darwin' ? 'chrome-mac' : process.platform === 'win32' ? 'chrome-win' : 'chrome-linux';

  for (const dir of dirs.reverse()) {
    const revDir = path.join(cache, dir);
    let children = [];
    try {
      children = readdirSync(revDir);
    } catch {
      continue;
    }
    for (const child of children.filter((c) => c.startsWith(platformPrefix)).sort()) {
      const base = path.join(revDir, child);
      const rel =
        process.platform === 'darwin'
          ? path.join('Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing')
          : process.platform === 'win32'
            ? 'chrome.exe'
            : 'chrome';
      const full = path.join(base, rel);
      if (existsSync(full)) return full;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ server */

async function reachable(url, ms) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function startServer() {
  if (await reachable(ORIGIN, 1)) {
    console.log(`${GATE}: reusing the server already listening on ${ORIGIN}`);
    return null;
  }
  const bin = path.join(webRoot, 'node_modules', '.bin', 'next');
  const child = spawn(bin, ['start', '--port', String(PORT)], {
    cwd: webRoot,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) process.stderr.write(stderr);
  });

  if (!(await reachable(ORIGIN, 120_000))) {
    child.kill('SIGTERM');
    process.stderr.write(stderr);
    throw new Error(
      `${GATE}: \`next start\` never came up on ${ORIGIN}. A production build must exist — ` +
        'run the bundle-budgets gate (which builds) first, or `pnpm build`.',
    );
  }
  return child;
}

/* --------------------------------------------------------------- lighthouse */

function runLighthouse(url, slug, chrome) {
  mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, `${slug}.json`);
  const result = spawnSync(
    path.join(webRoot, 'node_modules', '.bin', 'lighthouse'),
    [
      url,
      '--output=json',
      `--output-path=${outFile}`,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage',
      '--quiet',
    ],
    { cwd: webRoot, encoding: 'utf8', env: { ...process.env, CHROME_PATH: chrome } },
  );
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(`${GATE}: lighthouse exited ${result.status} for ${url}`);
  }
  return JSON.parse(readFileSync(outFile, 'utf8'));
}

/* ------------------------------------------------------------------- checks */

const KIB = 1024;

function checkRoute(route, lhr) {
  const failures = [];
  const notices = [];
  const rows = [];
  const ratchets = route.ratchets ?? {};

  // `floor` distinguishes the two kinds of budget: a category score must not go
  // BELOW its number, everything else must not go ABOVE it. Without it the
  // failure line reads "performance: 0.99 > 1", which is nonsense.
  const record = (label, value, budget, ok, unit, { ratchet, floor } = {}) => {
    rows.push({ label, value, budget, ok, unit, ratcheted: Boolean(ratchet) });
    if (!ok) failures.push({ label, value, budget, unit, floor: Boolean(floor) });
  };

  for (const [name, spec] of Object.entries(budgets.categories)) {
    const score = lhr.categories[name]?.score;
    if (score === undefined || score === null) {
      failures.push({ label: `category ${name}`, value: 'not scored', budget: spec.min, unit: '', floor: true });
      continue;
    }
    record(`category ${name}`, score, spec.min, score >= spec.min - 1e-9, '', { floor: true });
  }

  for (const [id, spec] of Object.entries(budgets.metrics)) {
    const audit = lhr.audits[id];
    if (!audit || typeof audit.numericValue !== 'number') {
      failures.push({ label: id, value: 'not measured', budget: spec.max, unit: spec.unit });
      continue;
    }
    const value = Math.round(audit.numericValue * 1000) / 1000;
    const ratchet = ratchets[id];
    const ceiling = ratchet ? ratchet.value : spec.max;
    record(id, value, spec.max, value <= ceiling, spec.unit, { ratchet });
    if (ratchet) {
      if (value > spec.max) {
        notices.push(
          `OVER §14 BUDGET — ${route.path} ${id} = ${value}${spec.unit} against a budget of ` +
            `${spec.max}${spec.unit}. Known breach, ratcheted at ${ratchet.value}${spec.unit}: ${ratchet.note}`,
        );
      } else {
        notices.push(
          `${route.path} ${id} = ${value}${spec.unit} is inside the ${spec.max}${spec.unit} budget, ` +
            'but a ratchet is still recorded for it. If that repeats, delete the ratchet from ' +
            'lighthouse-budgets.json rather than leaving a stale waiver behind.',
        );
      }
    }
  }

  const summary = lhr.audits['resource-summary']?.details?.items ?? [];
  const byType = new Map(summary.map((item) => [item.resourceType, item]));
  for (const [type, spec] of Object.entries(budgets.resources)) {
    const item = byType.get(type);
    if (!item) {
      failures.push({ label: `resource ${type}`, value: 'not reported', budget: '', unit: '' });
      continue;
    }
    if (spec.maxKiB !== undefined) {
      const kib = Math.round((item.transferSize / KIB) * 10) / 10;
      record(`resource ${type}`, kib, spec.maxKiB, kib <= spec.maxKiB, ' KiB');
    }
    if (spec.maxCount !== undefined) {
      record(
        `requests ${type}`,
        item.requestCount,
        spec.maxCount,
        item.requestCount <= spec.maxCount,
        '',
      );
    }
  }

  return { failures, notices, rows };
}

/* --------------------------------------------------------------------- main */

const chrome = findChrome();
if (!chrome) {
  process.stderr.write(
    `${GATE}: FAILED — no Chrome to measure with (${SPEC}).\n\n` +
      '  Lighthouse needs a Chromium. None was found in the Playwright browser cache and\n' +
      '  CHROME_PATH is not set. Install browsers (`playwright install chromium`) or point\n' +
      '  CHROME_PATH at a Chrome binary.\n',
  );
  process.exit(1);
}

const live = budgets.routes.filter((r) => r.status === 'live');
const pending = budgets.routes.filter((r) => r.status !== 'live');

let server;
const allFailures = [];
const allNotices = [];

try {
  server = await startServer();

  for (const route of live) {
    const slug = route.path === '/' ? 'root' : route.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    const lhr = runLighthouse(`${ORIGIN}${route.path}`, slug, chrome);
    const { failures, notices, rows } = checkRoute(route, lhr);

    console.log(`\n${GATE}: ${route.path}`);
    const width = Math.max(...rows.map((r) => r.label.length));
    for (const row of rows) {
      const mark = row.ok ? (row.ratcheted && row.value > row.budget ? 'over' : 'ok  ') : 'FAIL';
      console.log(
        `  ${mark}  ${row.label.padEnd(width)}  ${String(row.value).padStart(8)}${row.unit}` +
          `   budget ${row.budget}${row.unit}`,
      );
    }
    console.log(`  report: ${path.relative(webRoot, path.join(OUT_DIR, `${slug}.json`))}`);

    allFailures.push(...failures.map((f) => ({ ...f, route: route.path })));
    allNotices.push(...notices);
  }
} finally {
  if (server) {
    server.kill('SIGTERM');
    // `next start` spawns nothing else, but give it a beat to release the port
    // so a second gate in the same run does not collide with a dying listener.
    await new Promise((r) => setTimeout(r, 300));
  }
}

for (const route of pending) {
  allNotices.push(
    `PENDING-ROUTE — §19.6 requires Lighthouse on ${route.path} and it does not exist yet. ${route.note}`,
  );
}

console.log('');
for (const notice of allNotices) console.log(`  ${notice}`);

if (allFailures.length > 0) {
  process.stderr.write(`\n${GATE}: FAILED — ${allFailures.length} budget(s) exceeded (${SPEC})\n\n`);
  for (const f of allFailures) {
    process.stderr.write(`  ${f.route}  ${f.label}: ${f.value}${f.unit} ${f.floor ? "<" : ">"} ${f.budget}${f.unit}\n`);
  }
  process.stderr.write(
    '\nBudgets live in lighthouse-budgets.json and every one of them cites a §14 line. ' +
      'Raising one is a spec change, not a config change.\n',
  );
  process.exit(1);
}

console.log(
  `\n${GATE}: OK — ${live.length} route(s) within budget, ${pending.length} pending (${SPEC})`,
);
