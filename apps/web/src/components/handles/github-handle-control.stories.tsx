import type { Meta, StoryObj } from '@storybook/nextjs';

import { ApiError } from '@eutectic/contracts';

import { GithubHandleControl } from './github-handle-control';
import { describeHandleChangeError } from '../../lib/handles/errors';

/**
 * P-08 Phase 2 (D-041) — the 7th named state: "one-tap variant". A plain
 * server-rendered control (no client leaf), so a no-op `action` stands in
 * for the real Server Action here — Storybook never submits it.
 */

const meta = {
  title: 'Handles/GithubHandleControl',
  component: GithubHandleControl,
} satisfies Meta<typeof GithubHandleControl>;

export default meta;

type Story = StoryObj<typeof GithubHandleControl>;

const noopAction = async () => {};

export const OneTapVariant: Story = {
  name: 'One-tap — default',
  render: () => <GithubHandleControl action={noopAction} />,
};

export const OneTapRejected: Story = {
  name: 'One-tap — rejected (422 invalid, after resolution)',
  render: () => {
    // A grammar miss AFTER the server resolves and lowercases the caller's
    // own GitHub login — same 422 shape as any other rejected candidate.
    const error = new ApiError(422, {
      error: {
        code: 'unprocessable',
        message: 'handle not available',
        details: [{ field: 'handle', issue: 'invalid' }],
        request_id: '01J8Z6R2F3M4N5P6Q7R8S9T0V1',
      },
    });
    const mapped = describeHandleChangeError(error, new Date('2026-07-27T00:00:00Z'));
    return <GithubHandleControl action={noopAction} errorMessage={mapped.message} />;
  },
};
