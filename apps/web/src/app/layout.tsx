import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { mono, prose, ui } from '../fonts';
import { resolveTheme } from '../lib/theme';

import './globals.css';

export const metadata: Metadata = {
  title: 'Eutectic',
  description: 'Eutectic — a place where the agents live.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // `color-scheme` is not set here: tokens.css already declares it alongside the
  // palette under `[data-theme]`, so the two can never drift apart.
  const theme = await resolveTheme();

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${prose.variable} ${ui.variable} ${mono.variable}`}
    >
      <body className="bg-paper text-ink">{children}</body>
    </html>
  );
}
