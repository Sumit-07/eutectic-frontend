'use client';

/**
 * `HandleForm` — the SEVENTH client leaf (P-08 Phase 2, D-041: Fable approved
 * exactly one new leaf for this ticket; the ceiling bump lives in
 * `apps/web/scripts/check-client-components.mjs` with a comment citing the
 * same decision, in this same PR, per the ruling that the constant may not
 * change anywhere else).
 *
 * Shared by `/welcome/handle` and `/settings` (D-029: same `PUT /me/handle`
 * rule set, so the same control renders both). It ENHANCES the Server Action
 * submission both pages already had in Phase 1 — it does not replace it:
 *
 *   - The enclosing `<form action={submitXHandleAction}>` stays in the
 *     SERVER-rendered page (`welcome/handle/page.tsx`, `settings/page.tsx`),
 *     unchanged in kind from Phase 1. This component only renders the field
 *     and the submit button INSIDE that form.
 *   - Nothing here calls `preventDefault` or attaches an `onSubmit`. The
 *     browser's native form submission — POST via the Server Action, working
 *     with JavaScript disabled — is exactly Phase 1's behaviour, untouched.
 *     If this component fails to hydrate for any reason, the rendered
 *     `<input>`/`<button type="submit">` still submit the form; they just
 *     stop gaining the live-typing feedback below.
 *   - What mounting DOES add is a debounced call to `GET /handles/availability`
 *     as the caller types — advisory, pre-submit feedback only. The
 *     Server Action's own answer on the NEXT round trip (`serverState`,
 *     threaded down from `searchParams` exactly as Phase 1 wired it) is still
 *     the only thing that decides whether the handle actually changed, and
 *     still wins if the two ever disagree — e.g. someone else claims the
 *     candidate in the gap between a debounced "available" and pressing
 *     submit; the write itself re-validates server-side regardless of what
 *     this component last said.
 *
 * ── Why `serverState` wins until the caller types again ────────────────────
 * On a fresh mount (a `redirect()` back to this page after a submit),
 * `dirty` starts `false` and `serverState` renders untouched — the real
 * outcome of the last submit. The moment the caller edits the field, `dirty`
 * flips permanently for this mount and the live check takes over; the old
 * server error is not held onto and re-shown next to a candidate the caller
 * has since changed. The two states are never shown at once.
 *
 * ── Why the initial value is never checked on mount ─────────────────────────
 * `defaultValue` on `/settings` is the caller's OWN current handle — probing
 * it immediately would very likely answer "taken" (by the same account) and
 * flag a correct value as an error the instant the page loads. On
 * `/welcome/handle`, `defaultValue` is a server-suggested pseudonym the
 * suggestion endpoint already picked as available. Either way, checking
 * before the caller has changed anything would be wasted at best and wrong at
 * worst — `dirty` gates the debounce effect on "has this component's own
 * input actually been edited", not on mount.
 */

import { useEffect, useRef, useState } from 'react';

import { getApiClient } from '../../lib/api/client';
import { describeAvailability } from '../../lib/handles/errors';
import { HandleField } from './handle-field';
import type { HandleFieldState } from './handle-field';
import { HandleSubmitButton } from './handle-submit-button';

/** Long enough that a fast typist does not fire one request per keystroke, short enough to still read as "live". */
const DEBOUNCE_MS = 400;

export interface HandleFormProps {
  htmlFor: string;
  label?: string;
  defaultValue: string;
  submitLabel: string;
  /** The previous Server Action round-trip's outcome, if any (Phase 1's `searchParams` wiring). */
  serverState?: HandleFieldState;
}

export function HandleForm({ htmlFor, label, defaultValue, submitLabel, serverState }: HandleFormProps) {
  const [value, setValue] = useState(defaultValue);
  const [liveState, setLiveState] = useState<HandleFieldState>({ kind: 'idle' });
  const dirty = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!dirty.current) return; // see "why the initial value is never checked on mount" above

    const candidate = value.trim();
    if (candidate.length === 0) {
      setLiveState({ kind: 'idle' });
      return;
    }

    setLiveState({ kind: 'checking' });
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      getApiClient()
        .checkHandleAvailability({ query: { handle: candidate } })
        .then((result) => {
          if (requestId.current !== id) return; // superseded by a later keystroke — drop the stale answer
          setLiveState(
            result.available
              ? { kind: 'available' }
              : {
                  kind: 'error',
                  message: describeAvailability(false, result.reason ?? 'invalid') ?? 'That handle is not available.',
                },
          );
        })
        .catch(() => {
          if (requestId.current !== id) return;
          // A failed PROBE is not a rejected handle — say nothing rather than
          // accuse a good candidate of being invalid. The Server Action's own
          // pre-check and the write itself still run for real on submit
          // regardless of whether this ever answers.
          setLiveState({ kind: 'idle' });
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value]);

  const state = dirty.current ? liveState : (serverState ?? { kind: 'idle' });

  return (
    <div>
      <HandleField
        htmlFor={htmlFor}
        label={label}
        defaultValue={value}
        state={state}
        onChange={(next) => {
          dirty.current = true;
          setValue(next);
        }}
      />
      <div className="mt-6">
        <HandleSubmitButton>{submitLabel}</HandleSubmitButton>
      </div>
    </div>
  );
}
