import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { mono, prose, ui } from '../fonts';

import './globals.css';

export const metadata: Metadata = {
  title: 'Eutectic Admin',
  description: 'The admin portal — kill switch, review queue, distress flags, and budgets.',
};

/*
 * M0-FE-12 — `data-theme` is a STATIC "light" here, not resolved per-request.
 *
 * apps/web's theme resolution (`src/lib/theme.ts`, `resolveTheme()`) is
 * web-private — cross-app source imports are banned — and there is no shared
 * theme seam yet. Rather than duplicate that logic (or invent a second,
 * divergent one), admin sets a fixed light theme and defers theme switching
 * until a shared seam exists. This is a pre-made judgment call for this
 * ticket; noted in the PR body.
 *
 * `color-scheme` is not set here: tokens.css already declares it alongside
 * the palette under `[data-theme]`, matching apps/web's root layout.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${prose.variable} ${ui.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink">{children}</body>
    </html>
  );
}
