import type { Metadata } from 'next';

import { HandleField } from '../../../components/handles/handle-field';
import { HandleSubmitButton } from '../../../components/handles/handle-submit-button';
import { getApiClient } from '../../../lib/api/client';
import { submitOnboardingHandleAction } from '../../../lib/handles/actions';

/**
 * Onboarding — handle step (P-08, DIRECTIVE §7 §9, D-029).
 *
 * Comes after the forums step and before "meet the staff" (`/staff`, already
 * built). Bare route (frontend-spec §10) — no Feed/Reading/Private shell.
 * `/welcome/forums` and `/first-post` are M1-FE-13's; this route only builds
 * the handle step and does not link past `/staff`.
 *
 * Pseudonym is the DEFAULT path (D-029): the primary control is a form
 * pre-filled with a server-suggested pseudonym via `GET /handles/suggestion`.
 *
 * There is deliberately no "use my GitHub handle instead" CONTROL here — an
 * earlier draft linked one to `/auth/github/start`, but for an already-
 * authenticated caller that link only re-runs OAuth and skips this step
 * entirely; it changes nothing and returns the caller to `/staff` with the
 * pseudonym untouched. A control that promises an action it does not perform
 * fails review regardless of a comment explaining it (CTO-Frontend review,
 * this PR). Typing the GitHub name into the field above IS the real one-tap
 * path today — `PUT /me/handle` treats it like any other candidate string,
 * taken/reserved handled by the same error path as this ticket already
 * builds — so the supporting copy below says exactly that. A genuine
 * one-tap "use my GitHub handle" affordance needs the contract to expose the
 * caller's own GitHub login as something other than an opt-in field that may
 * be absent — nothing does that today — out of this ticket's lane, escalated
 * to Fable.
 *
 * INTERIM wiring (ticket item 8): `submitOnboardingHandleAction` is a Server
 * Action — zero new client leaves. Errors come back as query parameters this
 * page reads and renders server-side.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Pick a handle — Eutectic',
  description: 'Choose the name your posts and predictions carry.',
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WelcomeHandlePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const errorMessage = first(params.handle_error_message);
  const submittedValue = first(params.handle_value);

  const suggestion = submittedValue ?? (await getApiClient().suggestHandle()).handle;

  return (
    <main id="main" className="mx-auto measure px-5 py-8 sm:px-7">
      <h1 className="font-prose text-head text-ink">Pick a handle</h1>

      <p className="mt-4 font-ui text-body text-ink-soft">
        This is the name your posts and predictions carry here. A made-up name
        costs nothing to change later; a real one, once it is attached to a
        post, cannot be taken back. So we start you off with a suggestion —
        change it any time, including from settings.
      </p>

      <form action={submitOnboardingHandleAction} className="mt-8">
        <HandleField
          htmlFor="onboarding-handle"
          defaultValue={suggestion}
          state={errorMessage ? { kind: 'error', message: errorMessage } : undefined}
        />
        <div className="mt-6">
          <HandleSubmitButton>Continue</HandleSubmitButton>
        </div>
      </form>

      <div className="mt-8 border-t border-rule-soft pt-6">
        <p className="font-ui text-meta text-ink-quiet">
          Prefer the name on your GitHub account? Type it in above — it&rsquo;s
          yours to claim like any other handle.
        </p>
      </div>
    </main>
  );
}
