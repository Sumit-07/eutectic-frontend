import type { Schemas } from '@eutectic/contracts';
import type { Meta, StoryObj } from '@storybook/nextjs';

import { Prose } from './prose';

/**
 * M0-FE-07 — every span kind (text/code/em/strong/link), a code block, and
 * the unknown-kind degradation path prose.tsx's own doc comment describes
 * (D-017 — a grow-only contract shape; unknown kinds render their text,
 * never drop it). The two "future" fixtures are cast in with
 * `as unknown as Schemas['ProseBlock']`, exactly as
 * `/probe/entry/entry-fixtures.tsx`'s `FUTURE_BLOCKS`/`FUTURE_SPAN_PARAGRAPH`
 * do, for the same reason: the generated union does not and should not admit
 * a kind this build has never heard of.
 */

const meta = {
  title: 'Entry/Prose',
  component: Prose,
} satisfies Meta<typeof Prose>;

export default meta;

type Story = StoryObj<typeof Prose>;

export const EverySpanKind: Story = {
  name: 'Every span kind',
  render: () => (
    <Prose
      voice="serif"
      blocks={[
        {
          kind: 'paragraph',
          spans: [
            { kind: 'text', text: 'Plain text, then ' },
            { kind: 'code', text: 'inline code' },
            { kind: 'text', text: ', then ' },
            { kind: 'em', text: 'emphasis' },
            { kind: 'text', text: ', then ' },
            { kind: 'strong', text: 'strong' },
            { kind: 'text', text: ', then a ' },
            { kind: 'link', text: 'link to a thread', href: '/thread/9d3e' },
            { kind: 'text', text: ' and one ' },
            { kind: 'link', text: 'out to the web', href: 'https://example.org/notes' },
            { kind: 'text', text: '.' },
          ],
        },
      ]}
    />
  ),
};

export const UnsafeLinkScheme: Story = {
  name: 'Unsafe link scheme degrades to text',
  render: () => (
    <Prose
      voice="plain"
      blocks={[
        {
          kind: 'paragraph',
          spans: [
            { kind: 'text', text: 'A link whose scheme this renderer will not emit degrades to its words: ' },
            { kind: 'link', text: 'no anchor here', href: 'javascript:alert(1)' },
            { kind: 'text', text: ' — the text survives, the href does not.' },
          ],
        },
      ]}
    />
  ),
};

export const CodeBlock: Story = {
  name: 'Code block',
  render: () => (
    <Prose
      voice="mono"
      blocks={[
        {
          kind: 'paragraph',
          spans: [
            { kind: 'text', text: 'The reserve has to be one statement:' },
          ],
        },
        {
          kind: 'code',
          lang: 'sql',
          text: [
            'UPDATE agent_budgets',
            '   SET actions_used = actions_used + 1',
            ' WHERE agent_id = $1',
            '   AND actions_used < actions_allowed',
            'RETURNING actions_used;',
          ].join('\n'),
        },
      ]}
    />
  ),
};

const FUTURE_BLOCKS = [
  {
    kind: 'callout',
    spans: [
      { kind: 'text', text: 'A block kind from a newer server, carrying ' },
      { kind: 'strong', text: 'spans' },
      { kind: 'text', text: ' — rendered as an ordinary paragraph.' },
    ],
  },
  {
    kind: 'quote',
    text: 'A future block carrying plain text instead of spans. Still readable.',
  },
] as unknown as readonly Schemas['ProseBlock'][];

const FUTURE_SPAN_PARAGRAPH = {
  kind: 'paragraph',
  spans: [
    { kind: 'text', text: 'An unknown ' },
    { kind: 'highlight', text: 'span kind' },
    { kind: 'text', text: ' keeps its words, without its styling.' },
  ],
} as unknown as Schemas['ProseBlock'];

export const UnknownKindDegradation: Story = {
  name: 'Unknown block/span kind degradation',
  render: () => (
    <Prose
      voice="mono"
      blocks={[
        {
          kind: 'paragraph',
          spans: [{ kind: 'text', text: 'Known block first, so the spacing between the two is visible.' }],
        },
        ...FUTURE_BLOCKS,
        FUTURE_SPAN_PARAGRAPH,
      ]}
    />
  ),
};
