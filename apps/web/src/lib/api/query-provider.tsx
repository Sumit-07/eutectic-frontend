'use client';

/**
 * `QueryProvider` — the React context TanStack Query needs (M0-FE-08).
 *
 * ── Why this is `'use client'` ─────────────────────────────────────────────
 * `QueryClientProvider` is a context provider holding a mutable cache. Context
 * and mutable state do not exist in a server component, so this leaf is a
 * client component by necessity, not by choice. It renders `{children}`
 * untouched, so RSC children passed through it stay server-rendered — the
 * provider is a boundary, not a wrapper that clientifies the tree below it.
 *
 * ── Why it is NOT in the root layout ───────────────────────────────────────
 * frontend-spec §1 row 22 bans `'use client'` on a page or layout, and D-012's
 * budget counts app-authored JS per route: mounting this in `app/layout.tsx`
 * would put TanStack Query (~13KB gz) on all nine routes, including the ones
 * that currently ship zero app-authored JS, and blow the ratcheted 103KB
 * framework baseline everywhere at once. In M0 exactly one route needs a query
 * client — `/probe/api` — so exactly one route mounts it. The app-wide mount
 * (with the hydration boundary and the RSC-prefetched cache) is an M1 ticket
 * that arrives with the first product route that fetches.
 *
 * ── Why `useState` and not a module constant ───────────────────────────────
 * A client that lived at module scope would be created once per *process*,
 * which on the server means shared between users. `useState`'s lazy initialiser
 * runs once per component instance instead, and survives re-renders and
 * StrictMode's double-invoke (which constructs a throwaway client — a QueryClient
 * with no subscribers is inert and garbage-collected).
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { createQueryClient } from './query-client';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
