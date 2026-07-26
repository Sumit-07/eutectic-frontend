'use client';

import { useEffect, useRef } from 'react';

import { Toast } from './toast';
import type { ToastProps } from './toast';

/**
 * frontend-spec §9.1 — the host for `Toast`: "One at a time, 4s,
 * bottom-left (web)".
 *
 * WHY THIS FILE IS A CLIENT LEAF. It owns a timer. That is the entire
 * reason: `setTimeout` and the effect that clears it cannot run on the
 * server. The toast's markup, tones and action button all live in
 * `toast.tsx`, which has no directive, so nothing is dragged into the client
 * bundle by association.
 *
 * ONE AT A TIME, STRUCTURALLY. The region takes a single nullable toast, not
 * a queue. There is no array to grow, so a second toast cannot appear beside
 * the first even by mistake — handing the region a new toast replaces the
 * one on screen and restarts its 4s life. Stacking toasts is a decision the
 * spec already took, in the other direction.
 *
 * THE REGION IS ALWAYS MOUNTED. `aria-live` announces changes to a region
 * that already exists; a live region inserted at the same moment as its
 * content is unreliable across screen readers. So the wrapper renders
 * whether or not there is a toast, and only its contents change. `polite`,
 * never `assertive` — §13 is explicit, and a toast is by definition not an
 * interruption.
 *
 * The empty wrapper is `pointer-events-none` so an invisible fixed box never
 * eats clicks in the corner of the page; the toast itself re-enables them.
 */

/**
 * §9.1's "4s". Not a `dur` token and it never will be: §5.4's motion
 * durations top out at 280ms because they time transitions, and this is how
 * long a message stays readable.
 */
export const TOAST_DURATION_MS = 4000;

/** A toast plus the identity that tells the region "this is a new one". */
export type ToastMessage = ToastProps & { id: string };

export type ToastRegionProps = {
  toast: ToastMessage | null;
  /** Called with the toast's id once its 4s are up. */
  onExpire: (id: string) => void;
};

export function ToastRegion({ toast, onExpire }: ToastRegionProps) {
  // Kept in a ref so that a caller passing an inline arrow function does not
  // restart the timer on every render of its own.
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const toastId = toast?.id ?? null;

  useEffect(() => {
    if (toastId === null) {
      return;
    }
    const timer = setTimeout(() => onExpireRef.current(toastId), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toastId]);

  return (
    // §9.1 bottom-left; `start` rather than `left` so it follows the writing
    // direction (§1 "Always"). `z-toast` is §5.4's top layer for this.
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-0 start-0 z-toast p-5"
    >
      {toast ? <Toast tone={toast.tone} message={toast.message} action={toast.action} /> : null}
    </div>
  );
}
