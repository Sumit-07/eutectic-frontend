// M0-FE-10 — frontend-spec §19.2 / §1 row 17 / CLAUDE.md rule 2.
// M0-FE-13 / D-021 — the local-tokens exemption is RETIRED, not relaxed.
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
// ── No exemption, anywhere ─────────────────────────────────────────────────
// `src/app/globals.css` used to carry THE sanctioned local-tokens block
// (D-010, D-012, D-017), delimited by `eutectic:local-tokens:begin` / `:end`,
// inside which rules 2 and 4 and the bare-dimension check were lifted.
//
// M0-SH-13 landed everything that block held in `packages/tokens` (D-021);
// M0-FE-13 deleted the block. There is no longer anywhere in this app a raw
// dimension or duration literal is allowed to live — rules 2 and 4 apply to
// `src/app/globals.css` exactly as they apply to every other file. A
// `eutectic:local-tokens:begin` or `:end` marker appearing ANYWHERE in the
// app is now a failure in its own right: the block it used to delimit is
// retired, and nothing may reopen it (D-021, D-017).
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
const SPEC = 'frontend-spec §19.2, §1 row 17, CLAUDE.md rule 2, D-021';

const BEGIN = 'eutectic:local-tokens:begin';
const END = 'eutectic:local-tokens:end';

const files = listSourceFiles({ exts: ['.css', '.ts', '.tsx', '.mjs'] });
const violations = [];

// ── the retired block: any marker anywhere is now a failure ────────────────
for (const file of files) {
  const raw = read(file);
  const begins = [...raw.matchAll(new RegExp(BEGIN, 'g'))];
  const ends = [...raw.matchAll(new RegExp(END, 'g'))];
  if (begins.length === 0 && ends.length === 0) continue;

  for (const m of [...begins, ...ends]) {
    violations.push({
      file: file.relative,
      line: lineOf(raw, m.index),
      message:
        `${BEGIN}/${END} marker found — the local-tokens block is retired (D-021, M0-FE-13); ` +
        'packages/tokens emits everything it used to hold, so nothing may reopen it',
    });
  }
}

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

function scan(text, raw, relative, regex, message) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const index = match.index;
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
    scan(text, raw, file.relative, HEX_ANY, 'hardcoded hex colour');
    scan(text, raw, file.relative, CSS_FONT_SIZE_PX, 'px font-size');
    scan(text, raw, file.relative, CSS_DURATION, 'raw duration literal — use a `dur` token');
  } else {
    scan(text, raw, file.relative, HEX_TS_UNAMBIGUOUS, 'hardcoded hex colour');
    // Same message as HEX_TS_UNAMBIGUOUS on purpose: the two patterns overlap on
    // 6- and 8-digit hexes, and the de-duplication below keys on the message, so
    // one hex reports once.
    scan(text, raw, file.relative, HEX_TS_VALUE_POSITION, 'hardcoded hex colour');
    scan(text, raw, file.relative, TS_FONT_SIZE_PX, 'px font-size in a style object');
  }

  scan(text, raw, file.relative, ARBITRARY, 'arbitrary Tailwind value (§1 row 17)');
  scan(text, raw, file.relative, IMPORTANT, '!important (§1 row 17)');
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
    'no raw duration, no !important, no local-tokens marker anywhere (the block is retired)',
  hint:
    'Every token, breakpoint, container threshold and interaction constant now comes from\n' +
    '@eutectic/tokens (D-021, M0-SH-13) — there is no local-tokens block to fall back into.\n' +
    'If packages/tokens is genuinely missing a value, that is a shared-lane ticket, not a\n' +
    'reopened marker pair or a raw literal here.',
});
