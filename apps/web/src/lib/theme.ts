import { cookies, headers } from 'next/headers';

/**
 * frontend-spec §5.3 / §16 — theme resolution and vocabulary.
 *
 * `Theme` is what actually gets painted: the value stamped onto
 * `<html data-theme>`. `ThemeSetting` is the wider vocabulary a person can
 * choose — §16 lists three options, "Light default · dark · system" — where
 * `'system'` means "no explicit choice, follow the OS preference". Only
 * `Theme` values are ever written to the theme cookie: choosing `'system'`
 * clears the cookie rather than storing the literal string, so the cookie's
 * own domain stays exactly `'light' | 'dark'` and `resolveTheme` below never
 * has to special-case a third cookie value.
 */
export type Theme = 'light' | 'dark';
export type ThemeSetting = Theme | 'system';

export const THEME_COOKIE = 'theme';

/** One year. A theme choice is not a session artefact. */
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const THEME_VALUES: ReadonlySet<string> = new Set<Theme>(['light', 'dark']);
const THEME_SETTING_VALUES: ReadonlySet<string> = new Set<ThemeSetting>(['light', 'dark', 'system']);

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && THEME_VALUES.has(value);
}

export function isThemeSetting(value: unknown): value is ThemeSetting {
  return typeof value === 'string' && THEME_SETTING_VALUES.has(value);
}

/**
 * THE SEAM (M0-FE-09). One function, one call site (the RSC root layout).
 * Every consumer downstream reads `data-theme` off the document — nobody else
 * ever touches a cookie or a header directly, which is what makes the M1
 * arrival below an internal change instead of a call-site change.
 *
 * frontend-spec §5.3 resolution order, all server-side, no client JS:
 *
 *   1. User setting — server-persisted. M0 has no session (auth is
 *      M0-BE-17/M1), so today the `theme` cookie *is* the setting: it is
 *      written by `POST /theme` (src/app/theme/route.ts) and read here.
 *      At M1, this step becomes "read the authed profile's theme field
 *      first; an anonymous/signed-out request falls back to this same
 *      cookie read." The signature (`Promise<Theme>`) and every call site
 *      stay identical — only this function's body grows a profile lookup
 *      ahead of the cookie read.
 *   2. OS preference — the `Sec-CH-Prefers-Color-Scheme` client hint.
 *      `next.config.ts` advertises `Accept-CH` + `Critical-CH` for it, which
 *      is what makes it available on the server on (almost always) the very
 *      first request rather than needing a client-side `matchMedia` probe —
 *      the usual way to read OS preference, and unusable here because it
 *      needs client JS and produces the flash §5.3 forbids.
 *   3. Light. Also what `packages/tokens`' `tokens.css` uses for `:root` with
 *      no `data-theme` attribute at all, so even a request this function
 *      never got to run against (there isn't one — RSC always runs before
 *      the response is sent) would still not flash.
 *
 * No CSS-level `prefers-color-scheme` fallback is added for the gap "hint
 * hasn't arrived yet": `Critical-CH` exists precisely to close that gap by
 * making a supporting browser retry the *first* document request with the
 * hint attached before any HTML is painted, and a non-supporting browser has
 * no OS signal to read from CSS either way — it falls through to step 3 in
 * both places. Adding a `prefers-color-scheme` media query here would let a
 * browser paint a *different* theme in CSS than the one this function chose,
 * which is a second flash risk, not a fix for one.
 */
export async function resolveTheme(): Promise<Theme> {
  const cookieValue = (await cookies()).get(THEME_COOKIE)?.value;
  if (isTheme(cookieValue)) {
    return cookieValue;
  }

  const hint = (await headers()).get('sec-ch-prefers-color-scheme');
  if (hint === 'dark') {
    return 'dark';
  }

  return 'light';
}
