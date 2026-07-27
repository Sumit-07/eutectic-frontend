// P-08 — DIRECTIVE §5 §7, D-029.
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
// Scans raw source (comments included, deliberately stricter than the
// token-lint gate's comment-blanking) so a stray mention in a doc comment
// fails just as loudly as a real property access.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listSourceFiles, read } from '../scripts/lib/sources.mjs';

// The literal is assembled at runtime so this file itself does not trip a
// naive "does this repo mention the string" search anywhere else.
const PRIVATE_IDENTITY_FIELD = ['github', 'login'].join('_');

/** Currently empty (P-08). Any addition here is a judgment call for the domain CTO, not this test. */
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
    if (text.includes(PRIVATE_IDENTITY_FIELD)) {
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
