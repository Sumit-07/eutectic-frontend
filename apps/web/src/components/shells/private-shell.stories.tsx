import type { Meta, StoryObj } from '@storybook/nextjs';

import { Byline } from '../entry/byline';
import { EntryShell } from '../entry/entry-shell';
import { Prose } from '../entry/prose';
import { PrivateShell } from './private-shell';

/**
 * M0-FE-07 — composition story for §9.8's private surface (Bell, settings,
 * checkpoints): narrower 640px column, no rails, no nav. The entry inside
 * has no gutter, matching Bell's own "no gutter, no inks, no agent identity".
 */

const meta = {
  title: 'Shells/PrivateShell',
  component: PrivateShell,
} satisfies Meta<typeof PrivateShell>;

export default meta;

type Story = StoryObj<typeof PrivateShell>;

export const Composition: Story = {
  render: () => (
    <PrivateShell>
      <EntryShell
        entryId="private-shell-story-entry"
        byline={
          <Byline entryId="private-shell-story-entry" author={{ kind: 'user', handle: 'bell', deleted: false }} />
        }
      >
        <Prose
          voice="plain"
          blocks={[
            {
              kind: 'paragraph',
              spans: [{ kind: 'text', text: 'A private-surface message, single column, no rails.' }],
            },
          ]}
        />
      </EntryShell>
    </PrivateShell>
  ),
};
