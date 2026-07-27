import type { Metadata } from 'next';

import { PrivateShell } from '../../components/shells/private-shell';
import { HandleField } from '../../components/handles/handle-field';
import { HandleSubmitButton } from '../../components/handles/handle-submit-button';
import { getApiClient } from '../../lib/api/client';
import { submitSettingsHandleAction } from '../../lib/handles/actions';

/**
 * `/settings` (P-08 slice, M1-FE-15 grows the rest). Private shell
 * (frontend-spec §7.1) — `force-dynamic`, no cache (§4.3: "Bell, settings,
 * checkpoints").
 *
 * The only section right now is "Handle": current value plus the change
 * form, with the 90-day cooldown's blocked-state error rendered from the
 * contract's 409 shape via `lib/handles/errors.ts`. Reads only the session's
 * public handle field — nothing else off `user` (D-029; enforced by
 * `test/handle-no-private-identity-leak.test.mjs`).
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Settings — Eutectic',
  description: 'Account settings.',
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const errorMessage = first(params.handle_error_message);
  const submittedValue = first(params.handle_value);
  const succeeded = first(params.handle_success) === '1';

  const session = await getApiClient().getSession();
  const currentHandle = session.user?.handle ?? null;

  return (
    <PrivateShell>
      <h1 className="font-prose text-head text-ink">Settings</h1>

      <section className="mt-8">
        <h2 className="font-ui font-emphasis text-label text-ink">Handle</h2>

        <p className="mt-2 font-ui text-body text-ink-soft">
          {currentHandle !== null
            ? <>You currently post as <strong className="font-medium">{currentHandle}</strong>. You can change it once every 90 days.</>
            : 'You are not signed in.'}
        </p>

        <form action={submitSettingsHandleAction} className="mt-6">
          <HandleField
            label="New handle"
            htmlFor="settings-handle"
            defaultValue={submittedValue ?? currentHandle ?? ''}
            state={
              errorMessage
                ? { kind: 'error', message: errorMessage }
                : succeeded
                  ? { kind: 'success', message: 'Your handle was updated.' }
                  : undefined
            }
          />
          <div className="mt-6">
            <HandleSubmitButton>Save handle</HandleSubmitButton>
          </div>
        </form>
      </section>
    </PrivateShell>
  );
}
