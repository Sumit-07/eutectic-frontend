import type { Metadata } from 'next';

import { QueryProvider } from '../../../lib/api/query-provider';
import { DEV_API_BASE_URL } from '../../../lib/api/client';

import { FeedProbe } from './feed-probe';

export const metadata: Metadata = {
  title: 'API probe — Eutectic',
  description: 'The generated contract client and TanStack Query, against the Prism mock.',
};

/**
 * `/probe/api` — the fixture route for M0-FE-08.
 *
 * A server component (no `'use client'` on a page, §1 row 22). It renders the
 * static explanation on the server and mounts exactly two client leaves: the
 * query provider and the island that calls the mock through the generated
 * client. The provider is mounted *here* rather than in the root layout so
 * TanStack Query's ~13KB lands on this route alone and every other route stays
 * at the ratcheted 103KB framework baseline (D-012).
 *
 * Two terminals:
 *
 *   1  pnpm --filter @eutectic/web mock     # Prism on 127.0.0.1:4010
 *   2  pnpm --filter @eutectic/web dev      # then open /probe/api
 *
 * With no mock running the island renders its error state, which is also worth
 * looking at — that is the third of the three states this page exists to show.
 */
export default function ApiProbePage() {
  return (
    <main className="p-8">
      <h1 className="text-head font-prose text-ink">API probe</h1>

      <p className="text-body font-ui text-ink-soft measure mt-5">
        One request — <code className="font-mono text-body-mono">GET /feed</code> — made through
        the client <code className="font-mono text-body-mono">@eutectic/contracts</code> generates
        from <code className="font-mono text-body-mono">openapi.yaml</code>, wrapped in TanStack
        Query. Nothing on this page hand-writes a fetch, and nothing on it invents a design: the
        rows are plain elements, because the entry system is M0-FE-06 and the Skeleton primitive
        is M0-FE-05.
      </p>

      <p className="text-body font-ui text-ink-soft measure mt-5">
        The base URL comes from{' '}
        <code className="font-mono text-body-mono">NEXT_PUBLIC_API_BASE_URL</code>, defaulting to{' '}
        <code className="font-mono text-body-mono">{DEV_API_BASE_URL}</code> — the Prism mock, which
        is the first server <code className="font-mono text-body-mono">openapi.yaml</code> itself
        declares. Every request carries{' '}
        <code className="font-mono text-body-mono">
          Accept: application/vnd.staffroom.v1+json
        </code>{' '}
        and <code className="font-mono text-body-mono">credentials: include</code>; no token is ever
        held in JavaScript.
      </p>

      <QueryProvider>
        <FeedProbe />
      </QueryProvider>
    </main>
  );
}
