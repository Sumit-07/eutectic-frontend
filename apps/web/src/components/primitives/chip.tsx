import type { HTMLAttributes, ReactNode } from 'react';

/**
 * frontend-spec §9.1 — Chip.
 *
 * Props: `tone`, `mono?`. Used for `uninvited`, `poster`, `against X`,
 * `visible`, finding state (§9.3, §9.6).
 *
 * The only component in the product that uses `radius.full` (§1 rule 7 —
 * "`border-radius` everywhere" is banned; `full` is spent on exactly one
 * component, and this is it).
 *
 * JUDGMENT CALL — tone set. §5 only names four semantic colours that read as
 * "status" (`positive`, `negative`, `caution`, plus the greyscale ink stack
 * for `neutral`), so those four are the core tone set. The spec also shows a
 * chip carrying an agent's own ink directly (§9.3 — "`uninvited` chip in the
 * agent's ink"), so the seven `agentInkNames` are accepted as tones too: same
 * rendering path, no separate component. `tone="neutral"` intentionally does
 * NOT reuse `agent-neutral` even though the two tokens happen to resolve to
 * the same hex today — `neutral` here means "no status", `agent-neutral"`
 * means "this content is the human/system agent's", and they should be free
 * to diverge if the token package ever splits them.
 *
 * No uppercase, no letterspacing (§1 rule 1) — a Chip is identified by its
 * shape (pill) and hairline border, not shouting.
 */

const STATUS_TONE_CLASSES = {
  neutral: 'border-rule-strong text-ink-quiet',
  positive: 'border-positive text-positive',
  negative: 'border-negative text-negative',
  caution: 'border-caution text-caution',
} as const;

const AGENT_TONE_CLASSES = {
  bricklayer: 'border-agent-bricklayer text-agent-bricklayer',
  ledger: 'border-agent-ledger text-agent-ledger',
  marguerite: 'border-agent-marguerite text-agent-marguerite',
  sprout: 'border-agent-sprout text-agent-sprout',
  grouse: 'border-agent-grouse text-agent-grouse',
  vellum: 'border-agent-vellum text-agent-vellum',
} as const;

const TONE_CLASSES = { ...STATUS_TONE_CLASSES, ...AGENT_TONE_CLASSES };

export type ChipTone = keyof typeof TONE_CLASSES;

export type ChipProps = {
  tone: ChipTone;
  /** Switches the label to the mono face — diffstats, slugs, counts. */
  mono?: boolean;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>;

export function Chip({ tone, mono, children, ...rest }: ChipProps) {
  return (
    <span
      {...rest}
      className={[
        'inline-flex items-center rounded-full border px-3 py-1',
        'text-meta leading-none',
        mono ? 'font-mono' : 'font-ui',
        TONE_CLASSES[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
