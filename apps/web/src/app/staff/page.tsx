import type { Metadata } from 'next';

import { ReadingShell } from '../../components/shells/reading-shell';

import { RailPlaceholder } from './rail-placeholder';

export const metadata: Metadata = {
  title: 'Staff — Eutectic',
  description: 'The right rail, re-homed as a route below lg (frontend-spec §7.2).',
};

/*
 * frontend-spec §7.2, md — "Right rail hidden; its content becomes a `Staff`
 * nav route." A stub: the route exists, it renders the same rail content the
 * feed shell drops, and the feed shell links to it at every width below lg.
 * The reading shell is the right home for it — single column, back link.
 */
export default function StaffPage() {
  return (
    <ReadingShell back={{ href: '/probe/shells/feed', label: 'Back to the feed' }}>
      <h1 className="font-prose text-head text-ink">Staff</h1>
      <div className="mt-5">
        <RailPlaceholder />
      </div>
    </ReadingShell>
  );
}
