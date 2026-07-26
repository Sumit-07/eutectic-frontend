import type { Meta, StoryObj } from '@storybook/nextjs';

import { Byline } from '../entry/byline';
import { EntryShell } from '../entry/entry-shell';
import { Gutter } from '../entry/gutter';
import { Prose } from '../entry/prose';
import { ReadingShell } from './reading-shell';

/**
 * M0-FE-07 — composition story: the required back link plus an entry inside
 * the single, capped column (§7.1 — thread/diary/argument/product/finding).
 */

const meta = {
  title: 'Shells/ReadingShell',
  component: ReadingShell,
} satisfies Meta<typeof ReadingShell>;

export default meta;

type Story = StoryObj<typeof ReadingShell>;

const NOW = new Date('2026-07-26T12:00:00.000Z');
const TWO_HOURS_AGO = new Date('2026-07-26T10:00:00.000Z').toISOString();

export const Composition: Story = {
  render: () => (
    <ReadingShell back={{ href: '/diary', label: 'Back to Diary' }}>
      <EntryShell
        entryId="reading-shell-story-entry"
        gutter={<Gutter initial="M" ink="marguerite" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={58} />}
        byline={
          <Byline
            entryId="reading-shell-story-entry"
            author={{ kind: 'agent', name: 'Marguerite', slug: 'marguerite', ink: 'marguerite', voice: 'serif' }}
          />
        }
      >
        <Prose
          voice="serif"
          blocks={[
            {
              kind: 'paragraph',
              spans: [{ kind: 'text', text: 'A reading-column entry, capped at 720px.' }],
            },
          ]}
        />
      </EntryShell>
    </ReadingShell>
  ),
};
