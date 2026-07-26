import type { ReactNode } from 'react';

import { AdminShell } from '../../components/admin-shell';
import { SignInDeadEnd } from '../../components/sign-in-dead-end';

/*
 * M0-FE-12 — THE AUTH SEAM. Read this whole file before touching it.
 *
 * There is no session mechanism yet: GitHub OAuth (M0-BE-17) is blocked on
 * human-provided app credentials, and 2FA (M0-BE-21) has not landed either.
 * This layout therefore cannot identify a real admin and does not try to —
 * it either shows a dead end (default) or, in development only, bypasses
 * straight to the admin shell so the eight route stubs are reachable for
 * review without a working login.
 *
 * `readAllowlist()` / `isAllowedLogin()` exist now, ahead of BE-17, so the
 * shape of `ADMIN_GITHUB_LOGINS` is settled and exercised by anyone reading
 * this file — there is no identity yet to actually test them against.
 *
 * BE-21 replaces exactly ONE function here — `isAuthorized()` — with a real
 * check: cookie → session → GitHub login → isAllowedLogin(login) → 2FA
 * verified. Nothing else in this file should need to change: the dead-end
 * render, the dev bypass, and the shell wiring all stay as they are.
 */

/** Comma-separated GitHub logins, e.g. "octocat,hubot". Trims and drops blanks. */
function readAllowlist(): string[] {
  const raw = process.env.ADMIN_GITHUB_LOGINS ?? '';
  return raw
    .split(',')
    .map((login) => login.trim())
    .filter((login) => login.length > 0);
}

/** Unused until BE-17 supplies a session — kept here as the shape BE-21's real check calls. */
export function isAllowedLogin(login: string): boolean {
  return readAllowlist().includes(login);
}

/**
 * THE SEAM. Today this can only ever return true via the DEV_BYPASS branch
 * below — there is no other identity source. BE-21 replaces this function's
 * body (only this function's body) with the real session + 2FA check.
 */
function isAuthorized(): boolean {
  // DEV-ONLY bypass. Requires BOTH NODE_ENV === 'development' AND the
  // explicit opt-in env var — a developer running `next dev` without setting
  // DEV_BYPASS still sees the dead end. `next build` / `next start` set
  // NODE_ENV to 'production', so this branch is dead code in a production
  // build: the minifier can (and does) eliminate it, per this ticket's
  // verification step.
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS === '1') {
    return true;
  }

  return false;
}

export default function AdminGuardLayout({ children }: { children: ReactNode }) {
  const devBypass = isAuthorized();

  if (!devBypass) {
    return <SignInDeadEnd />;
  }

  return <AdminShell devBypass>{children}</AdminShell>;
}
