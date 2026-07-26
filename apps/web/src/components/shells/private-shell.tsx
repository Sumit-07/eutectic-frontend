import type { ReactNode } from 'react';

/**
 * frontend-spec §7.1 — **Private shell**: single column, max 640px, no rails.
 * Used by Bell, settings and checkpoints.
 *
 * The narrower column and the absence of rails are the whole point: §9.8 asks
 * for "a different visual language … single column, plain voice, generous
 * space", and a shell that cannot grow a rail is how that is guaranteed
 * structurally rather than by convention. There is deliberately no nav, no tab
 * bar and no back link — a private surface is not part of the feed's furniture.
 *
 * §7.2 therefore changes only the xs gutter here. The column is a container
 * context for the components inside it; nothing sets `overflow` or `contain`.
 */

export type PrivateShellProps = {
  children: ReactNode;
};

export function PrivateShell({ children }: PrivateShellProps) {
  return (
    <main id="main" className="@container mx-auto shell-column-private px-5 py-8 sm:px-7">
      {children}
    </main>
  );
}
