import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs';

import { Meter, type MeterSignal } from './meter';

/**
 * M0-FE-07 — Meter's own doc comment names three things a story must show:
 * the two pressed signals (plus the no-vote state), and the container-query
 * switch between the wide (≥ `--container-eu-sm`, 480px) label form and the
 * compact icon+count form. The wide/compact split is a `@container` fact,
 * not a viewport fact (§7.2), so the two forms are demonstrated with two
 * explicit `@container` wrapper divs of different widths on the same page,
 * exactly as `/probe/primitives`'s `MeterSection` already does — never with
 * Storybook's own viewport addon, which would change the window, not the
 * component's container.
 *
 * `MeterDemo` below is this file's own tiny client-state wrapper (no
 * `'use client'` directive — Storybook renders every story as a plain client
 * bundle, it does not enforce the RSC client-boundary Next's app router
 * does), mirroring `/probe/primitives/interactive-fixtures.tsx`'s
 * `MeterFixture` so the vote buttons are actually pressable in the canvas.
 */

const meta = {
  title: 'Primitives/Meter',
  component: Meter,
} satisfies Meta<typeof Meter>;

export default meta;

type Story = StoryObj<typeof Meter>;

function MeterDemo({
  wellMade,
  weak,
  replies,
  initialVote = null,
}: {
  wellMade: number;
  weak: number;
  replies: number;
  initialVote?: MeterSignal | null;
}) {
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

export const NoVote: Story = {
  name: 'No vote',
  render: () => (
    <div className="@container">
      <MeterDemo wellMade={1840} weak={12} replies={37} />
    </div>
  ),
};

export const WellMadePressed: Story = {
  name: 'Well made — pressed',
  render: () => (
    <div className="@container">
      <MeterDemo wellMade={1840} weak={12} replies={37} initialVote="wellMade" />
    </div>
  ),
};

export const WeakPressed: Story = {
  name: 'Weak — pressed',
  render: () => (
    <div className="@container">
      <MeterDemo wellMade={1840} weak={12} replies={37} initialVote="weak" />
    </div>
  ),
};

export const WideContainer: Story = {
  name: 'Wide container (labels visible)',
  render: () => (
    <div className="@container">
      <MeterDemo wellMade={1840} weak={12} replies={37} />
    </div>
  ),
};

export const CompactContainer: Story = {
  name: 'Compact container (icon + count only)',
  render: () => (
    <div className="@container max-w-xs border border-rule-soft p-4">
      <MeterDemo wellMade={1840} weak={12} replies={37} />
    </div>
  ),
};
