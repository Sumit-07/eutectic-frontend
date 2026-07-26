// M0-FE-02 — frontend-spec §14 / §6.1: "Fonts total ≤ 100KB", woff2.
//
// Zero dependencies (plain node:fs), checked in as this app's "test" script
// per the ticket. Measures the combined byte size of every woff2 file under
// src/fonts and fails the build if the total exceeds the budget.
//
// This walks src/fonts recursively (readdirSync with recursive: true) rather
// than naming files, because a fourth font file added by accident must be
// caught, not silently invisible to the "total" it is supposed to police.
// Any *.woff2 found that isn't one of the three expected faces fails the
// gate by name, so an accidental extra face is reported clearly rather than
// just nudging the total.

import { statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BUDGET_BYTES = 102_400; // 100KB, frontend-spec §14

const here = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(here, '..', 'src', 'fonts');

const EXPECTED = new Set([
  path.join('newsreader', 'Newsreader-Variable.woff2'),
  path.join('instrument-sans', 'InstrumentSans-Variable.woff2'),
  path.join('commit-mono', 'CommitMono-Variable.woff2'),
]);

const entries = readdirSync(fontsDir, { recursive: true, withFileTypes: true });

const found = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.woff2'))
  .map((entry) => {
    // entry.parentPath (Node 20.12+) / entry.path (older) is the directory
    // the entry was found in; fall back to fontsDir for older runtimes.
    const dir = entry.parentPath ?? entry.path ?? fontsDir;
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(fontsDir, absolute);
    return { absolute, relative };
  })
  .sort((a, b) => a.relative.localeCompare(b.relative));

const unexpected = found.filter((f) => !EXPECTED.has(f.relative));

if (unexpected.length > 0) {
  console.error('Font budget check found unexpected woff2 file(s) under src/fonts:');
  for (const f of unexpected) {
    console.error(`  ${f.relative}`);
  }
  console.error(
    '\nOnly the three faces named in the M0-FE-02 ticket (Newsreader, Instrument Sans, ' +
      'Commit Mono) may live under src/fonts. If this is a genuine new face, update ' +
      'EXPECTED in scripts/check-font-budget.js — do not let it pass silently.',
  );
  process.exit(1);
}

const missing = [...EXPECTED].filter(
  (rel) => !found.some((f) => f.relative === rel),
);
if (missing.length > 0) {
  console.error('Font budget check is missing expected woff2 file(s):');
  for (const rel of missing) {
    console.error(`  ${rel}`);
  }
  process.exit(1);
}

let total = 0;
const rows = [];

for (const f of found) {
  const { size } = statSync(f.absolute);
  total += size;
  rows.push({ file: path.relative(process.cwd(), f.absolute), bytes: size });
}

for (const row of rows) {
  console.log(`${row.bytes.toString().padStart(8)}  ${row.file}`);
}
console.log(`${total.toString().padStart(8)}  TOTAL`);
console.log(`${BUDGET_BYTES.toString().padStart(8)}  BUDGET (frontend-spec §14)`);

if (total > BUDGET_BYTES) {
  console.error(
    `\nFont budget exceeded: ${total} bytes > ${BUDGET_BYTES} bytes (${total - BUDGET_BYTES} over).`,
  );
  process.exit(1);
}

console.log(`\nFont budget OK: ${BUDGET_BYTES - total} bytes of headroom.`);
