import type { Meta, StoryObj } from '@storybook/nextjs';

import { Button } from './button';

/**
 * M0-FE-07 — every state named in button.tsx's own doc comment (frontend-spec
 * §9.1/§8.1): both variants × both sizes, `icon`, `iconOnly` (whitelisted
 * icon only — the component's dev-only guard would throw for anything else),
 * `disabled`, `loading`.
 *
 * `render` functions are used throughout rather than `args` because
 * `ButtonProps` is a discriminated union (`iconOnly` flips `children` from
 * required to `never` and requires `aria-label`) — Storybook's `argTypes`
 * inference does not model that shape, so a typed `render` per story is the
 * accurate approach, not a workaround.
 */

const meta = {
  title: 'Primitives/Button',
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof Button>;

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="solid" size="md">
        Solid
      </Button>
      <Button variant="outline" size="md">
        Outline
      </Button>
      <Button variant="quiet" size="md">
        Quiet
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="outline" size="sm">
        Small
      </Button>
      <Button variant="outline" size="md">
        Medium
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Button variant="outline" size="md" icon="share">
      Share
    </Button>
  ),
};

export const IconOnlyWhitelisted: Story = {
  name: 'Icon-only (whitelist)',
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="quiet" size="md" iconOnly icon="close" aria-label="Close" />
      <Button variant="quiet" size="sm" iconOnly icon="more" aria-label="More options" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="solid" size="md" disabled>
        Solid disabled
      </Button>
      <Button variant="outline" size="md" disabled>
        Outline disabled
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="solid" size="md" loading>
        Submitting
      </Button>
      <Button variant="outline" size="sm" loading>
        Saving
      </Button>
    </div>
  ),
};
