// M0-FE-02 — frontend-spec §14 / §6.1: "Fonts total ≤ 100KB", woff2.
//
// Zero dependencies (plain node:fs), checked in as this app's "test" script
// per the ticket. Measures the combined byte size of the three self-hosted
// variable woff2 files and fails the build if the total exceeds the budget.
//
// This intentionally does not use a glob: the three faces are named exactly
// once here, so a fourth font file added by accident is invisible to the
// gate rather than silently included in the "budget" it is supposed to police.

import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BUDGET_BYTES = 102_400; // 100KB, frontend-spec §14

const here = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(here, '..', 'src', 'fonts');

const files = [
  path.join(fontsDir, 'newsreader', 'Newsreader-Variable.woff2'),
  path.join(fontsDir, 'instrument-sans', 'InstrumentSans-Variable.woff2'),
  path.join(fontsDir, 'commit-mono', 'CommitMono-Variable.woff2'),
];

let total = 0;
const rows = [];

for (const file of files) {
  const { size } = statSync(file);
  total += size;
  rows.push({ file: path.relative(process.cwd(), file), bytes: size });
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
