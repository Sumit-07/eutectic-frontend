// M0-FE-10 — frontend-spec §19.8 / CLAUDE.md rule 9.
//
//   "Premium neutrality: markup for a premium-authored and free-authored entry
//    is byte-identical apart from content. No badges, no ordering hints."
//
// ── This gate is XFAIL, on purpose, and says so on every run ───────────────
//
// The real test renders the same entry twice — once authored by a user with a
// premium entitlement, once by a free user — and diffs the markup. apps/web
// cannot do that yet: no route renders entitlement-derived data, `Entry` takes
// a fixed fixture, and there is no seeded premium user to render as. Writing a
// green assertion against that absence would produce the worst artefact in this
// PR: a gate that passes because it tests nothing, in front of an invariant
// CLAUDE.md rule 9 says is non-negotiable.
//
// So it exits 0 with an XFAIL line that `ci-gates` prints in its summary every
// run. It is impossible to read a green ci-gates run and believe premium
// neutrality has been checked. That is the whole design.
//
// The gate does do the one thing it CAN do today, and fails for real on it: a
// static scan for the shapes §19.8 forbids by name. If any of this app's entry
// or feed markup starts branching on an entitlement, or renders something
// called a badge/pro/premium/upgrade marker, that is a rule 9 violation
// visible in source, and it is a hard failure — not an XFAIL.
//
// ── Tracking ───────────────────────────────────────────────────────────────
//   Becomes a real test when: an entry renders entitlement-derived data — M1,
//   with the Entry system's first real data route (frontend-spec §9.2/§9.3).
//   What it will do then: render one entry twice with the two entitlement
//   shapes, normalise the content, and assert the markup is byte-identical.
//   Owner: whoever lands that route; this file is the placeholder they replace.
//
// Node builtins only.

import { blankComments, lineOf, lineTextOf, listSourceFiles, read } from './lib/sources.mjs';

const GATE = 'premium-neutrality';
const TRACKING =
  'XFAIL — not yet testable. Becomes a real byte-identical-markup test at M1, when an entry ' +
  'renders entitlement-derived data (frontend-spec §9.2/§9.3). CLAUDE.md rule 9.';

// Shapes §19.8 forbids outright. If any of these appears in rendering code, the
// invariant is already being broken and this stops being an XFAIL.
const FORBIDDEN = [
  {
    pattern: /\b(?:isPremium|hasPremium|premiumOnly|isPro|tier\s*===|plan\s*===)\b/g,
    message: 'entitlement branch in rendering code — §19.8 forbids markup that differs by plan',
  },
  {
    pattern: /\b(?:PremiumBadge|ProBadge|PlanBadge|UpgradeBadge|premium-badge|pro-badge)\b/g,
    message: 'a plan badge — §19.8: "No badges"',
  },
  {
    pattern: /\bboost(?:ed)?(?:Score|Rank|Weight)\b|\brankBoost\b|\bpriorityBoost\b/g,
    message: 'an ordering hint tied to a plan — §19.8: "no ordering hints"; CLAUDE.md rule 9',
  },
];

const files = listSourceFiles({ exts: ['.ts', '.tsx'] });
const violations = [];

for (const file of files) {
  const raw = read(file);
  const text = blankComments(raw);
  for (const { pattern, message } of FORBIDDEN) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      violations.push({
        file: file.relative,
        line: lineOf(raw, m.index),
        message,
        snippet: lineTextOf(raw, m.index),
      });
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `${GATE}: FAILED — ${violations.length} violation(s) of frontend-spec §19.8 / CLAUDE.md rule 9\n\n`,
  );
  for (const v of violations) {
    process.stderr.write(`  ${v.file}:${v.line}  ${v.message}\n      ${v.snippet}\n`);
  }
  process.stderr.write(
    '\nThis is an invariant, not a preference: premium never buys reach, and it never buys a\n' +
      'different-looking entry. Relaxing it is a CLAUDE.md §6 escalation to the human.\n',
  );
  process.exit(1);
}

process.stdout.write(`${GATE}: ${TRACKING}\n`);
process.stdout.write(
  `${GATE}: the checkable part passed — ${files.length} file(s) scanned, no entitlement branch, ` +
    'no plan badge, no ordering hint in rendering code. That is NOT the §19.8 test.\n',
);
