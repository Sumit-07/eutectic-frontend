import type { Metadata } from 'next';

import { HandleField } from '../../../components/handles/handle-field';
import { HandleSubmitButton } from '../../../components/handles/handle-submit-button';
import { getApiClient } from '../../../lib/api/client';
import { submitOnboardingHandleAction } from '../../../lib/handles/actions';
import { githubStartUrl } from '../../../lib/api/auth-urls';

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
 * "Use my GitHub handle instead" is a deliberate, secondary one-tap
 * alternative — rendered as a plain link to the same `/auth/github/start`
 * redirect `/login` uses, never by reading the caller's GitHub identity in
 * this app's source (nothing in P-08 should — see the D-029 invariant test,
 * `test/handle-no-private-identity-leak.test.mjs`). Filling the field with
 * the caller's actual GitHub login on return is a real behaviour the contract
 * does not specify yet; flagged in the PR as a follow-up for CTO-Backend/Fable,
 * not invented here.
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
          Would rather post under the name attached to your GitHub account?
          You can do that instead — or switch to it later from settings.
        </p>
        <a
          href={githubStartUrl('/staff')}
          className="mt-3 inline-flex items-center justify-center rounded-sm border border-rule-strong px-6 py-4 font-ui font-emphasis text-label text-ink hover:bg-paper-hover"
        >
          Use my GitHub handle instead
        </a>
      </div>
    </main>
  );
}
