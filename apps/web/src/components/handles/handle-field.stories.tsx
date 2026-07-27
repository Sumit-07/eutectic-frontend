import type { Meta, StoryObj } from '@storybook/nextjs';

import { ApiError } from '@eutectic/contracts';

import { HandleField } from './handle-field';
import { describeAvailability, describeHandleChangeError } from '../../lib/handles/errors';

/**
 * P-08 Phase 1 — the six states the ticket named: default, pre-filled
 * suggestion, availability-taken, invalid, cooldown-blocked (fixed date),
 * success. Phase 2 (D-041) adds `Checking` and `Available` — the two new
 * `HandleFieldState` kinds `handle-form.tsx`'s debounced availability check
 * renders while typing. Together with `AvailabilityTaken`/`Invalid`/
 * `CooldownBlocked` below, that is 6 of the 7 states the Phase 2 ticket
 * names; the 7th, "one-tap variant", is `github-handle-control.stories.tsx`.
 *
 * The error copy in every non-idle story is produced by calling
 * `lib/handles/errors.ts` directly, the same module the real forms call —
 * never a hand-typed string a future change to that module could silently
 * leave behind.
 */

const meta = {
  title: 'Handles/HandleField',
  component: HandleField,
} satisfies Meta<typeof HandleField>;

export default meta;

type Story = StoryObj<typeof HandleField>;

export const Default: Story = {
  render: () => <HandleField htmlFor="handle-default" defaultValue="" />,
};

export const PreFilledSuggestion: Story = {
  name: 'Pre-filled suggestion',
  render: () => <HandleField htmlFor="handle-suggestion" defaultValue="bricklayer-49q" />,
};

export const Checking: Story = {
  name: 'Availability — checking (live, Phase 2)',
  render: () => (
    <HandleField htmlFor="handle-checking" defaultValue="mira" state={{ kind: 'checking' }} />
  ),
};

export const Available: Story = {
  name: 'Availability — available (live, Phase 2)',
  render: () => (
    <HandleField htmlFor="handle-available" defaultValue="bricklayer-49q" state={{ kind: 'available' }} />
  ),
};

export const AvailabilityTaken: Story = {
  name: 'Availability — taken',
  render: () => (
    <HandleField
      htmlFor="handle-taken"
      defaultValue="mira"
      state={{ kind: 'error', message: describeAvailability(false, 'taken') ?? '' }}
    />
  ),
};

export const Invalid: Story = {
  render: () => (
    <HandleField
      htmlFor="handle-invalid"
      defaultValue="M!"
      state={{ kind: 'error', message: describeAvailability(false, 'invalid') ?? '' }}
    />
  ),
};

export const CooldownBlocked: Story = {
  name: 'Cooldown — blocked',
  render: () => {
    // The contract's own 409 example (openapi.yaml components/responses/HandleChangeConflict).
    const error = new ApiError(409, {
      error: {
        code: 'handle_cooldown',
        message: 'handle changed within the last 90 days',
        details: [{ field: 'handle', issue: 'cooldown_until', detail: '2026-10-25T00:00:00Z' }],
        request_id: '01J8Z6R2F3M4N5P6Q7R8S9T0V1',
      },
    });
    const mapped = describeHandleChangeError(error, new Date('2026-07-27T00:00:00Z'));
    return <HandleField htmlFor="handle-cooldown" defaultValue="mira" state={{ kind: 'error', message: mapped.message }} />;
  },
};

export const Success: Story = {
  render: () => (
    <HandleField
      htmlFor="handle-success"
      defaultValue="mira"
      state={{ kind: 'success', message: 'Your handle was updated.' }}
    />
  ),
};
