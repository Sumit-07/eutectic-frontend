'use client';

import { useState } from 'react';

import { Button } from '../../../components/primitives/button';
import { Meter } from '../../../components/primitives/meter';
import type { MeterSignal } from '../../../components/primitives/meter';
import { ToastRegion } from '../../../components/primitives/toast-region';
import type { ToastMessage } from '../../../components/primitives/toast-region';

/*
 * M0-FE-05 fixture leaves. These exist only so /probe/primitives can exercise
 * the two primitives whose contract is a CALLBACK — `Meter.onVote` and the
 * toast host — which a Server Component page cannot supply. They are fixture
 * scaffolding, not product code: nothing outside this route imports them, and
 * they are replaced by Storybook interactions at M0-FE-07.
 *
 * The page itself stays a Server Component (§1 rule 22 — `'use client'` is
 * never on a page or a layout).
 */

export type MeterFixtureProps = {
  wellMade: number;
  weak: number;
  replies: number;
  initialVote?: MeterSignal | null;
};

/**
 * Demonstrates §11's "Vote | Instant optimistic colour + count": the caller
 * owns `myVote`, so pressing a signal recolours it and moves the count in the
 * same frame, with no request and no transition.
 */
export function MeterFixture({ wellMade, weak, replies, initialVote = null }: MeterFixtureProps) {
  const [myVote, setMyVote] = useState<MeterSignal | null>(initialVote);

  return (
    <Meter
      wellMade={wellMade + (myVote === 'wellMade' ? 1 : 0)}
      weak={weak + (myVote === 'weak' ? 1 : 0)}
      replies={replies}
      myVote={myVote}
      onVote={(signal) => setMyVote((current) => (current === signal ? null : signal))}
    />
  );
}

/**
 * Drives the one-at-a-time / 4s host. Pressing a second button while a toast
 * is up replaces it rather than stacking — the point of §9.1's "one at a
 * time" — and each toast expires on its own 4s timer.
 */
export function ToastFixture() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [undone, setUndone] = useState(0);

  const show = (next: Omit<ToastMessage, 'id'>) => {
    setToast({ ...next, id: `${Date.now()}` });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => show({ tone: 'neutral', message: 'Sent in.' })}
        >
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
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            show({
              tone: 'neutral',
              message: 'Post deleted.',
              action: { label: 'Undo', onAction: () => setUndone((count) => count + 1) },
            })
          }
        >
          with an action
        </Button>
      </div>

      <p className="measure mt-4 text-meta font-mono tabular-nums text-ink-quiet">
        Undo pressed {undone} times
      </p>

      <ToastRegion
        toast={toast}
        onExpire={(id) => setToast((current) => (current && current.id === id ? null : current))}
      />
    </div>
  );
}
