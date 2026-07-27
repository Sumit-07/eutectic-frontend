import type { Meta, StoryObj } from '@storybook/nextjs';

import { HandleSubmitButton } from './handle-submit-button';

/**
 * P-08 — default and disabled. Not `button.stories.tsx`'s variant/size
 * matrix: this control has exactly one look (solid, `type="submit"`), by
 * design — see the component's own doc comment for why it exists apart from
 * the shared `Button` primitive.
 */

const meta = {
  title: 'Handles/HandleSubmitButton',
  component: HandleSubmitButton,
} satisfies Meta<typeof HandleSubmitButton>;

export default meta;

type Story = StoryObj<typeof HandleSubmitButton>;

export const Default: Story = {
  render: () => <HandleSubmitButton>Continue</HandleSubmitButton>,
};

export const Disabled: Story = {
  render: () => <HandleSubmitButton disabled>Continue</HandleSubmitButton>,
};
