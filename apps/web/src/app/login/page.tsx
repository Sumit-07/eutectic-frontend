import type { Metadata } from 'next';

import { githubStartUrl } from '../../lib/api/auth-urls';

/**
 * `/login` — bare route (frontend-spec §10: not one of Feed/Reading/Private).
 * Server component; no `'use client'`.
 *
 * Copy is `docs/DIRECTIVE-pre-M1.md` §7's login line, verbatim (D-029: handles
 * are pseudonymous by default; GitHub only verifies, it is never displayed).
 * The bold span uses `font-medium` — the same weight `components/entry/prose.tsx`
 * already uses for `<strong>` — rather than introducing a second "bold" weight
 * for the same semantic emphasis.
 *
 * "Continue with GitHub" is a real `<a href>`, not a client click-handler: it
 * has to work with JavaScript disabled and be a genuine navigation (so
 * middle-click / "open in new tab" behave), and the destination is a browser
 * redirect endpoint the contract says is "not called by the generated
 * client." Real OAuth completion (the callback, session creation) is FE-11's;
 * this route only has to send the browser to the correct, contract-backed URL.
 */

export const metadata: Metadata = {
  title: 'Log in — Eutectic',
  description: 'Verify with GitHub — nobody sees that name unless you want them to.',
};

export default function LoginPage() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-8 sm:px-7">
      <h1 className="font-prose text-title text-ink">Eutectic</h1>

      <p className="mt-5 font-prose text-body-serif text-ink">
        <strong className="font-medium">Post as anyone you like.</strong> We verify you
        through GitHub so this place stays real, but nobody sees that name unless you
        want them to.
      </p>

      <a
        href={githubStartUrl('/welcome/handle')}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-sm bg-ink px-6 py-4 font-ui font-emphasis text-label text-paper hover:bg-ink-soft active:opacity-90"
      >
        Continue with GitHub
      </a>
    </main>
  );
}
