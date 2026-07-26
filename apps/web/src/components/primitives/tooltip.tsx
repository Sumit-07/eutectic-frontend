import { cloneElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

/**
 * frontend-spec §9.1 — Tooltip. Props: `content`, `delay=400`.
 * "Keyboard reachable. Never the only source of information."
 *
 * NO `'use client'`, ON PURPOSE. Everything §9.1 asks for is expressible in
 * CSS, so this ships zero client JS:
 *
 *   reveal        `:hover` on the wrapper, plus `:focus-within` so the
 *                 tooltip appears when its trigger is TABBED to, not only
 *                 when a pointer is over it (§9.1 "keyboard reachable").
 *   400ms delay   `transition-delay`, applied only in the revealed state.
 *                 The base state keeps a zero delay, so the tooltip waits
 *                 400ms to appear and leaves the instant focus or the
 *                 pointer does — which is the behaviour a JS `setTimeout`
 *                 implementation would have had to hand-write both halves of.
 *   dismiss       leaving the trigger, or `Esc` moving focus away. Nothing to
 *                 unmount, so nothing to leak.
 *
 * The 400ms itself is `--eu-tooltip-delay` in globals.css, cited to §9.1
 * there. It is fixed rather than a per-instance prop: a prop would have to
 * arrive as an inline style, which §1 rule 17 forbids for anything
 * tokenised, and the spec states one value for the whole product.
 *
 * NEVER THE ONLY SOURCE OF INFORMATION. This is a hard rule (§8.3 —
 * "tooltips are not a substitute for labels"), and the implementation is
 * built so that obeying it is the default:
 *
 *   1. `content` is ALWAYS in the DOM and always in the accessibility tree.
 *      It is not mounted on hover — only its opacity changes — so a screen
 *      reader user, who never triggers `:hover`, gets it from
 *      `aria-describedby` at all times.
 *   2. `aria-describedby`, not `aria-label`: a description ADDS to the
 *      trigger's own accessible name. A tooltip that replaced the name would
 *      be exactly the "only source of information" the spec bans.
 *
 *   So: a tooltip may explain a control. It may never BE the control's label,
 *   and a control whose meaning depends on it is a bug in the caller. The
 *   fixture on /probe/primitives demonstrates the correct shape — a fully
 *   labelled button that a tooltip merely elaborates.
 *
 * `id` is caller-supplied rather than generated, matching M0-FE-04's `Field`
 * (`htmlFor`): id generation needs a hook, hooks need a client component, and
 * a tooltip is not worth a client component.
 *
 * MOTION. §11 lists no tooltip motion, so the reveal is not an animation —
 * but `transition-delay` only exists on a transition, so the opacity swap
 * borrows the smallest §5.4 duration (`dur-1`, 120ms). Nothing moves, nothing
 * scales, and the whole thing is skipped under reduced motion.
 */

type TriggerProps = { 'aria-describedby'?: string };

export type TooltipProps = {
  /** The elaboration. Never the trigger's only label — see above. */
  content: ReactNode;
  /** Id for the tooltip element; the trigger is described by it. */
  id: string;
  /** The control being described. Must be focusable and self-labelling. */
  children: ReactElement<TriggerProps>;
};

export function Tooltip({ content, id, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        role="tooltip"
        id={id}
        className={[
          // Above the trigger, aligned to its inline start, out of flow.
          'pointer-events-none absolute bottom-full start-0 z-pill mb-3 w-max measure-argument',
          'rounded-md border border-rule bg-paper-raise px-4 py-2 shadow-pop',
          'text-meta font-ui text-ink',
          'opacity-0 motion-safe:transition-opacity motion-safe:dur-1',
          'group-hover:opacity-100 group-hover:delay-tooltip',
          'group-focus-within:opacity-100 group-focus-within:delay-tooltip',
        ].join(' ')}
      >
        {content}
      </span>
    </span>
  );
}
