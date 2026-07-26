// M0-FE-08 — the staleness gate has to fail when the contract drifts.
//
// A gate nobody has ever seen go red is a comment. This copies the contracts
// package's *sources* (openapi.yaml, scripts/, generated/) into a temp dir,
// points `scripts/check-contract-freshness.mjs` at the copy with
// EUTECTIC_CONTRACTS_ROOT, and checks both outcomes. The real package is only
// ever read — the copy is what gets mutated.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(here, '..');
const script = path.join(webRoot, 'scripts', 'check-contract-freshness.mjs');
const require = createRequire(pathToFileURL(path.join(webRoot, 'package.json')));
const contractsRoot = path.resolve(
  path.dirname(require.resolve('@eutectic/contracts/client')),
  '..',
  '..',
);

function copyContracts() {
  const scratch = mkdtempSync(path.join(tmpdir(), 'eutectic-contracts-copy-'));
  for (const entry of ['openapi.yaml', 'scripts', 'generated']) {
    cpSync(path.join(contractsRoot, entry), path.join(scratch, entry), { recursive: true });
  }
  return scratch;
}

function runGate(root) {
  return spawnSync(process.execPath, [script], {
    encoding: 'utf8',
    env: { ...process.env, EUTECTIC_CONTRACTS_ROOT: root },
  });
}

test('the gate passes on an untouched copy of the contract', (t) => {
  if (!existsSync(path.join(contractsRoot, 'scripts', 'generate.mjs'))) {
    t.skip('contracts package has no scripts/ — nothing to copy');
    return;
  }
  const scratch = copyContracts();
  try {
    const result = runGate(scratch);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /contract-freshness: OK/);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test('the gate fails when openapi.yaml gains an operation generated/ does not have', (t) => {
  if (!existsSync(path.join(contractsRoot, 'scripts', 'generate.mjs'))) {
    t.skip('contracts package has no scripts/ — nothing to copy');
    return;
  }
  const scratch = copyContracts();
  try {
    const specPath = path.join(scratch, 'openapi.yaml');
    const spec = readFileSync(specPath, 'utf8');
    // A new path, spelled the way the generator's scanner reads them.
    const drifted = spec.replace(
      /^paths:\n/m,
      'paths:\n  /probe-drift:\n    get:\n      operationId: probeDrift\n      responses:\n' +
        "        '204':\n          description: no content\n",
    );
    assert.notEqual(drifted, spec, 'test fixture failed to modify the spec');
    writeFileSync(specPath, drifted, 'utf8');

    const result = runGate(scratch);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /generated\/ is stale/);
    assert.match(result.stderr, /client\.ts differs/);
    assert.match(result.stderr, /server-types\.ts differs/);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
