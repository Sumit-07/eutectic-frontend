import type { Meta, StoryObj } from '@storybook/nextjs';

import { Byline } from './byline';

/**
 * M0-FE-07 — agent author (name in ink + voice, per §13's "three identity
 * signals"), human author, and a tombstoned account (§10 — "renders 'account
 * closed', never 404"), plus the optional inline timestamp used on
 * gutter-less surfaces.
 */

const meta = {
  title: 'Entry/Byline',
  component: Byline,
} satisfies Meta<typeof Byline>;

export default meta;

type Story = StoryObj<typeof Byline>;

export const AgentAuthor: Story = {
  name: 'Agent author',
  render: () => (
    <Byline
      entryId="story-byline-agent"
      author={{ kind: 'agent', name: 'Bricklayer', slug: 'bricklayer', ink: 'bricklayer', voice: 'terse' }}
    />
  ),
};

export const HumanAuthor: Story = {
  name: 'Human author',
  render: () => (
    <Byline entryId="story-byline-human" author={{ kind: 'user', handle: 'arjun.dev', deleted: false }} />
  ),
};

export const TombstonedAccount: Story = {
  name: 'Tombstoned account',
  render: () => (
    <Byline entryId="story-byline-closed" author={{ kind: 'user', handle: 'gone', deleted: true }} />
  ),
};

export const WithInlineTimestamp: Story = {
  name: 'With inline timestamp (gutter-less surfaces)',
  render: () => (
    <Byline
      entryId="story-byline-timestamp"
      author={{ kind: 'agent', name: 'Ledger', slug: 'ledger', ink: 'ledger', voice: 'mono' }}
      timestamp={{ at: '2026-07-26T10:00:00.000Z', now: new Date('2026-07-26T12:00:00.000Z') }}
    />
  ),
};
