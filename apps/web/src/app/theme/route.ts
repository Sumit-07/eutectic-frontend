import { NextResponse, type NextRequest } from 'next/server';

import { THEME_COOKIE, THEME_COOKIE_MAX_AGE_SECONDS, isThemeSetting } from '../../lib/theme';

/**
 * M0-FE-09 persistence. A plain `<form method="post" action="/theme">` posts
 * here (no client JS anywhere in this ticket — §1 row 22, D-012); this
 * handler validates the submitted value, sets or clears the `theme` cookie,
 * and 303-redirects back to where the form was submitted from. The redirect
 * is what makes the round trip work with zero JS: the browser's own
 * form-submission navigation becomes the "apply the new theme" step, and the
 * very next response (the redirected page) already carries the new
 * `data-theme` from `resolveTheme` — no flash, no client-side re-render.
 *
 * Cookie contract: `theme=light|dark`, `httpOnly=false` (the ticket requires
 * it readable by the server, which a `Set-Cookie` written here already is;
 * `httpOnly: false` additionally lets a future client-side affordance read it
 * without a new endpoint), `SameSite=Lax`, `path=/`, one year `Max-Age`.
 * Choosing `'system'` clears the cookie instead of storing the string —
 * see `src/lib/theme.ts` for why the cookie's domain stays `light | dark`.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const submitted = form.get('theme');

  if (!isThemeSetting(submitted)) {
    return NextResponse.json(
      {
        error: {
          message:
            "Invalid theme value. Expected one of 'light', 'dark', 'system'.",
        },
      },
      { status: 400 },
    );
  }

  const redirectTarget = resolveRedirectTarget(request, form.get('returnTo'));
  const response = NextResponse.redirect(new URL(redirectTarget, request.url), 303);

  if (submitted === 'system') {
    response.cookies.delete(THEME_COOKIE);
  } else {
    response.cookies.set(THEME_COOKIE, submitted, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: THEME_COOKIE_MAX_AGE_SECONDS,
    });
  }

  return response;
}

/**
 * Same-origin, path-relative redirect targets only — the usual open-redirect
 * guard for any "send me back where I came from" endpoint. Prefers the
 * form's own hidden `returnTo` field; falls back to `Referer` (set by every
 * browser on a same-origin form POST); falls back to `/probe`, since that is
 * the only place this ticket wires the toggle up.
 */
function resolveRedirectTarget(request: NextRequest, submittedReturnTo: FormDataEntryValue | null): string {
  if (typeof submittedReturnTo === 'string' && isSafeRelativePath(submittedReturnTo)) {
    return submittedReturnTo;
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin === request.nextUrl.origin) {
        return `${refererUrl.pathname}${refererUrl.search}`;
      }
    } catch {
      // Malformed Referer header — fall through to the default below.
    }
  }

  return '/probe';
}

function isSafeRelativePath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\');
}
