// M0-FE-10 — frontend-spec §19.2 / §1 row 17 / CLAUDE.md rule 2.
//
//   "A hardcoded hex, px font-size, or arbitrary value outside packages/tokens"
//
// What this gate looks for, in every .css/.ts/.tsx under src/ and .storybook/:
//
//   1. a hex colour, anywhere — `#A6640F`, `#fff`, `#16171Acc`
//   2. a px font-size — `font-size: 13px` in CSS, `fontSize: '13px'` in a style
//      object, `text-[13px]` in a class list
//   3. an arbitrary Tailwind value — `w-[240px]`, `bg-[#fff]`, `grid-cols-[1fr]`
//   4. a raw duration in a CSS declaration — `200ms`, `.3s`
//   5. `!important`
//
// ── The one exemption ──────────────────────────────────────────────────────
// `src/app/globals.css` carries THE sanctioned local-tokens block (D-010,
// D-012, D-017), delimited by `eutectic:local-tokens:begin` / `:end`. Inside
// that range, rules 2 (px in a custom property, not a font-size), 4 and the
// bare-dimension part of the check are lifted: hosting spec literals the tokens
// package cannot express yet is the block's entire purpose.
//
// Hex and arbitrary Tailwind values are NOT exempt, inside the block or out.
// A hex is a colour the tokens package already emits, and an arbitrary value is
// banned outright by §1 row 17; neither is a "token-shaped value waiting for a
// home", so neither gets the block's licence.
//
// D-017 forecloses a second block. This gate enforces that structurally: it
// fails if the marker pair appears anywhere but once, in globals.css.
//
// ── Known limits, stated rather than hidden ────────────────────────────────
// This is a lexical gate, not a compiler. It blanks comments before matching
// (so a hex quoted in a doc comment is fine) but it cannot know that a string
// is dead code, and it cannot see a value computed at runtime — `'#' + hex` and
// `` `text-[${n}px]` `` both pass. It catches what a human writes by hand,
// which is what §19.2 is about.
//
// Node builtins only.

import { blankComments, lineOf, lineTextOf, listSourceFiles, read, report } from './lib/sources.mjs';

const GATE = 'token-lint';
const SPEC = 'frontend-spec §19.2, §1 row 17, CLAUDE.md rule 2';

const BEGIN = 'eutectic:local-tokens:begin';
const END = 'eutectic:local-tokens:end';

const files = listSourceFiles({ exts: ['.css', '.ts', '.tsx', '.mjs'] });
const violations = [];

// ── the sanctioned block: find it, and prove it is the only one ────────────
let sanctioned = null; // { relative, start, end } byte offsets in the raw text
let markerFiles = 0;

for (const file of files) {
  const raw = read(file);
  const begins = [...raw.matchAll(new RegExp(BEGIN, 'g'))];
  const ends = [...raw.matchAll(new RegExp(END, 'g'))];
  if (begins.length === 0 && ends.length === 0) continue;
  markerFiles += 1;

  if (file.relative !== 'src/app/globals.css') {
    violations.push({
      file: file.relative,
      line: lineOf(raw, (begins[0] ?? ends[0]).index),
      message:
        'local-tokens markers outside src/app/globals.css — D-017 forecloses a second block',
    });
    continue;
  }
  if (begins.length !== 1 || ends.length !== 1) {
    violations.push({
      file: file.relative,
      line: lineOf(raw, (begins[0] ?? ends[0]).index),
      message: `expected exactly one ${BEGIN}/${END} pair, found ${begins.length}/${ends.length} (D-017)`,
    });
    continue;
  }
  if (ends[0].index < begins[0].index) {
    violations.push({
      file: file.relative,
      line: lineOf(raw, ends[0].index),
      message: `${END} appears before ${BEGIN}`,
    });
    continue;
  }
  sanctioned = { relative: file.relative, start: begins[0].index, end: ends[0].index };
}

if (!sanctioned && violations.length === 0) {
  violations.push({
    file: 'src/app/globals.css',
    line: 1,
    message: `the sanctioned local-tokens block markers (${BEGIN}/${END}) are missing — the exemption cannot be located, so nothing can be exempted`,
  });
}

const inSanctioned = (relative, index) =>
  sanctioned !== null &&
  relative === sanctioned.relative &&
  index >= sanctioned.start &&
  index <= sanctioned.end;

