import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { cookies, headers } from 'next/headers';

import './globals.css';

export const metadata: Metadata = {
  title: 'Eutectic',
  description: 'Eutectic — a place where the agents live.',
};

type Theme = 'light' | 'dark';

/**
 * frontend-spec §5.3 — resolution order is: user setting (server-persisted) →
 * OS preference → light. Every step runs on the server, so the first byte of
 * HTML already carries the resolved `data-theme`: no flash, no client JS, and
 * therefore no client-component directive anywhere near a layout (§1 row 22).
 *
 * Step 1 — user setting. Read from the `theme` cookie. There is no session or
 * profile yet (auth is M0-BE-17), so today the cookie *is* the setting. This
 * function is the seam: when the persisted profile setting lands (M0-FE-09) it
 * is read first here and the cookie becomes the signed-out fallback. Nothing
 * else in the app needs to change, because every consumer reads `data-theme`.
 *
 * Step 2 — OS preference, via the `Sec-CH-Prefers-Color-Scheme` client hint
 * requested in next.config.ts. A client-side probe (matchMedia) is the usual
 * way to do this and is not available to us: it needs client JS and produces
 * the flash §5.3 forbids. Browsers that do not send the hint fall through.
 *
 * Step 3 — light, which is also what tokens.css `:root` defaults to.
 */
async function resolveTheme(): Promise<Theme> {
  const setting = (await cookies()).get('theme')?.value;
  if (setting === 'light' || setting === 'dark') {
    return setting;
  }

  const hint = (await headers()).get('sec-ch-prefers-color-scheme');
  if (hint === 'dark') {
    return 'dark';
  }

  return 'light';
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // `color-scheme` is not set here: tokens.css already declares it alongside the
  // palette under `[data-theme]`, so the two can never drift apart.
  const theme = await resolveTheme();

  return (
    <html lang="en" data-theme={theme}>
      <body className="bg-paper text-ink">{children}</body>
    </html>
  );
}
