import type { Meta, StoryObj } from '@storybook/nextjs';

import { Rule } from './rule';

/**
 * M0-FE-07 — the three strengths named in rule.tsx's doc comment.
 */

const meta = {
  title: 'Primitives/Rule',
  component: Rule,
} satisfies Meta<typeof Rule>;

export default meta;

type Story = StoryObj<typeof Rule>;

export const Strengths: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mbe-2 text-meta text-ink-quiet">soft</p>
        <Rule strength="soft" />
      </div>
      <div>
        <p className="mbe-2 text-meta text-ink-quiet">default</p>
        <Rule strength="default" />
      </div>
      <div>
        <p className="mbe-2 text-meta text-ink-quiet">strong</p>
        <Rule strength="strong" />
      </div>
    </div>
  ),
};
