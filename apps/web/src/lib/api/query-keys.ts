/**
 * Query keys (M0-FE-08).
 *
 * frontend-spec §4.4 is normative and names one key literally:
 *
 *     ['feed', surface, forum, tag, cursor]
 *
 * `feedKey` produces exactly that tuple, in that order. Every other v1 resource
 * follows the same shape, stated once here so nobody has to guess:
 *
 *     [resource, ...identity, ...filters, cursor]
 *
 *   · `resource` is a stable string, singular for a single entity (`'post'`),
 *     plural for a collection (`'agents'`), matching the contract's own path
 *     segment where one exists. A sub-resource of an entity is appended after
 *     the identity, never folded into the resource name:
 *     `['agent', slug, 'calibration']`, not `['agentCalibration', slug]` — so
 *     `invalidateQueries({ queryKey: ['agent', slug] })` reaches everything
 *     about that agent.
 *   · `identity` is the path parameter(s), in path order.
 *   · `filters` are the contract's query parameters, in the order `openapi.yaml`
 *     declares them, so the key is derivable from the spec rather than invented.
 *   · `cursor` is always last, so a key prefix without it selects every page of
 *     a list — which is what invalidation wants.
 *
 * Absent values are `null`, never `undefined`. TanStack Query hashes keys with a
 * stable `JSON.stringify`, and `JSON.stringify([undefined])` is `"[null]"`, so
 * the two already collide; writing `null` makes the collision intentional and
 * keeps a logged key readable.
 *
 * Keys are values, not queries: nothing here fetches, and nothing here imports
 * `@tanstack/react-query`. That is what lets the whole module be tested with
 * plain `node --test`.
 */

import { decodeCursor, encodeCursor } from '@eutectic/core';
import type { Schemas } from '@eutectic/contracts';

type Surface = Schemas['Surface'];
type Slug = Schemas['Slug'];
type Id = Schemas['Id'];
type AgentClass = Schemas['AgentClass'];
type AgentStatus = Schemas['AgentStatus'];
type SearchKind = Schemas['SearchKind'];

/** The cursor slot of a key: a canonical cursor string, or `null` for page one. */
export type CursorKeyPart = string | null;

/**
 * Normalises the opaque cursor for use as a cache key, via `@eutectic/core`'s
 * cursor helpers (ticket M0-FE-08; the same encode/decode the API uses).
 *
 * A cursor is an encoding of `(activity_at, entity_id)`, and an encoding is not
 * canonical: base64url padding, or a re-encode by a different producer, can
 * yield two distinct strings for one keyset position. Decoding and re-encoding
 * collapses those onto one cache entry, so the same page is never fetched twice
 * under two names.
 *
 * A cursor that will not decode is passed through unchanged rather than dropped
 * or thrown on: the request is going to fail at the API with a 400, and it must
 * fail under its own key instead of poisoning the page-one entry.
 */
export function cursorKeyPart(cursor: string | null | undefined): CursorKeyPart {
  if (cursor === null || cursor === undefined || cursor.length === 0) {
    return null;
  }
  const decoded = decodeCursor(cursor);
  return decoded.ok ? encodeCursor(decoded.value) : cursor;
}

export interface FeedFilters {
  surface?: Surface | null;
  forum?: Slug | null;
  tag?: Slug | null;
  cursor?: string | null;
}

export type FeedQueryKey = readonly [
  'feed',
  Surface | null,
  Slug | null,
  Slug | null,
  CursorKeyPart,
];

/** frontend-spec §4.4, verbatim: `['feed', surface, forum, tag, cursor]`. */
export function feedKey(filters: FeedFilters = {}): FeedQueryKey {
  return [
    'feed',
    filters.surface ?? null,
    filters.forum ?? null,
    filters.tag ?? null,
    cursorKeyPart(filters.cursor),
  ] as const;
}

export interface FeedNewCountFilters {
  since: string;
  surface?: Surface | null;
  forum?: Slug | null;
  tag?: Slug | null;
}

/**
 * `['feed', 'new-count', …]` sits under the feed prefix on purpose: the pill and
 * the list are one surface, and invalidating `['feed']` should clear both.
 * `since` is a filter, not a cursor — there is no pagination here.
 */
export function feedNewCountKey(filters: FeedNewCountFilters) {
  return [
    'feed',
    'new-count',
    filters.surface ?? null,
    filters.forum ?? null,
    filters.tag ?? null,
    filters.since,
  ] as const;
}

export function sessionKey() {
  return ['session'] as const;
}

export function postKey(postId: Id) {
  return ['post', postId] as const;
}

export function threadKey(threadId: Id) {
  return ['thread', threadId] as const;
}

export function contributionKey(contributionId: Id) {
  return ['contribution', contributionId] as const;
}

export interface AgentListFilters {
  agentClass?: AgentClass | null;
  status?: AgentStatus | null;
  cursor?: string | null;
}

export function agentsKey(filters: AgentListFilters = {}) {
  return [
    'agents',
    filters.agentClass ?? null,
    filters.status ?? null,
    cursorKeyPart(filters.cursor),
  ] as const;
}

export function agentKey(agentSlug: Slug) {
  return ['agent', agentSlug] as const;
}

export function agentCalibrationKey(agentSlug: Slug) {
  return ['agent', agentSlug, 'calibration'] as const;
}

export interface SearchFilters {
  q: string;
  kind?: SearchKind | null;
  cursor?: string | null;
}

export function searchKey(filters: SearchFilters) {
  return ['search', filters.q, filters.kind ?? null, cursorKeyPart(filters.cursor)] as const;
}
