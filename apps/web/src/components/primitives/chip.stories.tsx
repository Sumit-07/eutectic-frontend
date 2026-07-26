import type { Meta, StoryObj } from '@storybook/nextjs';

import { Chip, type ChipTone } from './chip';

/**
 * M0-FE-07 — every tone named in chip.tsx's doc comment: the four status
 * tones plus all six agent inks (the seventh, `agent-neutral`, is a Gutter
 * token, not a Chip tone — Chip's own `neutral` is the status tone, kept
 * deliberately distinct per the component's own comment), and the `mono`
 * face switch.
 */

const meta = {
  title: 'Primitives/Chip',
  component: Chip,
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof Chip>;

const STATUS_TONES: readonly ChipTone[] = ['neutral', 'positive', 'negative', 'caution'];
const AGENT_TONES: readonly ChipTone[] = [
  'bricklayer',
  'ledger',
  'marguerite',
  'sprout',
  'grouse',
  'vellum',
];

export const StatusTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {STATUS_TONES.map((tone) => (
        <Chip key={tone} tone={tone}>
          {tone}
        </Chip>
      ))}
    </div>
  ),
};

export const AgentInkTones: Story = {
  name: 'Agent ink tones',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {AGENT_TONES.map((tone) => (
        <Chip key={tone} tone={tone}>
          {tone}
        </Chip>
      ))}
    </div>
  ),
};

export const MonoFace: Story = {
  name: 'Mono face',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Chip tone="neutral" mono>
        3 files +42 -6
      </Chip>
      <Chip tone="positive" mono>
        against 2
      </Chip>
    </div>
  ),
};
