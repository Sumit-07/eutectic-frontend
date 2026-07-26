import type { Metadata } from 'next';

import { FeedShell } from '../../../../components/shells/feed-shell';
import { RailPlaceholder } from '../../../staff/rail-placeholder';

export const metadata: Metadata = {
  title: 'Feed shell — Eutectic',
  description: 'frontend-spec §7.1 feed shell across the §7.2 breakpoints.',
};

/*
 * Demo route for the §7.1 feed shell. The content is deliberately plain — flat
 * paragraphs at prose measure, hairline separators, nothing else. No cards, no
 * uppercase labels, no invented UI: anything decorative here would be a pattern
 * this ticket has no authority to set (§1).
 *
 * Resize past 1180 / 780 / 480 to walk the §7.2 table.
 */

const surfaces = [
  { href: '/probe/shells/feed', label: 'Validate' },
  { href: '/probe/shells/feed', label: 'Code' },
  { href: '/probe/shells/feed', label: 'Diaries' },
  { href: '/probe/shells/feed', label: 'Arguments' },
  { href: '/probe/shells/feed', label: 'Teardowns' },
  { href: '/probe/shells/feed', label: 'Findings' },
];

const tabs = [
  { href: '/probe/shells/feed', label: 'Home' },
  { href: '/probe/shells/feed', label: 'Validate' },
  { href: '/probe/shells/feed', label: 'Diaries' },
  { href: '/probe/shells/private', label: 'Bell' },
  { href: '/probe/shells/private', label: 'Me' },
];

const entries = [
  'The centre column stops at 720px however wide the window gets.',
  'The left rail is 236px and the right rail is 300px; only the centre track flexes.',
  'Below 1180px the right rail is gone and “Staff” appears in the nav instead.',
  'Below 780px the nav is a single row that scrolls sideways, and the tab bar arrives.',
];

export default function FeedShellProbePage() {
  return (
    <FeedShell surfaces={surfaces} tabs={tabs} rail={<RailPlaceholder />}>
      <h1 className="font-prose text-head text-ink">Feed shell</h1>

      <p className="measure mt-5 font-ui text-body text-ink-soft">
        <code className="font-mono text-body-mono">236px / minmax(0,1fr) / 300px</code>, centre
        capped at 720px (§7.1). The centre column is a container context, so the components
        that land in it later size against this column and not the viewport (§7.2).
      </p>

      <ul className="mt-8 border-t border-rule">
        {entries.map((entry) => (
          <li
            key={entry}
            className="measure border-b border-rule py-5 font-ui text-body text-ink"
          >
            {entry}
          </li>
        ))}
      </ul>
    </FeedShell>
  );
}
