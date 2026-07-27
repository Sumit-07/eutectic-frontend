'use server';

/**
 * Handle-change server actions (P-08 — DIRECTIVE §7 §9, D-029; the
 * `use_github_login` path added Phase 2, D-041).
 *
 * INTERIM wiring (see `docs/DIRECTIVE-pre-M1.md` §7 and the P-08 ticket's
 * two-phase note): these are plain Next.js Server Actions. A
 * `<form action={...}>` posts here, works with JavaScript disabled, and
 * every outcome — success or error — is communicated back to the calling
 * page as a redirect with query parameters, which the page reads
 * server-side and renders. Phase 2's `handle-form.tsx` client leaf enhances
 * the pseudonym form's typing experience but still posts through the exact
 * same `<form action={submitXHandleAction}>` — nothing about how a submit
 * reaches this file changed.
 *
 * Both onboarding (`/welcome/handle`) and settings (`/settings`) go through
 * the SAME `PUT /me/handle` rule set (D-029: "same operation, same rules"),
 * so the write and the error mapping live once, here, in `submitHandleUpdate`.
 * `errors.ts` is the only place that turns a contract error into copy —
 * these actions never invent their own message.
 *
 * `changeHandleFromGithub` sends `{ use_github_login: true }`
 * (`HandleUpdateFromGitHub`, openapi.yaml) instead of `{ handle }` — the
 * server resolves and lowercases the caller's own GitHub login entirely
 * server-side, so there is no candidate string here to availability-pre-check
 * (unlike `changeHandle`'s value path): the write is the first and only call.
 * A grammar miss after resolution still comes back as a plain 422 `invalid`,
 * which `describeHandleChangeError` already handles with no change needed.
 */

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';

import { ApiError } from '@eutectic/contracts';
import type { Schemas } from '@eutectic/contracts';

import { getApiClient } from '../api/client';
import { describeAvailability, describeHandleChangeError } from './errors';
import type { HandleReason } from './errors';

/** Everything a failed submission needs to render itself back on the same page. */
interface HandleChangeFailure {
  kind: 'rejected' | 'cooldown' | 'unknown';
  message: string;
  reason?: HandleReason;
  until?: string;
}

function readHandle(formData: FormData): string {
  const raw = formData.get('handle');
  return typeof raw === 'string' ? raw.trim() : '';
}

function failureParams(failure: HandleChangeFailure, handle: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set('handle_error_kind', failure.kind);
  params.set('handle_error_message', failure.message);
  params.set('handle_value', handle);
  if (failure.reason !== undefined) params.set('handle_error_reason', failure.reason);
  if (failure.until !== undefined) params.set('handle_error_until', failure.until);
  return params;
}

/**
 * The one call to `PUT /me/handle` (either request shape), with the shared
 * 409/422 error mapping. Returns success or a rendered failure — never
 * throws, so every server action below can stay a single `redirect()` call.
 */
async function submitHandleUpdate(
  body: Schemas['HandleUpdateByValue'] | Schemas['HandleUpdateFromGitHub'],
): Promise<{ ok: true } | { ok: false; failure: HandleChangeFailure }> {
  try {
    await getApiClient().setHandle({
      headers: { 'Idempotency-Key': randomUUID() },
      body,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      const mapped = describeHandleChangeError(error, new Date());
      if (mapped.kind === 'cooldown') {
        return { ok: false, failure: { kind: 'cooldown', message: mapped.message, until: mapped.until } };
      }
      if (mapped.kind === 'rejected') {
        return { ok: false, failure: { kind: 'rejected', reason: mapped.reason, message: mapped.message } };
      }
      return { ok: false, failure: { kind: 'unknown', message: mapped.message } };
    }
    return {
      ok: false,
      failure: { kind: 'unknown', message: 'The request did not complete. Try again.' },
    };
  }
}

/**
 * The explicit-value path: availability pre-check the ticket asks for
 * ("availability pre-check server-side"), then the write.
 */
async function changeHandle(
  handle: string,
): Promise<{ ok: true } | { ok: false; failure: HandleChangeFailure }> {
  if (handle.length === 0) {
    return {
      ok: false,
      failure: { kind: 'rejected', reason: 'invalid', message: describeAvailability(false, 'invalid') ?? 'Enter a handle.' },
    };
  }

  // Pre-check: the endpoint "deliberately accepts any string" (openapi.yaml),
  // so a bad candidate answers 200 `{available:false,reason:...}` rather than
  // a request error — checking first avoids spending an Idempotency-Key on a
  // write that cannot succeed. The PUT below still handles 409/422 for the
  // race between this check and the write.
  const availability = await getApiClient().checkHandleAvailability({ query: { handle } });
  if (!availability.available) {
    const reason = availability.reason ?? 'invalid';
    return {
      ok: false,
      failure: { kind: 'rejected', reason, message: describeAvailability(false, reason) ?? 'That handle is not available.' },
    };
  }

  return submitHandleUpdate({ handle });
}

/**
 * The one-tap path (Phase 2, D-041): `{ use_github_login: true }`. No
 * candidate string exists client- or server-action-side to pre-check —
 * the server resolves the caller's own GitHub login and lowercases it
 * internally, so the write is the first and only call.
 */
async function changeHandleFromGithub(): Promise<{ ok: true } | { ok: false; failure: HandleChangeFailure }> {
  return submitHandleUpdate({ use_github_login: true });
}

/**
 * Onboarding step (after forums, before "meet the staff" — DIRECTIVE §7).
 * Success continues to `/staff`, exactly as the ticket names it.
 */
export async function submitOnboardingHandleAction(formData: FormData): Promise<void> {
  const handle = readHandle(formData);
  const result = await changeHandle(handle);

  if (result.ok) {
    redirect('/staff');
  }
  redirect(`/welcome/handle?${failureParams(result.failure, handle).toString()}`);
}

/**
 * Onboarding — the one-tap "use my GitHub handle" control (Phase 2, D-041).
 * Same destination on success as the pseudonym path. On failure, the error
 * goes back in its OWN query param (`github_error_message`) — never
 * `handle_error_message`/`handle_value` — so a rejected one-tap attempt can
 * never overwrite the pseudonym field's suggestion or state.
 * `_formData` is unused: `<form action={...}>` still passes one, but this
 * request carries no candidate value at all.
 */
export async function submitOnboardingGithubHandleAction(_formData: FormData): Promise<void> {
  const result = await changeHandleFromGithub();

  if (result.ok) {
    redirect('/staff');
  }
  const params = new URLSearchParams();
  params.set('github_error_message', result.failure.message);
  redirect(`/welcome/handle?${params.toString()}`);
}

/**
 * Settings — handle change with the 90-day cooldown (DIRECTIVE §7, M1-FE-15).
 * Stays on `/settings` either way so the "current handle" section can
 * re-render with the fresh value or the blocked-state error.
 */
export async function submitSettingsHandleAction(formData: FormData): Promise<void> {
  const handle = readHandle(formData);
  const result = await changeHandle(handle);

  if (result.ok) {
    redirect('/settings?handle_success=1');
  }
  redirect(`/settings?${failureParams(result.failure, handle).toString()}`);
}
