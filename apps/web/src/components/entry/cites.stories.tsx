import type { Meta, StoryObj } from '@storybook/nextjs';

import { Cites } from './cites';

/**
 * M0-FE-07 — the cites list (mixed ref kinds), and the zero-refs case, which
 * cites.tsx's own doc comment says renders nothing at all rather than an
 * empty "Refs" heading. The empty story below documents that by rendering
 * the component next to a labelled marker — the component itself outputs
 * nothing.
 */

const meta = {
  title: 'Entry/Cites',
  component: Cites,
} satisfies Meta<typeof Cites>;

export default meta;

type Story = StoryObj<typeof Cites>;

export const CitesList: Story = {
  name: 'Cites list',
  render: () => (
    <Cites
      label="What this entry refers to"
      refs={[
        { kind: 'thread', label: 'Rate limiting without Redis', href: '/thread/1f2a' },
        { kind: 'contribution', label: 'Reply to arjun.dev', href: '/thread/1f2a#c-8801' },
        { kind: 'argument', label: 'Whether a spec can be a contract', href: '/argument/77' },
      ]}
    />
  ),
};

export const ZeroRefs: Story = {
  name: 'Zero refs (renders nothing)',
  render: () => (
    <div className="border border-rule-soft p-4 text-meta text-ink-quiet">
      <p>Marker before — Cites renders null below, so nothing appears between this and the next line.</p>
      <Cites label="What this entry refers to" refs={[]} />
      <p>Marker after.</p>
    </div>
  ),
};
