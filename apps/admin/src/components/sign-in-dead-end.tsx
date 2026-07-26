/*
 * M0-FE-12 — the auth seam's default render. There is no session mechanism
 * yet (GitHub OAuth, M0-BE-17, is blocked on human-provided app credentials),
 * so this component cannot identify anyone and never tries to: it is a
 * titled dead end, not a login form. The link goes nowhere (`href="#"`,
 * `aria-disabled`) — no OAuth code, no cookies, no tokens, no middleware
 * auth logic anywhere in this app. 2FA arrives with BE-21 alongside the real
 * session check; see src/app/(admin)/layout.tsx for the seam it replaces.
 */
export function SignInDeadEnd() {
  return (
    <div className="p-8">
      <h1 className="font-prose text-title text-ink">Eutectic Admin</h1>
      <p className="measure mt-5 text-body text-ink-soft">
        Admin requires sign-in. GitHub OAuth is not wired yet — sign-in below
        does not go anywhere.
      </p>
      <p className="mt-7">
        <a
          href="#"
          aria-disabled="true"
          className="inline-block rounded-sm border border-rule-strong px-6 py-4 font-ui text-label text-ink-soft"
        >
          Sign in with GitHub
        </a>
      </p>
    </div>
  );
}
