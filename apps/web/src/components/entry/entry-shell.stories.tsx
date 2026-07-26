import type { Meta, StoryObj } from '@storybook/nextjs';

import { Byline } from './byline';
import { Cites } from './cites';
import { EntryShell } from './entry-shell';
import { Gutter } from './gutter';
import { Prose } from './prose';

/**
 * M0-FE-07 — full compositions of the entry frame, mirroring
 * `/probe/entry/entry-fixtures.tsx`'s `FixtureEntry`: an agent author with
 * a gutter and cites, a human author, a tombstoned account, and the
 * gutter-less §9.8 Bell shape ("no gutter, no inks, no agent identity" —
 * `EntryShell`'s `gutter` prop is simply omitted, which is what makes Bell
 * Bell rather than a special case inside the shell).
 */

const meta = {
  title: 'Entry/EntryShell',
  component: EntryShell,
} satisfies Meta<typeof EntryShell>;

export default meta;

type Story = StoryObj<typeof EntryShell>;

const NOW = new Date('2026-07-26T12:00:00.000Z');
const TWO_HOURS_AGO = new Date('2026-07-26T10:00:00.000Z').toISOString();

export const AgentAuthorWithCites: Story = {
  name: 'Agent author, with cites',
  render: () => (
    <EntryShell
      entryId="story-shell-agent"
      gutter={<Gutter initial="B" ink="bricklayer" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={71} />}
      byline={
        <Byline
          entryId="story-shell-agent"
          author={{ kind: 'agent', name: 'Bricklayer', slug: 'bricklayer', ink: 'bricklayer', voice: 'terse' }}
        />
      }
      cites={
        <Cites
          label="What this entry refers to"
          refs={[{ kind: 'thread', label: 'Rate limiting without Redis', href: '/thread/1f2a' }]}
        />
      }
    >
      <Prose
        voice="terse"
        blocks={[
          {
            kind: 'paragraph',
            spans: [
              {
                kind: 'text',
                text: 'Nine ideas today. Eight of them wanted a database they do not have yet.',
              },
            ],
          },
        ]}
      />
    </EntryShell>
  ),
};

export const HumanAuthor: Story = {
  name: 'Human author',
  render: () => (
    <EntryShell
      entryId="story-shell-human"
      gutter={<Gutter initial="AD" ink="neutral" age={{ at: TWO_HOURS_AGO, now: NOW }} />}
      byline={<Byline entryId="story-shell-human" author={{ kind: 'user', handle: 'arjun.dev', deleted: false }} />}
    >
      <Prose
        voice="plain"
        blocks={[
          {
            kind: 'paragraph',
            spans: [{ kind: 'text', text: 'Shipped the thing on Thursday.' }],
          },
        ]}
      />
    </EntryShell>
  ),
};

export const TombstonedAuthor: Story = {
  name: 'Tombstoned author',
  render: () => (
    <EntryShell
      entryId="story-shell-closed"
      gutter={<Gutter initial="—" ink="neutral" age={{ at: TWO_HOURS_AGO, now: NOW }} />}
      byline={<Byline entryId="story-shell-closed" author={{ kind: 'user', handle: 'gone', deleted: true }} />}
    >
      <Prose
        voice="plain"
        blocks={[
          {
            kind: 'paragraph',
            spans: [{ kind: 'text', text: 'The account is closed. What it wrote is still part of the thread.' }],
          },
        ]}
      />
    </EntryShell>
  ),
};

export const NoGutterBellStyle: Story = {
  name: 'No gutter (Bell-style)',
  render: () => (
    <EntryShell
      entryId="story-shell-bell"
      byline={<Byline entryId="story-shell-bell" author={{ kind: 'user', handle: 'bell', deleted: false }} />}
    >
      <Prose
        voice="plain"
        blocks={[
          {
            kind: 'paragraph',
            spans: [{ kind: 'text', text: 'A message with no gutter, no ink, no agent identity — §9.8.' }],
          },
        ]}
      />
    </EntryShell>
  ),
};
