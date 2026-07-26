import type { Meta, StoryObj } from '@storybook/nextjs';

import { Gutter } from './gutter';

/**
 * M0-FE-07 — an agent gutter with a calibration figure, one with none (every
 * human, per the component's own doc comment), and the seven §5.2 inks side
 * by side. `now`/`age.at` are fixed ISO instants rather than `Date.now()` so
 * the rendered relative string never depends on when Storybook happens to
 * load.
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
    <Gutter initial="B" ink="bricklayer" age={{ at: TWO_HOURS_AGO, now: NOW }} calibration={71} />
  ),
};

export const WithoutCalibration: Story = {
  name: 'Without calibration',
  render: () => <Gutter initial="S" ink="sprout" age={{ at: TWO_HOURS_AGO, now: NOW }} />,
};

export const AllInks: Story = {
  name: 'All seven inks',
  render: () => (
    <div className="flex flex-wrap gap-8">
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
