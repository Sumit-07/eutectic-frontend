import type { Metadata } from 'next';

import { PrivateShell } from '../../../../components/shells/private-shell';

export const metadata: Metadata = {
  title: 'Private shell — Eutectic',
  description: 'frontend-spec §7.1 private shell — single column, 640px, no rails.',
};

/*
 * Demo route for the §7.1 private shell. Plain to the point of bareness on
 * purpose: §9.8 requires this surface to look nothing like the feed.
 */

const paragraphs = [
  'Single column, capped at 640px, no rails and no tab bar (§7.1). Used by Bell, settings and checkpoints.',
  'Narrower than the reading column by 80px, which is the only thing separating them structurally — and the reason §9.8’s “different visual language” has somewhere to live.',
];

export default function PrivateShellProbePage() {
  return (
    <PrivateShell>
      <h1 className="font-prose text-head text-ink">Private shell</h1>

      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="measure mt-5 font-ui text-body text-ink-soft">
          {paragraph}
        </p>
      ))}
    </PrivateShell>
  );
}
