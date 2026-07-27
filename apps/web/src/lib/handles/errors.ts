/**
 * Handle error-shape mapping (P-08 — DIRECTIVE §7 §9, D-029).
 *
 * Pure, framework-free translation from the contract's error shapes to
 * copy a form can render. Nothing here calls `fetch`, nothing here is a
 * component — that is what lets it be exercised with plain `node --test`
 * against the contract's own example bodies (openapi.yaml `HandleAvailability`,
 * `HandleChangeConflict`, `UnprocessableEntity`).
 *
 * `openapi.yaml` /handles/availability: "Deliberately accepts any string...
 * so clients never duplicate the format rule." Nothing below re-implements
 * the `[a-z0-9_-]{3,20}` pattern — every message here is keyed off a reason
 * the SERVER already decided, never a client-side guess.
 */

import { ApiError } from '@eutectic/contracts';
import type { Schemas } from '@eutectic/contracts';

/** `HandleAvailability.reason`, minus `null` (null means "available", not a reason). */
export type HandleReason = Exclude<Schemas['HandleAvailability']['reason'], null>;

const KNOWN_REASONS: ReadonlySet<string> = new Set([
  'taken',
  'reserved',
  'invalid',
  'cooldown_held',
] satisfies HandleReason[]);

function isKnownReason(value: string | undefined): value is HandleReason {
  return value !== undefined && KNOWN_REASONS.has(value);
}

/**
 * One message per `HandleAvailability.reason` enum value (contract:
 * `null | taken | reserved | invalid | cooldown_held`). `describeAvailability`
 * below is the only thing that reads this table, so every reason the contract
 * can send has exactly one rendered sentence.
 */
const REASON_MESSAGE: Record<HandleReason, string> = {
  taken: 'That handle is already in use.',
  reserved: 'That handle is reserved.',
  invalid: 'Handles are 3–20 characters — lowercase letters, numbers, "-" or "_".',
  cooldown_held: 'That handle was released recently and is held for others for 90 days.',
};

/** `null` when the candidate is available; otherwise the one sentence for the reason. */
export function describeAvailability(available: boolean, reason: HandleReason | null): string | null {
  if (available) return null;
  if (reason === null) return 'That handle is not available.';
  return REASON_MESSAGE[reason];
}

export interface HandleCooldownError {
  kind: 'cooldown';
  /** ISO 8601, `error.details[].detail` where `issue === 'cooldown_until'`. */
  until: string;
  message: string;
}

export interface HandleRejectedError {
  kind: 'rejected';
  reason: HandleReason;
  message: string;
}

export interface HandleUnknownError {
  kind: 'unknown';
  message: string;
}

export type HandleChangeError = HandleCooldownError | HandleRejectedError | HandleUnknownError;

/**
 * A cooldown is a deadline, not an age — always an absolute date, never
 * `@eutectic/core`'s `relativeTime`, whose under-7-days ladder would render a
 * bare magnitude like "3d" for someone retrying near the end of their 90-day
 * window (reachable, and wrong: "3d" reads as an elapsed duration, not a date
 * to come back on). This mirrors `relativeTime`'s own absolute-date fallback
 * recipe — month short, day numeric, year only when it differs from `now`'s —
 * without importing it or touching `@eutectic/core` (shared, out of this
 * ticket's lane): `No date library` (CLAUDE.md rule 12) is satisfied the same
 * way `relativeTime` satisfies it, with `Intl.DateTimeFormat` only.
 */
function formatCooldownDate(until: string, now: Date): string {
  const target = new Date(until);
  const yearOf = (date: Date): string => new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
  const includeYear = yearOf(target) !== yearOf(now);
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: includeYear ? 'numeric' : undefined,
  }).format(target);
}

/**
 * `PUT /me/handle`'s two failure shapes, mapped to something a page can render:
 *
 *   409 `handle_cooldown`     — the caller's own 90-day cooldown is running.
 *                                `details: [{ field: 'handle', issue: 'cooldown_until', detail }]`.
 *   422 `unprocessable`       — taken / reserved / held / ill-formed, same
 *                                reason vocabulary as `/handles/availability`.
 *
 * `now` is an explicit parameter (never `Date.now()` internally), matching
 * `@eutectic/core`'s `relativeTime` convention, so this stays a pure function.
 */
export function describeHandleChangeError(error: unknown, now: Date): HandleChangeError {
  if (!(error instanceof ApiError)) {
    return {
      kind: 'unknown',
      message: 'The request did not complete. Check your connection and try again.',
    };
  }

  if (error.code === 'handle_cooldown') {
    const detail = error.details.find(
      (d) => d.field === 'handle' && d.issue === 'cooldown_until' && d.detail !== undefined,
    );
    if (detail?.detail === undefined) {
      return { kind: 'unknown', message: error.message };
    }
    const until = detail.detail;
    return {
      kind: 'cooldown',
      until,
      message: `You changed your handle recently. You can change it again on ${formatCooldownDate(until, now)}.`,
    };
  }

  if (error.code === 'unprocessable') {
    const detail = error.details.find((d) => d.field === 'handle');
    const rawReason = detail?.issue;
    const reason = isKnownReason(rawReason) ? rawReason : 'invalid';
    return { kind: 'rejected', reason, message: REASON_MESSAGE[reason] };
  }

  return { kind: 'unknown', message: error.message };
}
