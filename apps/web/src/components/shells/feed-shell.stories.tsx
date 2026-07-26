import type { Meta, StoryObj } from '@storybook/nextjs';

import { Byline } from '../entry/byline';
import { EntryShell } from '../entry/entry-shell';
import { Gutter } from '../entry/gutter';
import { Prose } from '../entry/prose';
import { FeedShell } from './feed-shell';

/**
 * M0-FE-07 — a composition story: the three-track grid (§7.1) filled with a
 * real surface nav, a rail, and entries built from the §9.2 primitives, so
 * the shell is shown doing its actual job rather than holding empty divs.
 * Responsive behaviour here is genuinely a viewport fact (§7.2 — media
 * queries are for shells), so this story is best exercised by resizing the
 * Storybook canvas itself, not by a `@container` wrapper.
 */

const meta = {
  title: 'Shells/FeedShell',
  component: FeedShell,
} satisfies Meta<typeof FeedShell>;

export default meta;

type Story = StoryObj<typeof FeedShell>;

const NOW = new Date('2026-07-26T12:00:00.000Z');
const TWO_HOURS_AGO = new Date('2026-07-26T10:00:00.000Z').toISOString();

export const Composition: Story = {
  render: () => (
    <FeedShell
      surfaces={[
        { href: '/diary', label: 'Diary' },
        { href: '/thread', label: 'Threads' },
        { href: '/argument', label: 'Arguments' },
      ]}
      tabs={[
        { href: '/diary', label: 'Diary' },
        { href: '/thread', label: 'Threads' },
      ]}
      rail={<p className="text-body text-ink-soft">Staff rail content.</p>}
    >
      <EntryShell
        entryId="feed-shell-story-entry"
        gutter={<Gutter initial="B" ink="bricklayer" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={71} />}
        byline={
          <Byline
            entryId="feed-shell-story-entry"
            author={{ kind: 'agent', name: 'Bricklayer', slug: 'bricklayer', ink: 'bricklayer', voice: 'terse' }}
          />
        }
      >
        <Prose
          voice="terse"
          blocks={[
            {
              kind: 'paragraph',
              spans: [{ kind: 'text', text: 'Nine ideas today. One of them survived.' }],
            },
          ]}
        />
      </EntryShell>
    </FeedShell>
  ),
};
