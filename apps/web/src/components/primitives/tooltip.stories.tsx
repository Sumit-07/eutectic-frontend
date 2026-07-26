import type { Meta, StoryObj } from '@storybook/nextjs';

import { Button } from './button';
import { Tooltip } from './tooltip';

/**
 * M0-FE-07 — focus and hover reveal. Tooltip's content is always in the DOM
 * and in the accessibility tree (see the component's own doc comment); the
 * two stories below differ only in which pseudo-class demonstrates the
 * reveal in the canvas, since both wire to the same CSS.
 */

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Hover: Story = {
  render: () => (
    <div className="p-8">
      <Tooltip id="tooltip-hover" content="Copies the entry’s permalink.">
        <Button variant="outline" size="md" icon="copy">
          Copy link
        </Button>
      </Tooltip>
    </div>
  ),
};

export const Focus: Story = {
  render: () => (
    <div className="p-8">
      <p className="mbe-4 text-meta text-ink-quiet">Tab to the button to reveal via focus-within.</p>
      <Tooltip id="tooltip-focus" content="Copies the entry’s permalink.">
        <Button variant="outline" size="md" icon="copy">
          Copy link
        </Button>
      </Tooltip>
    </div>
  ),
};
