// M0-FE-10 — the frontend-spec §19 gates, behind one entry point.
//
//   pnpm ci-gates
//
// §19 opens with "A PR fails on any of these" and then lists ten. This script is
// the "any of these": one command, ten gates, in a fixed order, with one exit
// code. CI runs exactly what a developer runs.
//
// Three decisions worth knowing before you read the code:
//
//   RUN ALL, THEN FAIL. A fail-fast gate runner tells you about one violation
//   per push, so a PR with four problems costs four round trips. Every gate runs
//   even after one has failed; the exit code is non-zero if any did. The two
//   exceptions are the Node engine check (nothing below it is trustworthy on the
//   wrong runtime) and the build — bundle-budgets produces `.next`, and
//   Lighthouse and Playwright have nothing to measure without it.
//
//   NOT-YET-SATISFIED IS NOT PASSED. Three of the ten cannot be fully satisfied
//   in M0: premium neutrality has no entitlement-bearing markup to compare,
//   §19.6 names a route that does not exist, §19.7 names a seed dataset that does
//   not exist. Those gates exit 0 — and print a sentinel line that this runner
//   scrapes out of their output and reprints, loudly, in a block of its own at
//   the end of every run. The ticket's rule was that a gap must fail loudly
//   rather than pass silently; this is the loudly.
//
//   GATES ARE SCRIPTS, NOT FUNCTIONS. Each gate is a standalone file that can be
//   run on its own and exits with its own status. This runner adds ordering,
//   aggregation and reporting, and nothing else — so debugging one gate never
//   means debugging the runner.
//
// Node builtins only.

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptsDir, '..');
const node = process.execPath;
const bin = (name) => path.join(webRoot, 'node_modules', '.bin', name);

// D-019: the toolchain floor. Pinned in package.json `engines` as well, but
// `engines` is advisory unless the package manager is configured to enforce it,
// and a budget measured on the wrong Next.js runtime is not a budget.
const NODE_FLOOR = [22, 12, 0];

/**
 * Lines a gate prints to say "this passed as far as it can, and that is not far
 * enough yet". Scraped from gate output and reprinted at the end. Anything
 * matching here is surfaced whether the gate passed or failed.
 */
const NOT_YET_SATISFIED = /\b(XFAIL|PENDING-ROUTE|PENDING-BASELINE|PENDING-BUDGET|OVER §14 BUDGET)\b/;

const GATES = [
  {
    id: 'contract-freshness',
    spec: '§19.1',
    what: 'openapi.yaml and the generated client agree',
    argv: [node, [path.join(scriptsDir, 'check-contract-freshness.mjs')]],
  },
  {
    id: 'token-lint',
    spec: '§19.2',
    what: 'no hardcoded hex, px font-size or arbitrary value outside packages/tokens',
    argv: [node, [path.join(scriptsDir, 'check-token-lint.mjs')]],
  },
  {
    id: 'ink-contrast',
    spec: '§19.3',
    what: 'every agent ink clears 4.5:1 in both themes',
    argv: [node, [path.join(scriptsDir, 'check-ink-contrast.mjs')]],
  },
  {
    id: 'bundle-budgets',
    spec: '§19.4',
    what: 'framework baseline and per-route app-authored JS within §14 / D-012 / D-019',
    argv: [node, [path.join(scriptsDir, 'check-bundle-budgets.mjs')]],
    // This gate runs `next build`. Everything downstream measures its output.
    buildsTheApp: true,
  },
  {
    id: 'client-components',
    spec: '§19.5',
    what: "'use client' leaf count, total and per route",
    argv: [node, [path.join(scriptsDir, 'check-client-components.mjs')]],
  },
  {
    id: 'font-budget',
    spec: '§14',
    what: 'the three variable faces total under 100KB',
    argv: [node, [path.join(scriptsDir, 'check-font-budget.js')]],
  },
  {
    id: 'a11y',
    spec: '§19.9',
    what: 'img dimensions, the §8.1 icon-only whitelist, accessible names',
    argv: [node, [path.join(scriptsDir, 'check-a11y.mjs')]],
  },
  {
    id: 'banned-imports',
    spec: '§19.10',
    what: 'no state, chart, animation, date or utility library; no barrel files',
    argv: [node, [path.join(scriptsDir, 'check-banned-imports.mjs')]],
  },
  {
    id: 'premium-neutrality',
    spec: '§19.8',
    what: 'premium- and free-authored markup byte-identical apart from content',
    argv: [node, [path.join(scriptsDir, 'check-premium-neutrality.mjs')]],
  },
  {
    id: 'lighthouse',
    spec: '§19.6',
    what: 'Lighthouse budgets on / and /thread/[id]',
    argv: [node, [path.join(scriptsDir, 'run-lighthouse.mjs')]],
    needsBuild: true,
  },
  {
    id: 'playwright',
    spec: '§19.7, D-015 item 7',
    what: 'real-browser CLS trace on /probe, plus visual regression',
    argv: [bin('playwright'), ['test']],
    needsBuild: true,
  },
];

/* ---------------------------------------------------------------- arguments */

