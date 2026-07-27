// @ts-nocheck
// M0-FE-14 — TEMPORARY red-proof fixture. Not imported anywhere. Deliberately
// trips five of the frontend-spec §19 gates at once (token-lint, banned-imports,
// premium-neutrality, a11y, client-components) so the red-proof battery has a
// real CI run to point at. Reverted in the same PR before merge — see the
// M0-FE-14 PR body's red-proof table for the run this produced.
//
// The @ts-nocheck above is itself temporary: `next build` type-checks every
// file under the tsconfig include set, reachable or not, and `lodash` has no
// installed type declarations — without this the whole build fails to
// compile (discovered in the sabotage 1/2 run), which masks bundle-budgets'
// and lighthouse's real over-budget proofs in sabotage 2/2. banned-imports
// itself is a static text scan and is unaffected either way.
'use client';

import _ from 'lodash';

export const SABOTAGE_COLOR = '#ff00ff';
export const isPremium = true;

export function SabotageLeaf() {
  void _;
  return (
    <button aria-hidden>
      <svg />
    </button>
  );
}