// ── the checks ─────────────────────────────────────────────────────────────

// 3, 4, 6 or 8 hex digits, not followed by another word character.
const HEX_ANY = /#[0-9a-fA-F]{3,8}\b/g;
// In .ts/.tsx a 3- or 4-digit hex is ambiguous (`#218` is a Chip's issue
// number, not a colour), so short hexes only count in a value position:
// preceded by a quote, a colon, a comma, `(` or `=`.
const HEX_TS_VALUE_POSITION = /(?<=['"`(:,=]\s{0,4})#[0-9a-fA-F]{3,8}\b/g;
const HEX_TS_UNAMBIGUOUS = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

const CSS_FONT_SIZE_PX = /font-size\s*:\s*[^;{}]*?\d*\.?\d+px/gi;
const TS_FONT_SIZE_PX = /fontSize\s*:\s*['"`]\s*\d*\.?\d+px/gi;
const CSS_DURATION = /(?:transition|animation)(?:-duration|-delay)?\s*:\s*[^;{}]*?\d*\.?\d+m?s\b/gi;
// A Tailwind utility with an arbitrary value: `w-[240px]`, `md:text-[13px]`,
// `bg-[#fff]`, `[&>svg]:hidden`. The leading `[a-z]` and the absence of
// whitespace inside the brackets keep this off array indexing in TS.
const ARBITRARY = /(?:^|[\s"'`{(])(?:[a-z][a-zA-Z0-9-]*:)*[a-z][a-zA-Z0-9-]*-\[[^\]\s]+\]/g;
const IMPORTANT = /!important/g;

function scan(text, raw, relative, regex, message, { exemptInBlock }) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const index = match.index;
    if (exemptInBlock && inSanctioned(relative, index)) continue;
    violations.push({
      file: relative,
      line: lineOf(raw, index),
      message,
      snippet: lineTextOf(raw, index),
    });
  }
}

for (const file of files) {
  const raw = read(file);
  const text = blankComments(raw);
  const isCss = file.relative.endsWith('.css');

  if (isCss) {
    scan(text, raw, file.relative, HEX_ANY, 'hardcoded hex colour', { exemptInBlock: false });
    scan(text, raw, file.relative, CSS_FONT_SIZE_PX, 'px font-size', { exemptInBlock: true });
    scan(text, raw, file.relative, CSS_DURATION, 'raw duration literal — use a `dur` token', {
      exemptInBlock: true,
    });
  } else {
    scan(text, raw, file.relative, HEX_TS_UNAMBIGUOUS, 'hardcoded hex colour', {
      exemptInBlock: false,
    });
    // Same message as HEX_TS_UNAMBIGUOUS on purpose: the two patterns overlap on
    // 6- and 8-digit hexes, and the de-duplication below keys on the message, so
    // one hex reports once.
    scan(text, raw, file.relative, HEX_TS_VALUE_POSITION, 'hardcoded hex colour', {
      exemptInBlock: false,
    });
    scan(text, raw, file.relative, TS_FONT_SIZE_PX, 'px font-size in a style object', {
      exemptInBlock: false,
    });
  }

  scan(text, raw, file.relative, ARBITRARY, 'arbitrary Tailwind value (§1 row 17)', {
    exemptInBlock: false,
  });
  scan(text, raw, file.relative, IMPORTANT, '!important (§1 row 17)', { exemptInBlock: false });
}

// De-duplicate: the two hex regexes overlap on 6- and 8-digit matches.
const seen = new Set();
const unique = violations.filter((v) => {
  const key = `${v.file}:${v.line}:${v.message}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

report({
  gate: GATE,
  spec: SPEC,
  violations: unique,
  okMessage:
    `${files.length} file(s) clean — no hex, no px font-size, no arbitrary value, ` +
    `no raw duration, no !important; one sanctioned local-tokens block in ` +
    `${sanctioned?.relative ?? 'src/app/globals.css'} (${markerFiles} file(s) carry the markers)`,
  hint:
    'If the value is token-shaped and packages/tokens cannot emit it yet, it belongs in the ONE\n' +
    'local-tokens block in src/app/globals.css with its spec citation (D-010/D-012/D-017) —\n' +
    'not at the call site, and never as a second block. A hex or an arbitrary Tailwind value\n' +
    'is not eligible for that block: use the token.',
});
