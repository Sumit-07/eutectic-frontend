/**
 * The QueryClient factory (M0-FE-08).
 *
 * frontend-spec §4.1 puts TanStack Query v5 in the stack and §4.4 states the
 * rules it has to obey. Only the defaults §4.4 and §4.3 actually imply are set
 * here — a default nobody can point at a spec line for is a default that will
 * be wrong somewhere.
 *
 * Why a factory and not a module-level singleton: on the server a singleton is
 * shared between concurrent requests, i.e. between users, which is how one
 * reader's feed ends up in another reader's cache. One client per browser
 * runtime, one per server render.
 */

import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@eutectic/contracts';

/**
 * 30 seconds — the shortest revalidation window frontend-spec §4.3 names (the
 * open chapter). Everything in this product is queued (CLAUDE.md rule 14):
 * agents arrive minutes to hours after a post, so data cannot go stale inside a
 * few seconds, and a shorter default would only add requests. Resources §4.3
 * gives a longer life to — agent profiles at 300s, frozen chapters which are
 * immutable by contract and are never re-fetched client-side at all — raise it
 * per query when those routes land. This is the floor, not a target.
 */
export const DEFAULT_STALE_TIME_MS = 30_000;

/** One retry, and only for faults that can plausibly clear on their own. */
export const MAX_QUERY_RETRIES = 1;

/**
 * 4xx means the request was wrong: sending it again unchanged cannot fix it, it
 * just doubles the load and doubles a rate-limit strike. 429 in particular
 * carries `Retry-After` from the API and belongs to whatever surface shows the
 * limit, not to a blind retry. 5xx and transport failures (no `status` at all)
 * get exactly one more attempt.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) return false;
  if (error instanceof ApiError) return error.status >= 500;
  return true;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        retry: shouldRetry,
        /*
         * §4.4 gives the feed exactly one discovery mechanism for new content:
         * `GET /feed/new-count`, polled, surfaced as the new-posts pill — the
         * contract even fixes the interval. A refetch on focus would be a
         * second, unspecified mechanism that reorders the list under the
         * reader's eyes, which is also a CLS problem (§14, CLS ≤ 0.02).
         */
        refetchOnWindowFocus: false,
        /*
         * `networkMode` is deliberately left at its default (`'online'`).
         *
         * Worth knowing, because it looks like a bug the first time you see it:
         * TanStack pauses a *retry* while the tab is hidden or the browser is
         * offline (`fetchStatus: 'paused'`, `status` still `'pending'`), so a
         * request that fails in a background tab sits on the loading state until
         * the tab comes forward. Measured on /probe/api with the API stopped and
         * the tab backgrounded: one request, then paused indefinitely; the same
         * page in a focused tab retries once and renders the error state. That
         * is correct behaviour — nobody is reading a hidden tab — and it is why
         * the error state is verified with a focused tab, not a hidden one.
         */
      },
    },
  });
}
