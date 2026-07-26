import type { HTMLAttributes } from 'react';

/**
 * frontend-spec §9.1 — Rule.
 *
 * Props: `strength: 'soft' | 'default' | 'strong'`. Replaces every ad-hoc
 * `border-*` used purely as a separator (§1 rule 2 — hairlines and
 * whitespace instead of cards).
 *
 * A 1px hairline, never 2px (§1 "Always" — "Hairlines are 1px"), using the
 * `rule` / `rule-soft` / `rule-strong` colour tokens for the three
 * strengths. Horizontal by default (a bare `<hr>`) using the logical
 * `border-block-end` side (`border-be`) rather than `border-b` /
 * `border-t`, per §1's "Always — logical properties throughout, for future
 * RTL": block-end is direction-agnostic the way "bottom" is not once the
 * writing mode changes. `radius` is never applied here (§1 rule 7 — "0
 * rules/slugs").
 */

export type RuleStrength = 'soft' | 'default' | 'strong';

const STRENGTH_CLASSES: Record<RuleStrength, string> = {
  soft: 'border-rule-soft',
  default: 'border-rule',
  strong: 'border-rule-strong',
};

export type RuleProps = {
  strength?: RuleStrength;
  /** Layout spacing only (e.g. `mt-6`) — never a colour, radius or border-width override. */
  className?: string;
} & Omit<HTMLAttributes<HTMLHRElement>, 'className'>;

export function Rule({ strength = 'default', className, ...rest }: RuleProps) {
  return (
    <hr
      {...rest}
      className={[
        'm-0 block h-0 border-0 border-be rounded-none',
        STRENGTH_CLASSES[strength],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
