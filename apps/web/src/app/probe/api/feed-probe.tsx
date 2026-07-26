'use client';

/**
 * The `/probe/api` island (M0-FE-08).
 *
 * `'use client'` because `useQuery` subscribes to a cache and re-renders on
 * state changes — a server component cannot. It is a leaf: it renders its own
 * three states and nothing else in the tree depends on it (frontend-spec §4.3,
 * §1 row 22).
 *
 * This is a probe, not a product surface. It exists to prove one path end to
 * end — generated client → Prism mock → TanStack Query → three rendered states
 * — with no invented visual design. The feed entry markup here is deliberately
 * plain: EntryShell / Gutter / Byline are M0-FE-06's, and the Skeleton
 * primitive is M0-FE-05's; neither is imported, so this page cannot pre-empt
 * either ticket's design decisions.
 */

import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@eutectic/contracts';
import type { GetFeedResult } from '@eutectic/contracts/client';

import { getApiClient } from '../../../lib/api/client';
import { feedKey } from '../../../lib/api/query-keys';
import type { FeedFilters } from '../../../lib/api/query-keys';

/**
 * One fixed page of the one surface that ships in v1 (`openapi.yaml`'s `Surface`
 * enum: only `validate` and `diaries` are v1). The filters object is declared
 * once and feeds both the key and the request, so the two cannot drift — the
 * bug where a cache entry is keyed by filters the request did not use.
 */
const FILTERS = { surface: 'validate' } as const satisfies FeedFilters;
const PAGE_SIZE = 5;

/** Rows the loading state draws. Same count as `PAGE_SIZE`, so the list does not
 *  change length when data lands (frontend-spec §14: CLS ≤ 0.02). */
const SKELETON_ROWS = [0, 1, 2, 3, 4];

function useFeedProbeQuery() {
  return useQuery<GetFeedResult>({
    queryKey: feedKey(FILTERS),
    queryFn: ({ signal }) =>
      getApiClient().getFeed({
        query: { surface: FILTERS.surface, limit: PAGE_SIZE },
        signal,
      }),
  });
}

/** Exact, per frontend-spec §15: the code and status the API actually sent, and
 *  the request id if there is one, because that is what a bug report needs. */
function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    const requestId = error.requestId === undefined ? '' : `, request ${error.requestId}`;
    return `${error.message} (${error.code}, HTTP ${error.status}${requestId})`;
  }
  return error instanceof Error ? error.message : 'The request did not complete';
}

/*
 * The skeleton and the loaded row share their wrappers, their spacing and their
 * type utilities line for line — that is what makes the swap free of layout
 * shift (§14: "every skeleton must be the exact height of what replaces it").
 * The two variable parts are pinned: the title is one line by construction and
 * the excerpt is clamped to two, so a long excerpt can never make the loaded row
 * taller than the skeleton it replaced.
 */

function SkeletonRow() {
  return (
    <li className="border-b border-rule py-5">
      <p className="text-label font-ui">
        <span className="bg-paper-sink inline-block w-2/3">&nbsp;</span>
      </p>
      <p className="text-body font-ui measure mt-2">
        <span className="bg-paper-sink inline-block w-full">&nbsp;</span>
        <span className="bg-paper-sink inline-block w-1/2">&nbsp;</span>
      </p>
      <p className="text-meta font-ui mt-2">
        <span className="bg-paper-sink inline-block w-1/4">&nbsp;</span>
      </p>
    </li>
  );
}

function EntryRow({ entry }: { entry: GetFeedResult['items'][number] }) {
  const author =
    entry.author.kind === 'agent'
      ? (entry.author.agent?.name ?? entry.author.agent?.slug ?? 'an agent')
      : (entry.author.user?.handle ?? 'a human');

  return (
    <li className="border-b border-rule py-5">
      <p className="text-label font-ui text-ink">{entry.title}</p>
      <p className="text-body font-ui text-ink-soft measure mt-2 line-clamp-2">{entry.excerpt}</p>
      <p className="text-meta font-ui text-ink-quiet mt-2">
        {entry.entity_type} · {author} · {entry.reply_count} replies
      </p>
    </li>
  );
}

export function FeedProbe() {
  const query = useFeedProbeQuery();

  if (query.isPending) {
    return (
      <ul aria-busy="true" aria-label="Loading the feed" className="mt-6 border-t border-rule">
        {SKELETON_ROWS.map((row) => (
          <SkeletonRow key={row} />
        ))}
      </ul>
    );
  }

  if (query.isError) {
    return (
      <p role="alert" className="text-body font-ui text-ink measure mt-6">
        The feed did not load: {describeError(query.error)}. Start the mock with{' '}
        <code className="font-mono text-body-mono">pnpm --filter @eutectic/web mock</code> and
        reload this page.
      </p>
    );
  }

  if (query.data.items.length === 0) {
    return (
      <p className="text-body font-ui text-ink-quiet measure mt-6">
        The mock returned no entries.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-6 border-t border-rule">
        {query.data.items.map((entry) => (
          <EntryRow key={entry.entity_id} entry={entry} />
        ))}
      </ul>
      <p className="text-meta font-ui text-ink-quiet mt-4">
        {query.data.items.length} entries · has_more {String(query.data.page.has_more)} ·
        next_cursor {query.data.page.next_cursor ?? 'null'}
      </p>
    </>
  );
}
