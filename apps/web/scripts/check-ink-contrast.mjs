// M0-FE-10 — frontend-spec §19.3 / §13.
//
//   "Every agent ink verified >= 4.5:1 against `paper` in both themes. A CI
//    script reads tokens.json and fails the build on a miss, so a new agent
//    cannot ship illegible."
//
// 7 agent inks x 2 themes = 14 pairs. All 14 are computed here from the
// generated `@eutectic/tokens/tokens.json` — the artefact that actually ships —
// and nothing is hardcoded but the 4.5 threshold the spec names. Add an eighth
// ink and this gate checks 16 pairs on the next run without being edited; that
// is the point of reading the token set rather than a list.
//
// `packages/tokens` runs its own contrast check at build time (D-010). This is
// not a duplicate: that one guards the token package's own release, this one
// guards *this app's installed copy*. A tokens version that regressed, or a
// stale `generated/` in a consumer's node_modules, is invisible to the first
// and caught by the second. Same standard, two sides of the package boundary.
//
// The WCAG 2.2 relative-luminance formula is implemented inline (20 lines,
// below) rather than pulled from a colour library — CLAUDE.md rule 12, and the
// formula has not changed since 2008.
//
// Node builtins only.

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { webRoot } from './lib/sources.mjs';

const GATE = 'ink-contrast';
const MIN_RATIO = 4.5; // WCAG 2.2 AA, normal text — frontend-spec §13

const require = createRequire(pathToFileURL(path.join(webRoot, 'package.json')));

// `EUTECTIC_TOKENS_JSON` overrides the lookup. It exists so this gate can be
// pointed at a copy of tokens.json with a deliberately failing ink and proved to
// go red — the ink values themselves live in packages/tokens, which is Fable's
// and single-threaded (CLAUDE.md rule 3), so a gate that could only be exercised
// by editing them could never be exercised at all. Same seam, same reason, as
// `EUTECTIC_CONTRACTS_ROOT` in check-contract-freshness.mjs. Nothing in a normal
// run, local or CI, sets it.
let tokensPath = process.env.EUTECTIC_TOKENS_JSON;
try {
  if (!tokensPath) tokensPath = require.resolve('@eutectic/tokens/tokens.json');
} catch (error) {
  process.stderr.write(
    `${GATE}: FAILED — cannot resolve @eutectic/tokens/tokens.json from apps/web (${error.message})\n`,
  );
  process.exit(1);
}

const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));

// ── WCAG 2.2 relative luminance and contrast ratio ─────────────────────────

function parseHex(hex) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) throw new Error(`not a 6-digit hex colour: ${JSON.stringify(hex)}`);
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function channelLuminance(value8Bit) {
  const c = value8Bit / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map(channelLuminance);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ── the 14 pairs ───────────────────────────────────────────────────────────

const { themeNames, agentInkNames, themes, contrast } = tokens;

function fail(message) {
  process.stderr.write(`${GATE}: FAILED — ${message}\n`);
  process.exit(1);
}

if (!Array.isArray(themeNames) || themeNames.length === 0) fail('tokens.json has no themeNames');
if (!Array.isArray(agentInkNames) || agentInkNames.length === 0) {
  fail('tokens.json has no agentInkNames');
}
if (contrast && typeof contrast.minRatio === 'number' && contrast.minRatio !== MIN_RATIO) {
  fail(
    `tokens.json declares minRatio ${contrast.minRatio} but frontend-spec §13 requires ${MIN_RATIO} — ` +
      'the spec and the token package disagree; that is a decision, not a lint fix',
  );
}

const rows = [];
const failures = [];

for (const theme of themeNames) {
  const themeTokens = themes?.[theme];
  if (!themeTokens) fail(`tokens.json has no themes.${theme}`);
  const paper = themeTokens.colors?.paper;
  if (!paper) fail(`tokens.json has no themes.${theme}.colors.paper`);

  for (const ink of agentInkNames) {
    const value = themeTokens.agentInks?.[ink];
    if (!value) fail(`tokens.json has no themes.${theme}.agentInks.${ink}`);
    let ratio;
    try {
      ratio = contrastRatio(value, paper);
    } catch (error) {
      fail(`${theme}/${ink}: ${error.message}`);
    }
    const pass = ratio >= MIN_RATIO;
    rows.push({ theme, ink, value, paper, ratio, pass });
    if (!pass) failures.push({ theme, ink, value, paper, ratio });
  }
}

const expected = themeNames.length * agentInkNames.length;
if (rows.length !== expected) {
  fail(`checked ${rows.length} pairs, expected ${expected}`);
}

const width = Math.max(...rows.map((r) => `${r.theme}/${r.ink}`.length));
for (const row of rows) {
  const label = `${row.theme}/${row.ink}`.padEnd(width);
  process.stdout.write(
    `  ${label}  ${row.value} on ${row.paper}  ${row.ratio.toFixed(4).padStart(8)}:1  ` +
      `${row.pass ? 'pass' : 'FAIL'}\n`,
  );
}

if (failures.length > 0) {
  process.stderr.write(
    `\n${GATE}: FAILED — ${failures.length} of ${rows.length} ink/paper pair(s) below ` +
      `${MIN_RATIO}:1 (frontend-spec §13, §19.3)\n\n`,
  );
  for (const f of failures) {
    process.stderr.write(
      `  ${f.theme}/${f.ink}: ${f.value} on ${f.paper} is ${f.ratio.toFixed(4)}:1\n`,
    );
  }
  process.stderr.write(
    '\nThe ink values live in packages/tokens (Fable owns them, CLAUDE.md rule 3). D-010 is the\n' +
      'precedent: the gate is the arbiter and the spec follows the measurement — an ink that fails\n' +
      'here is changed in the token package, never waived here.\n',
  );
  process.exit(1);
}

process.stdout.write(
  `${GATE}: OK — ${rows.length} pairs (${agentInkNames.length} inks x ${themeNames.length} themes) ` +
    `all >= ${MIN_RATIO}:1 against paper; tightest ` +
    `${(() => {
      const min = rows.reduce((a, b) => (a.ratio <= b.ratio ? a : b));
      return `${min.theme}/${min.ink} at ${min.ratio.toFixed(4)}:1`;
    })()}\n`,
);
