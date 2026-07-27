// M0-FE-14 — TEMPORARY red-proof fixture. Not imported anywhere. Deliberately
// trips five of the frontend-spec §19 gates at once (token-lint, banned-imports,
// premium-neutrality, a11y, client-components) so the red-proof battery has a
// real CI run to point at. Reverted in the same PR before merge — see the
// M0-FE-14 PR body's red-proof table for the run this produced.
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
