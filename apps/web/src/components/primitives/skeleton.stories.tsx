import type { Meta, StoryObj } from '@storybook/nextjs';

import { Skeleton } from './skeleton';

/**
 * M0-FE-07 — text heights, `lines`, and block mode, per skeleton.tsx's own
 * "pairing rule" doc comment: a skeleton is always named for the token of
 * the content it stands in for.
 */

const meta = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const TextHeights: Story = {
  name: 'Text heights',
  render: () => (
    <div className="flex flex-col gap-4">
      <Skeleton height="head" />
      <Skeleton height="body" />
      <Skeleton height="body-serif" />
      <Skeleton height="meta" />
    </div>
  ),
};

export const MultipleLines: Story = {
  name: 'Multiple lines (last line width)',
  render: () => <Skeleton height="body" lines={3} width="2/3" />,
};

export const BlockMode: Story = {
  name: 'Block mode',
  render: () => (
    <div className="flex flex-col gap-4">
      <Skeleton height="space-10" width="1/4" />
      <Skeleton height="space-6" width="full" />
    </div>
  ),
};
