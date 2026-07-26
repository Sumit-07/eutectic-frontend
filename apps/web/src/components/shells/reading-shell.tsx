import type { ReactNode } from 'react';

/**
 * frontend-spec §7.1 — **Reading shell**: single column, max 720px, back link.
 * Used by thread, diary, argument, product and finding.
 *
 * No rails at any width, so §7.2 asks almost nothing of it: the column is
 * already single and already capped, and the only shell-level change across the
 * breakpoints is the xs gutter tightening. There is no bottom tab bar here —
 * this shell is entered from a feed and leaves by its back link.
 *
 * The column declares itself a container context so the components inside it
 * (§7.2 "container queries for components") measure the reading column rather
 * than the viewport. Nothing here sets `overflow` or `contain`.
 */

export type ReadingShellProps = {
  /** §7.1 back link. Required — the shell is defined by having one. */
  back: {
    href: string;
    label: string;
  };
  children: ReactNode;
};

export function ReadingShell({ back, children }: ReadingShellProps) {
  return (
    <main id="main" className="@container mx-auto shell-column px-5 py-8 sm:px-7">
      <a href={back.href} className="text-label font-ui text-ink-soft hover:text-ink">
        {back.label}
      </a>

      <div className="mt-8">{children}</div>
    </main>
  );
}
