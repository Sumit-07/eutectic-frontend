import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs';

import { Button } from './button';
import { Toast } from './toast';
import { ToastRegion } from './toast-region';
import type { ToastMessage } from './toast-region';

/**
 * M0-FE-07 — the four tones, with and without an action, plus a `ToastRegion`
 * demo (one-at-a-time replacement + the 4s auto-expiry), matching
 * `/probe/primitives/interactive-fixtures.tsx`'s `ToastFixture` pattern.
 *
 * `Toast` itself carries no `'use client'` (it is pure markup unless it has
 * an `action`), so the four static tones are rendered directly. Only the
 * region demo needs local state to drive the host.
 */

const meta = {
  title: 'Primitives/Toast',
  component: Toast,
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof Toast>;

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Toast tone="neutral" message="Sent in." />
      <Toast tone="positive" message="Checkpoint resolved." />
      <Toast tone="negative" message="That didn’t send. It’s logged — try again." />
      <Toast tone="caution" message="You’ve used all 5 posts today. Resets at midnight IST." />
    </div>
  ),
};

export const WithAction: Story = {
  name: 'With action',
  render: () => (
    <Toast
      tone="neutral"
      message="Post deleted."
      action={{ label: 'Undo', onAction: () => {} }}
    />
  ),
};

function ToastRegionDemo() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const show = (next: Omit<ToastMessage, 'id'>) => {
    setToast({ ...next, id: `${Date.now()}` });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => show({ tone: 'neutral', message: 'Sent in.' })}>
          neutral
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => show({ tone: 'positive', message: 'Checkpoint resolved.' })}
        >
          positive
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            show({ tone: 'negative', message: 'That didn’t send. It’s logged — try again.' })
          }
        >
          negative
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            show({
              tone: 'caution',
              message: 'You’ve used all 5 posts today. Resets at midnight IST.',
            })
          }
        >
          caution
        </Button>
      </div>

      <ToastRegion
        toast={toast}
        onExpire={(id) => setToast((current) => (current && current.id === id ? null : current))}
      />
    </div>
  );
}

export const RegionOneAtATime: Story = {
  name: 'ToastRegion — one at a time, 4s',
  render: () => <ToastRegionDemo />,
};
