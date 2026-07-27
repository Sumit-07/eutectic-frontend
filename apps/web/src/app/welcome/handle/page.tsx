import type { Metadata } from 'next';

import { GithubHandleControl } from '../../../components/handles/github-handle-control';
import { HandleForm } from '../../../components/handles/handle-form';
import { getApiClient } from '../../../lib/api/client';
import {
  submitOnboardingGithubHandleAction,
  submitOnboardingHandleAction,
} from '../../../lib/handles/actions';

/**
 * Onboarding — handle step (P-08, DIRECTIVE §7 §9, D-029; Phase 2 additions
 * per D-041).
 *
 * Comes after the forums step and before "meet the staff" (`/staff`, already
 * built). Bare route (frontend-spec §10) — no Feed/Reading/Private shell.
 * `/welcome/forums` and `/first-post` are M1-FE-13's; this route only builds
 * the handle step and does not link past `/staff`.
 *
 * Pseudonym is the DEFAULT path (D-029) and stays visually PRIMARY: the
 * solid-styled form, pre-filled with a server-suggested pseudonym via
 * `GET /handles/suggestion`, is the first thing on the page.
 *
 * Phase 1 removed a "use my GitHub handle instead" link here because it
 * re-ran OAuth for an already-authenticated caller and did nothing — "a
 * control that promises an action it does not perform fails review
 * regardless of a comment explaining it" (CTO-Frontend review, PR #14). The
 * contract gap that forced that removal is now closed (D-041:
 * `HandleUpdateFromGitHub`, `{ use_github_login: true }`), so
 * `GithubHandleControl` restores the block as a real, secondary (outline)
 * affordance below the pseudonym form — see that component's own doc
 * comment for how it stays out of the private-identity invariant.
 *
 * Both forms post via Server Actions — Phase 1's no-JS wiring, unchanged in
 * kind. `HandleForm` (Phase 2's one approved client leaf, D-041) enhances the
 * pseudonym form's typing experience with debounced availability checking;
 * it does not touch how either form submits.
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
  const githubErrorMessage = first(params.github_error_message);

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
        <HandleForm
          htmlFor="onboarding-handle"
          defaultValue={suggestion}
          submitLabel="Continue"
          serverState={errorMessage ? { kind: 'error', message: errorMessage } : undefined}
        />
      </form>

      <GithubHandleControl action={submitOnboardingGithubHandleAction} errorMessage={githubErrorMessage} />
    </main>
  );
}