const args = process.argv.slice(2);
const listFlag = args.includes('--list');
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i === -1 ? null : new Set((args[i + 1] ?? '').split(',').filter(Boolean));
};
const only = valueOf('--only');
const skip = valueOf('--skip');

if (listFlag) {
  for (const gate of GATES) console.log(`${gate.id.padEnd(20)} ${gate.spec.padEnd(18)} ${gate.what}`);
  process.exit(0);
}

const selected = GATES.filter(
  (gate) => (!only || only.has(gate.id)) && (!skip || !skip.has(gate.id)),
);

if (only) {
  const unknown = [...only].filter((id) => !GATES.some((g) => g.id === id));
  if (unknown.length > 0) {
    process.stderr.write(
      `ci-gates: unknown gate id(s): ${unknown.join(', ')}\n` +
        `Known ids: ${GATES.map((g) => g.id).join(', ')}\n`,
    );
    process.exit(2);
  }
}

/* --------------------------------------------------------------- node floor */

function checkNode() {
  const parts = process.versions.node.split('.').map(Number);
  for (let i = 0; i < NODE_FLOOR.length; i += 1) {
    if ((parts[i] ?? 0) > NODE_FLOOR[i]) return true;
    if ((parts[i] ?? 0) < NODE_FLOOR[i]) return false;
  }
  return true;
}

if (!checkNode()) {
  process.stderr.write(
    `ci-gates: FAILED — Node ${process.versions.node}, floor is ${NODE_FLOOR.join('.')} (D-019)\n\n` +
      '  Next 15.5 requires it, and every budget in §14 was measured on it. Running the gates\n' +
      '  on an older runtime produces numbers that do not describe what ships, which is worse\n' +
      '  than not running them. Pinned in apps/web/package.json `engines` and in\n' +
      '  .github/workflows/ci.yml.\n',
  );
  process.exit(1);
}

/* ------------------------------------------------------------------ running */

function run(gate) {
  return new Promise((resolve) => {
    const started = Date.now();
    const [command, argv] = gate.argv;
    const child = spawn(command, argv, {
      cwd: webRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Streamed live so a long gate is not a silent one, and captured at the same
    // time so the sentinel lines can be pulled back out at the end.
    let captured = '';
    const tap = (stream, sink) => {
      stream.setEncoding('utf8');
      stream.on('data', (chunk) => {
        captured += chunk;
        sink.write(chunk);
      });
    };
    tap(child.stdout, process.stdout);
    tap(child.stderr, process.stderr);

    child.on('error', (error) => {
      process.stderr.write(`\n${gate.id}: could not start — ${error.message}\n`);
      resolve({ gate, code: 127, ms: Date.now() - started, captured });
    });
    child.on('close', (code) => {
      resolve({ gate, code: code ?? 1, ms: Date.now() - started, captured });
    });
  });
}

const results = [];
let buildFailed = false;

for (const gate of selected) {
  const skipped = buildFailed && gate.needsBuild;
  console.log(`\n${'─'.repeat(72)}\n${gate.id}  (${gate.spec})  ${gate.what}\n`);

  if (skipped) {
    console.log(
      `  SKIPPED — needs a production build, and the build failed above. Not a pass.`,
    );
    results.push({ gate, code: null, ms: 0, captured: '', skipped: true });
    continue;
  }

  const result = await run(gate);
  results.push(result);
  if (gate.buildsTheApp && result.code !== 0) buildFailed = true;
}

/* ------------------------------------------------------------------ summary */

const notices = [];
for (const result of results) {
  for (const line of result.captured.split('\n')) {
    if (NOT_YET_SATISFIED.test(line)) notices.push(`${result.gate.id}: ${line.trim()}`);
  }
}

const failed = results.filter((r) => r.code !== null && r.code !== 0);
const skippedCount = results.filter((r) => r.skipped).length;

console.log(`\n${'═'.repeat(72)}\nci-gates — frontend-spec §19\n`);
const width = Math.max(...results.map((r) => r.gate.id.length));
for (const result of results) {
  const status = result.skipped ? 'SKIP' : result.code === 0 ? 'pass' : 'FAIL';
  const ms = result.skipped ? '' : `${(result.ms / 1000).toFixed(1)}s`;
  console.log(
    `  ${status}  ${result.gate.id.padEnd(width)}  ${result.gate.spec.padEnd(18)} ${ms.padStart(7)}`,
  );
}

if (notices.length > 0) {
  console.log(`\n  NOT YET SATISFIED — these gates exited 0 without fully doing their job:\n`);
  for (const notice of notices) console.log(`    ${notice}`);
  console.log(
    `\n  None of the above is a pass. Each is tracked in the file that printed it; when the\n` +
      `  thing it is waiting on lands, delete the waiver rather than leaving it here.`,
  );
}

console.log('');
if (failed.length > 0 || skippedCount > 0) {
  const parts = [];
  if (failed.length > 0) parts.push(`${failed.length} gate(s) failed: ${failed.map((r) => r.gate.id).join(', ')}`);
  if (skippedCount > 0) parts.push(`${skippedCount} skipped`);
  process.stderr.write(`ci-gates: FAILED — ${parts.join('; ')}\n`);
  process.exit(1);
}

console.log(`ci-gates: OK — ${results.length} gate(s) green on Node ${process.versions.node}.`);
