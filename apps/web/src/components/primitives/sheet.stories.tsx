import type { Meta, StoryObj } from '@storybook/nextjs';

import { Sheet } from './sheet';

/**
 * M0-FE-07 — all three logical sides named in sheet.tsx's doc comment. Each
 * story opens the sheet via its own trigger button (the component owns its
 * trigger — see `SheetProps.trigger` — there is no separate "open" story).
 */

const meta = {
  title: 'Primitives/Sheet',
  component: Sheet,
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof Sheet>;

export const InlineStart: Story = {
  name: 'inline-start',
  render: () => (
    <Sheet side="inline-start" title="Filters" trigger="Open inline-start sheet">
      <p className="text-body text-ink">Panel content slides in from the inline-start edge.</p>
    </Sheet>
  ),
};

export const InlineEnd: Story = {
  name: 'inline-end',
  render: () => (
    <Sheet side="inline-end" title="Details" trigger="Open inline-end sheet">
      <p className="text-body text-ink">Panel content slides in from the inline-end edge.</p>
    </Sheet>
  ),
};

export const BlockEnd: Story = {
  name: 'block-end',
  render: () => (
    <Sheet side="block-end" title="Share" trigger="Open block-end sheet">
      <p className="text-body text-ink">Panel content slides up from the bottom edge.</p>
    </Sheet>
  ),
};
