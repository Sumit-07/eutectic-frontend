import { Button } from './button';

/**
 * frontend-spec §9.1 — Toast. Props: `tone`, `message`, `action?`.
 * "One at a time, 4s, bottom-left (web)."
 *
 * This file is the toast ITSELF and carries no `'use client'`: a toast is
 * markup. The three behaviours in §9.1 that need a runtime — one at a time,
 * the 4s life, and the fixed bottom-left region — belong to `ToastRegion`
 * (`toast-region.tsx`), which is the client leaf. Splitting them means a
 * server-rendered page can show a toast's every tone with zero client JS,
 * and the interactive host is a separate, much smaller module.
 *
 * The one exception is `action`: an action is a callback, so a `Toast` that
 * has one can only be rendered by a client parent. A `Toast` without an
 * action is pure RSC markup.
 *
 * NO MOTION. §11 is the complete list of motion in the product and it has no
 * row for a toast — so this does not slide, fade or scale. It appears and,
 * 4s later, it is gone.
 *
 * TONE IS A SPINE, NOT A FILL. §1 rule 2 bans wrapping things in tinted
 * cards, and §1 "Always" allows exactly one 2px deviation from the hairline
 * rule: "a deliberate left spine". A toast is one of the few genuinely
 * detached objects in the product (§1 rule 2's "cards only for genuinely
 * detached objects"), so it gets a hairline box, the 3px container radius,
 * and its tone as an inline-start spine — never a coloured background.
 */

export type ToastTone = 'neutral' | 'positive' | 'negative' | 'caution';

export type ToastAction = {
  /** Full text (§8.2/§8.3) — a toast action is never an icon. */
  label: string;
  onAction: () => void;
};

export type ToastProps = {
  tone: ToastTone;
  message: string;
  action?: ToastAction;
};

const TONE_SPINE_CLASSES: Record<ToastTone, string> = {
  neutral: 'border-s-rule-strong',
  positive: 'border-s-positive',
  negative: 'border-s-negative',
  caution: 'border-s-caution',
};

export function Toast({ tone, message, action }: ToastProps) {
  return (
    <div
      className={[
        'pointer-events-auto flex items-center gap-5 rounded-md measure-argument',
        'border border-rule border-s-2 bg-paper-raise shadow-pop',
        'px-6 py-5',
        TONE_SPINE_CLASSES[tone],
      ].join(' ')}
    >
      <p className="text-body font-ui text-ink">{message}</p>
      {action ? (
        <Button variant="quiet" size="sm" onClick={action.onAction}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
