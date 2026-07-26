// M0-FE-08 — contract staleness gate.
//
// The typed client apps/web imports is generated from `openapi.yaml`. If the
// spec moves and `generated/` does not, apps/web compiles happily against a
// contract the API no longer serves. This script is what makes that a failing
// build instead of a runtime surprise.
//
// ── How it works ───────────────────────────────────────────────────────────
// `packages/contracts/scripts/generate.mjs` is written as a module: it exports
// `scanOperations`, `renderClient` and `renderServerTypes`, and only writes
// files when it is the process entry point. So this gate re-runs the generator
// *in memory* against the current `openapi.yaml` and byte-compares the result
// with the committed `generated/client.ts` and `generated/server-types.ts`.
// `generated/schema.ts` (openapi-typescript's output) is regenerated into a
// temporary directory and compared the same way.
//
// Nothing is written into eutectic-shared, so there is no state to restore, no
// window in which a parallel process sees half-written files, and no way for
// this check to "fix" drift by accident instead of reporting it. It is also
// therefore safe to run on a dirty working tree — unlike the
// `generate && git status --porcelain` shape, which cannot tell drift it caused
// from edits that were already there.
//
// ── How CI runs it ─────────────────────────────────────────────────────────
//   pnpm --filter @eutectic/web check:contract-freshness
//
// It is also the second step of `pnpm --filter @eutectic/web test`. Its only
// precondition is a resolvable `@eutectic/contracts` — exactly what `next build`
// already needs — so it runs wherever the workspace install runs. It requires no
// git, no network, and no write access.
//
// Two skip conditions, both reported loudly on stdout with exit code 0:
//   · the contracts package ships only `dist/` (a published tarball, no
//     `scripts/`, no `generated/`): there is no source to regenerate from, so
//     freshness was settled when that artefact was built;
//   · `openapi-typescript` is not installed (contracts' devDependency is absent
//     in a production install): `client.ts` and `server-types.ts` are still
//     compared in full, only `schema.ts` is skipped.
// Anything else — a real diff, an unreadable spec, a generator that throws — is
// exit code 1.
//
// Zero new dependencies: node builtins only.

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(here, '..');
const require = createRequire(pathToFileURL(path.join(webRoot, 'package.json')));

function fail(message) {
  process.stderr.write(`contract-freshness: FAILED — ${message}\n`);
  process.exit(1);
}

function skip(message) {
  process.stdout.write(`contract-freshness: SKIPPED — ${message}\n`);
  process.exit(0);
}

// `@eutectic/contracts` exports no `./package.json` subpath, so resolve the one
// entry point it does export and walk up to the package root.
// `EUTECTIC_CONTRACTS_ROOT` overrides the lookup; it exists so
// `test/contract-freshness.test.mjs` can point this gate at a copy of the
// package with a deliberately drifted spec and prove it fails. Nothing in a
// normal run, local or CI, sets it.
let contractsRoot = process.env.EUTECTIC_CONTRACTS_ROOT;
if (!contractsRoot) {
  try {
    const clientEntry = require.resolve('@eutectic/contracts/client');
    // .../packages/contracts/dist/generated/client.js → .../packages/contracts
    contractsRoot = path.resolve(path.dirname(clientEntry), '..', '..');
  } catch (error) {
    fail(`cannot resolve @eutectic/contracts from apps/web (${error.message})`);
  }
}

const specPath = path.join(contractsRoot, 'openapi.yaml');
const generatorPath = path.join(contractsRoot, 'scripts', 'generate.mjs');
const generatedDir = path.join(contractsRoot, 'generated');

if (!existsSync(generatorPath) || !existsSync(generatedDir)) {
  skip(
    `@eutectic/contracts at ${contractsRoot} ships no scripts/ or generated/ ` +
      `— nothing to regenerate from (published artefact, not a source checkout)`,
  );
}
if (!existsSync(specPath)) {
  fail(`openapi.yaml not found at ${specPath}`);
}

const generator = await import(pathToFileURL(generatorPath).href);
const yaml = readFileSync(specPath, 'utf8');
const operations = generator.scanOperations(yaml);

const drift = [];

function compare(fileName, expected) {
  const actualPath = path.join(generatedDir, fileName);
  if (!existsSync(actualPath)) {
    drift.push(`${fileName} is missing from generated/`);
    return;
  }
  const actual = readFileSync(actualPath, 'utf8');
  if (actual === expected) return;

  const actualLines = actual.split('\n');
  const expectedLines = expected.split('\n');
  const limit = Math.max(actualLines.length, expectedLines.length);
  let firstDiff = -1;
  for (let i = 0; i < limit; i += 1) {
    if (actualLines[i] !== expectedLines[i]) {
      firstDiff = i;
      break;
    }
  }
  drift.push(
    `${fileName} differs from what openapi.yaml generates ` +
      `(first difference at line ${firstDiff + 1}: ` +
      `committed ${JSON.stringify(actualLines[firstDiff] ?? '<end of file>')}, ` +
      `expected ${JSON.stringify(expectedLines[firstDiff] ?? '<end of file>')})`,
  );
}

compare('client.ts', generator.renderClient(operations));
compare('server-types.ts', generator.renderServerTypes(operations));

// schema.ts is openapi-typescript's own output; regenerate it into a temp dir.
let schemaChecked = false;
let schemaSkipReason = '';
const contractsRequire = createRequire(pathToFileURL(path.join(contractsRoot, 'package.json')));
let binPath;
try {
  const pkgJsonPath = contractsRequire.resolve('openapi-typescript/package.json');
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  const bin = typeof pkgJson.bin === 'string' ? pkgJson.bin : pkgJson.bin['openapi-typescript'];
  binPath = path.join(path.dirname(pkgJsonPath), bin);
} catch (error) {
  schemaSkipReason = `openapi-typescript is not installed for @eutectic/contracts (${error.message})`;
}

if (binPath) {
  const scratch = mkdtempSync(path.join(tmpdir(), 'eutectic-contract-freshness-'));
  try {
    const out = path.join(scratch, 'schema.ts');
    execFileSync(process.execPath, [binPath, specPath, '--output', out], {
      stdio: ['ignore', 'ignore', 'inherit'],
      cwd: contractsRoot,
    });
    compare('schema.ts', readFileSync(out, 'utf8'));
    schemaChecked = true;
  } catch (error) {
    fail(`could not regenerate schema.ts: ${error.message}`);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (drift.length > 0) {
  process.stderr.write(
    'contract-freshness: generated/ is stale — openapi.yaml has moved and the\n' +
      'generated client has not. Regenerate in eutectic-shared and commit the result:\n' +
      '  pnpm --filter @eutectic/contracts generate\n\n',
  );
  for (const item of drift) {
    process.stderr.write(`  · ${item}\n`);
  }
  process.exit(1);
}

const checked = schemaChecked ? 3 : 2;
process.stdout.write(
  `contract-freshness: OK — ${checked} generated file(s) match openapi.yaml ` +
    `(${operations.length} operations)\n`,
);
if (!schemaChecked) {
  process.stdout.write(`contract-freshness: schema.ts not compared — ${schemaSkipReason}\n`);
}
