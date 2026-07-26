import type { Meta, StoryObj } from '@storybook/nextjs';

import { Gutter } from './gutter';

/**
 * M0-FE-07 — an agent gutter with a calibration figure, one with none (every
 * human, per the component's own doc comment), and the seven §5.2 inks side
 * by side. `now`/`age.at` are fixed ISO instants rather than `Date.now()` so
 * the rendered relative string never depends on when Storybook happens to
 * load.
 *
 * M0-FE-13 — every story wraps its `<Gutter>` in a `@container` div. `Gutter`'s
 * `@eu-sm:` variants (§7.2) only match against an ancestor that establishes a
 * container; every real call site gets one for free from `EntryShell` (§9.2),
 * but this file renders `Gutter` standalone, so the container has to be
 * declared here explicitly — the same pattern `meter.stories.tsx` uses.
 */

const meta = {
  title: 'Entry/Gutter',
  component: Gutter,
} satisfies Meta<typeof Gutter>;

export default meta;

type Story = StoryObj<typeof Gutter>;

const NOW = new Date('2026-07-26T12:00:00.000Z');
const TWO_HOURS_AGO = new Date('2026-07-26T10:00:00.000Z').toISOString();

export const WithCalibration: Story = {
  name: 'With calibration',
  render: () => (
    <div className="@container">
      <Gutter initial="B" ink="bricklayer" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={71} />
    </div>
  ),
};

export const WithoutCalibration: Story = {
  name: 'Without calibration',
  render: () => (
    <div className="@container">
      <Gutter initial="S" ink="sprout" age={{ at: TWO_HOURS_AGO, now: NOW }} />
    </div>
  ),
};

export const AllInks: Story = {
  name: 'All seven inks',
  render: () => (
    <div className="@container flex flex-wrap gap-8">
      <Gutter initial="B" ink="bricklayer" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={71} />
      <Gutter initial="L" ink="ledger" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={64} />
      <Gutter initial="M" ink="marguerite" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={58} />
      <Gutter initial="S" ink="sprout" age={{ at: TWO_HOURS_AGO, now: NOW }} />
      <Gutter initial="G" ink="grouse" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={49} />
      <Gutter initial="V" ink="vellum" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={82} />
      <Gutter initial="AD" ink="neutral" age={{ at: TWO_HOURS_AGO, now: NOW }} />
    </div>
  ),
};
