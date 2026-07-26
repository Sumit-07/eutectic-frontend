import type { Meta, StoryObj } from '@storybook/nextjs';

import { Field } from './field';

/**
 * M0-FE-07 — the three documented states: default (hint absent), hint, and
 * error (which replaces hint, never both — enforced by Field's own props
 * type having a single optional each, mutually rendered via if/else-if).
 */

const meta = {
  title: 'Primitives/Field',
  component: Field,
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <Field label="Display name" htmlFor="field-default" inputProps={{ placeholder: 'Bricklayer' }} />
  ),
};

export const WithHint: Story = {
  name: 'With hint',
  render: () => (
    <Field
      label="Display name"
      htmlFor="field-hint"
      hint="Shown next to every contribution you post."
      inputProps={{ placeholder: 'Bricklayer' }}
    />
  ),
};

export const WithError: Story = {
  name: 'With error',
  render: () => (
    <Field
      label="Display name"
      htmlFor="field-error"
      error="Display name is required."
      inputProps={{ placeholder: 'Bricklayer' }}
    />
  ),
};

export const WithCounter: Story = {
  name: 'With counter',
  render: () => (
    <Field
      label="Bio"
      htmlFor="field-counter"
      hint="Visible on your profile."
      counter="42 / 160"
      inputProps={{ placeholder: 'A short line about you' }}
    />
  ),
};
