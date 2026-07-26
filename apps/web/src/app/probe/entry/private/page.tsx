import type { Schemas } from '@eutectic/contracts';
import type { Metadata } from 'next';

import { Byline } from '../../../../components/entry/byline';
import { Cites } from '../../../../components/entry/cites';
import { EntryShell } from '../../../../components/entry/entry-shell';
import { Prose } from '../../../../components/entry/prose';
import { PrivateShell } from '../../../../components/shells/private-shell';

import { FixtureEntry, PRIMARY_FIXTURE, isoMinutesAgo } from '../entry-fixtures';

export const metadata: Metadata = {
  title: 'Entry system, private shell — Eutectic',
  description: 'frontend-spec §9.2 entries in the §7.1 private shell, including the gutter-less form.',
};

/*
 * The same §9.2 components in the 640px private shell (§7.1).
 *
 * Two things this route exists to show that /probe/entry cannot:
 *
 * 1. An entry in a narrower column. `EntryShell`'s content column is `flex 1`
 *    capped at 64ch, so in a 640px shell the measure stops mattering and the
 *    column is the constraint — the entry adapts to its container, not to the
 *    viewport (§4.2).
 * 2. The gutter-less entry. §9.8 Bell is "deliberately a different visual
 *    language: no gutter, no inks, no agent identity", so the `gutter` slot is
 *    omitted entirely and the byline carries the timestamp itself, in the plain
 *    voice, with no ink anywhere on the row.
 */

const GUTTERLESS_BLOCKS: readonly Schemas['ProseBlock'][] = [
  {
    kind: 'paragraph',
    spans: [
      {
        kind: 'text',
        text: 'You said Tuesday. It is Thursday. Nothing has happened to the thing you said you would do, which is not a judgement, only the fact.',
      },
    ],
  },
  {
    kind: 'paragraph',
    spans: [
      { kind: 'text', text: 'Same components, no gutter, no ink: ' },
      { kind: 'strong', text: 'the private surface never looks like the feed' },
      { kind: 'text', text: '.' },
    ],
  },
];

export default function EntryPrivateProbePage() {
  const now = new Date();

  return (
    <PrivateShell>
      <h1 className="font-prose text-head text-ink">Entry system, private shell</h1>

      <p className="measure mbs-5 font-ui text-body text-ink-soft">
        The §9.2 entry inside the 640px column (§7.1), and beneath it the gutter-less form §9.8
        requires.
      </p>

      <div className="mbs-8">
        <p className="px-8 pbs-6 font-ui text-meta text-ink-quiet">{PRIMARY_FIXTURE.note}</p>
        <FixtureEntry fixture={PRIMARY_FIXTURE} now={now} idSuffix="-private" />

        <p className="px-8 pbs-6 font-ui text-meta text-ink-quiet">
          gutter-less · plain voice · byline carries its own timestamp
        </p>
        <EntryShell
          entryId="entry-gutterless"
          byline={
            <Byline
              entryId="entry-gutterless"
              author={{ kind: 'user', handle: 'you', deleted: false }}
              timestamp={{ at: isoMinutesAgo(now, 60 * 25), now }}
            />
          }
          cites={
            <Cites
              refs={[{ kind: 'thread', label: 'What you said on Monday', href: '/thread/aa01' }]}
              label="What this refers to"
            />
          }
        >
          <Prose blocks={GUTTERLESS_BLOCKS} voice="plain" />
        </EntryShell>
      </div>
    </PrivateShell>
  );
}
