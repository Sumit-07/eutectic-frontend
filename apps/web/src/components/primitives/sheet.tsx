'use client';

import { useCallback, useId, useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { Button } from './button';

/**
 * frontend-spec §9.1 — Sheet. Props: `side`, `title`.
 *
 * WHY THIS FILE IS A CLIENT LEAF. There is no declarative way to put a
 * `<dialog>` into the top layer: `showModal()` is a method, and the `open`
 * attribute renders a *non-modal* dialog with no backdrop, no inertness and
 * no Esc handling. So the leaf exists for exactly two DOM calls —
 * `showModal()` and `close()` — plus the backdrop-click test. Everything
 * else the spec asks for is the platform's own behaviour, unwrapped:
 *
 *   Esc            native. `<dialog>` fires `cancel` then closes itself.
 *   Backdrop click NOT native (a modal dialog's backdrop swallows clicks
 *                  without dismissing). The one line of JS below is the
 *                  whole implementation: a click whose target is the dialog
 *                  element itself came from outside the panel, because the
 *                  panel's own content fills the element.
 *   Focus trap     native. A modal dialog makes the rest of the document
 *                  inert; §13's "focus trapped in dialogs" needs no library
 *                  and §4.2 forbids adding one.
 *   Focus restore  native, and verified in a real browser on this ticket
 *                  rather than assumed: HTML's dialog close steps run "focus
 *                  the previously focused element", so the invoking button
 *                  is focused again after Esc, backdrop click, and the
 *                  close button. No `activeElement` bookkeeping here.
 *
 * MOTION. §11 — "Sheet | Slide from edge `dur3 ease.out`; backdrop →
 * `rgb(22 23 26/.32)`". Both are CSS: `@starting-style` (§4.2's "modern
 * platform features") gives the element an off-edge transform for its first
 * rendered frame, so the transition to its resting position runs on open with
 * no JS and no animation library. There is deliberately no exit animation —
 * §11 lists one motion for a sheet, not two, and an exit would require
 * holding the dialog in the top layer after `close()`.
 *
 * Under `prefers-reduced-motion: reduce` the `motion-safe:` transition is
 * never applied, which makes `@starting-style` inert too (a starting style
 * with nothing to transition to is a no-op) — the sheet simply appears.
 *
 * TITLE. `title` is a real `<h2>` inside the dialog, and the dialog is
 * labelled by it through `aria-labelledby` — not `aria-label`, so the visible
 * heading and the accessible name are the same string by construction and
 * cannot drift. `<h2>` because a sheet opens over a page that owns the `<h1>`
 * (§13 "real `h1`–`h3` order").
 */

/**
 * Logical edges, not physical ones (§1 "Always — logical properties
 * throughout, for future RTL"). `inline-start`/`inline-end` follow the
 * writing direction; `block-end` is the bottom sheet.
 */
export type SheetSide = 'inline-start' | 'inline-end' | 'block-end';

export type SheetProps = {
  side: SheetSide;
  /** Visible heading and the dialog's accessible name. */
  title: string;
  /**
   * Label for the control that opens the sheet. A sheet with no trigger
   * cannot be opened, so the trigger is part of the component rather than
   * something every caller re-implements around it. Text, per §8.2 — the
   * thing a sheet opens onto is never guessable from an icon.
   */
  trigger: ReactNode;
  children: ReactNode;
};

/**
 * `shell-column-private` (§7.1, 640px) is the width of the product's private
 * single-column surface — settings, checkpoints, Bell — which is exactly the
 * kind of content a side sheet carries. Reusing it keeps one number in one
 * place instead of inventing a sheet width.
 */
/*
 * Every edge names BOTH of its insets, including the one it sets to `auto`.
 * The UA stylesheet gives `dialog:modal` a blanket `inset: 0`, so a sheet that
 * only declared the edge it wants to sit on would be over-constrained —
 * `inset-inline-start: 0` from the UA plus `inset-inline-end: 0` from the
 * component plus a fixed width — and the browser resolves that by ignoring
 * the end edge, which silently parks an `inline-end` sheet on the wrong side.
 * Measured, not assumed: this is what the first implementation did.
 *
 * `max-h-*` for the same reason: the UA caps a modal dialog's height, which a
 * full-height side sheet must clear and a bottom sheet must keep.
 */
const SIDE_CLASSES: Record<SheetSide, string> = {
  'inline-start':
    'inset-y-0 start-0 end-auto h-full max-h-none w-full shell-column-private starting:-translate-x-full rtl:starting:translate-x-full',
  'inline-end':
    'inset-y-0 end-0 start-auto h-full max-h-none w-full shell-column-private starting:translate-x-full rtl:starting:-translate-x-full',
  'block-end': 'top-auto bottom-0 start-0 end-0 max-h-full w-full starting:translate-y-full',
};

export function Sheet({ side, title, trigger, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const open = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  // A click on a modal dialog's backdrop is dispatched at the dialog element
  // itself; anything inside the panel targets the panel or its descendants.
  const onDialogClick = useCallback((event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      dialogRef.current.close();
    }
  }, []);

  return (
    <>
      <Button variant="outline" size="md" onClick={open}>
        {trigger}
      </Button>

      <dialog
        ref={dialogRef}
        onClick={onDialogClick}
        aria-labelledby={titleId}
        className={[
          // The UA stylesheet centres a modal dialog and caps its size; all of
          // that is replaced so the element IS the panel and sits on an edge.
          'fixed m-0 max-w-none p-0',
          'bg-paper-raise text-ink shadow-sheet',
          'z-sheet overflow-y-auto',
          // §11's backdrop value, named once in globals.css.
          'backdrop:sheet-backdrop',
          'motion-safe:transition-transform motion-safe:dur-3 motion-safe:ease-out',
          SIDE_CLASSES[side],
        ].join(' ')}
      >
        {/* Fills the dialog so that only genuine backdrop clicks reach the
            handler above, and so a short sheet still has a full-height panel. */}
        <div className="flex h-full flex-col gap-6 p-8">
          <div className="flex items-start justify-between gap-6">
            <h2 id={titleId} className="text-head font-prose">
              {title}
            </h2>
            {/* `close` is on the §8.1 icon-only whitelist, and it is the one
                control in a sheet whose target is unambiguous. */}
            <Button variant="quiet" size="sm" iconOnly icon="close" aria-label="Close" onClick={close} />
          </div>

          <div className="measure">{children}</div>
        </div>
      </dialog>
    </>
  );
}
