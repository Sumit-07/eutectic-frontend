import { relativeTime } from '@eutectic/core';
import type { AgentInkName } from '@eutectic/core';

/**
 * frontend-spec §7.4 — **Gutter**. The signature element of the product (§2):
 * 56px, left of every entry, carrying the author's initial, age and
 * calibration. "Do not remove it, do not shrink below 40px, do not put a
 * photographic avatar in it."
 *
 * §7.4, verbatim, is the whole specification of this component:
 *
 * ```
 * gutter    width 56 (40 on xs); flex none; column; gap space1
 * initial   font prose; size 27 (22 xs); lineHeight .85; color agentInk
 * age       font mono; size 10.5; color inkFaint; marginTop space3
 * cal       font mono; size 10.5; color inkQuiet; borderTop 1px rule; paddingTop space1
 * ```
 *
 * Every row maps to a token utility: `inline-9`/`inline-10` are space-9 (40) and
 * space-10 (56); `text-head`/`text-title` are the §6.3 22 and 27 steps;
 * `text-micro` is 10.5; `mbs-3` is space-3; `pbs-1` is space-1;
 * `leading-initial` is §7.4's `.85`, the one line-height below 1 in the
 * product (D-021, `packages/tokens` `--eu-leading-initial`). No literal
 * appears in this file (CLAUDE.md rule 2), and every size utility is logical
 * (`inline-size`, `margin-block-start`, `border-block-start`) per §1 "Always".
 *
 * THE xs STEP IS A CONTAINER QUERY, NOT A MEDIA QUERY. §7.2: "components use
 * container queries, only shells use media queries." `@eu-sm:` reads
 * `--container-eu-sm` (480px, D-021) against the nearest ancestor `@container`
 * — `EntryShell` declares one on every entry (§9.2), exactly as `Meter` reads
 * the same threshold for its own ≥sm label switch (§9.1). Base styles are
 * therefore the xs values (40px gutter, 22px initial) and `@eu-sm:` restores
 * the full-size ones (56px, 27px) once the entry's own column — not the
 * viewport — crosses 480px. A `Gutter` rendered with no `@container` ancestor
 * simply stays in its xs form, which is the safe direction to fail.
 *
 * The initial is `aria-hidden`: §17 makes it the avatar ("agent identity is a
 * letter, never an avatar image"), and the same identity is already carried in
 * text by `Byline`. Repeating a lone letter to assistive tech adds noise, and
 * §13 requires ink never be the sole carrier of meaning — the name is.
 */

/**
 * ink token name → the `text-*` utility that reads it. Written out as literal
 * class strings so Tailwind's source scanner sees them (`@source '../'`).
 *
 * All seven §5.2 inks, including `neutral` — humans and system authors get a
 * gutter too (§17: "Human identity is initials in `neutral`"). `Chip` keeps a
 * deliberately shorter list; this one is identity, not status.
 */
export const AGENT_INK_TEXT_CLASSES: Record<AgentInkName, string> = {
  bricklayer: 'text-agent-bricklayer',
  ledger: 'text-agent-ledger',
  marguerite: 'text-agent-marguerite',
  sprout: 'text-agent-sprout',
  grouse: 'text-agent-grouse',
  vellum: 'text-agent-vellum',
  neutral: 'text-agent-neutral',
};

/**
 * A rendered instant. `now` is always explicit — `@eutectic/core`'s
 * `relativeTime` never reads the clock itself (D-014), so a server-rendered
 * entry is a pure function of its props and two renders of the same entry can
 * never disagree.
 */
export type EntryTimestamp = {
  /** ISO 8601 instant, straight off the wire (`Timestamp` in the contract). */
  at: string;
  /** The clock this entry is being rendered against. */
  now: Date;
};

/**
 * §15 — "relative under 7 days ('2h', '3d'), then absolute ('14 Mar')", from
 * `@eutectic/core`. The visible text is the compact form; the machine-readable
 * absolute instant rides along in `datetime`, which costs no pixels and no
 * client JS.
 */
export function EntryTime({ at, now, className }: EntryTimestamp & { className: string }) {
  return (
    <time dateTime={at} className={className}>
      {relativeTime(at, now)}
    </time>
  );
}

export type GutterProps = {
  /**
   * The letter (or, for humans, initials) shown in the agent's ink — §17's
   * avatar. The caller derives it from the author's name; the gutter never
   * guesses, because "B" for Bricklayer and "SK" for a human are different
   * rules.
   */
  initial: string;
  /** §5.2 token name, never a hex. */
  ink: AgentInkName;
  /** §7.4 `age`. */
  age: EntryTimestamp;
  /**
   * §7.4 `cal` — the calibration figure, a percentage 0–100. Absent for
   * authors who have none (every human, and an agent with no resolved calls):
   * the hairline above it is part of the figure, so both disappear together.
   */
  calibration?: number;
};

export function Gutter({ initial, ink, age, calibration }: GutterProps) {
  return (
    <div className="flex inline-9 flex-none flex-col gap-1 @eu-sm:inline-10">
      <span
        aria-hidden="true"
        className={`font-prose text-head leading-initial @eu-sm:text-title ${AGENT_INK_TEXT_CLASSES[ink]}`}
      >
        {initial}
      </span>

      <EntryTime {...age} className="mbs-3 font-mono text-micro text-ink-faint" />

      {calibration === undefined ? null : (
        <span className="border-bs border-rule pbs-1 font-mono text-micro tabular-nums text-ink-quiet">
          {calibration}
          {/* §1 "Always": tabular numerals on every calibration figure. The
              number alone is meaningless out of context, so its unit is carried
              for assistive tech without spending gutter width on it. */}
          <span className="sr-only"> per cent of this author’s calls held up</span>
        </span>
      )}
    </div>
  );
}
