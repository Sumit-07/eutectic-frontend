// P-08 — DIRECTIVE §5 §7, D-029. Refined for Phase 2 by D-041.
//
// D-029: "the GitHub identity is no longer displayed... Public serializers
// expose handle, tier and platform join date only." The byline (M0-FE-06)
// already renders `handle` only; this test is the invariant that keeps it
// that way while P-08 absorbs the PublicUser rename and adds the handle
// flows. The allowlist is EMPTY on purpose (per the P-08 ticket) — nothing
// in this app's source may name the private identity field at all, not only
// the byline. If a change needs to add an entry here, that is a stop-and-ask,
// not a quiet edit.
//
// D-041: Phase 2 adds the real one-tap "use my GitHub handle" control, which
// necessarily names `use_github_login` — the contract's boolean sentinel
// (`HandleUpdateFromGitHub`, openapi.yaml) that tells the server "resolve it
// yourself." The login string itself never crosses the wire in either
// direction; the sentinel carries no private value at all. Fable's ruling on
// the resulting collision (the sentinel's name contains the substring this
// test bans) is: do NOT allowlist a file — refine the match instead. A
// negative lookbehind excludes exactly the `use_` prefix, so `use_github_login`
// passes while a bare `github_login` (or any other prefix) still fails. The
// allowlist stays EMPTY.
//
// Scans raw source (comments included, deliberately stricter than the
// token-lint gate's comment-blanking) so a stray mention in a doc comment
// fails just as loudly as a real property access.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listSourceFiles, read } from '../scripts/lib/sources.mjs';

// The literal is assembled at runtime so this file itself does not trip a
// naive "does this repo mention the string" search anywhere else.
const PRIVATE_IDENTITY_FIELD = ['github', 'login'].join('_');

// D-041: `(?<!use_)` excludes only the sentinel's exact spelling, not "any
// prefix" — `xuse_github_login` or `not_use_github_login` still fail, because
// the lookbehind only matches when the four characters immediately before
// `github_login` are literally `use_`. Nothing else gets a pass.
const PRIVATE_IDENTITY_PATTERN = new RegExp(`(?<!use_)${PRIVATE_IDENTITY_FIELD}`);

/** Currently empty (P-08 / D-041). Any addition here is a judgment call for the domain CTO, not this test. */
const ALLOWLIST = new Set([]);

test('no source file under apps/web/src names the private GitHub-identity field', () => {
  const files = listSourceFiles({
    exts: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    dirs: ['src'],
  });

  const offenders = [];
  for (const file of files) {
    if (ALLOWLIST.has(file.relative)) continue;
    const text = read(file);
    if (PRIVATE_IDENTITY_PATTERN.test(text)) {
      offenders.push(file.relative);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `byline/handle invariant (D-029): these files reference the private identity ` +
      `field and are not on the allowlist: ${offenders.join(', ')}`,
  );
});

test('D-041: the boolean sentinel "use_github_login" is not the private field and must pass', () => {
  assert.equal(PRIVATE_IDENTITY_PATTERN.test('use_github_login'), false);
  assert.equal(PRIVATE_IDENTITY_PATTERN.test('body: { use_github_login: true }'), false);
});

test('D-041: a bare mention of the private field still fails, any other prefix included', () => {
  assert.equal(PRIVATE_IDENTITY_PATTERN.test('github_login'), true);
  assert.equal(PRIVATE_IDENTITY_PATTERN.test('user.github_login'), true);
  // Only the exact four characters `use_` immediately before the field name
  // are excused — a different prefix of the same length still trips it. (The
  // lookbehind checks only those four characters, not the whole token: a
  // string that happens to END in the literal four characters `use_` right
  // before `github_login` — e.g. a hypothetical `misuse_github_login` —
  // would also be excused by this simple check. That is the accepted shape
  // of Fable's ruling, not a gap this test pretends is closed.)
  assert.equal(PRIVATE_IDENTITY_PATTERN.test('my_github_login'), true);
});
