// M0-FE-08 — query keys, frontend-spec §4.4.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { encodeCursor } from '@eutectic/core';

import {
  agentCalibrationKey,
  agentKey,
  cursorKeyPart,
  feedKey,
  feedNewCountKey,
  searchKey,
} from '../src/lib/api/query-keys.ts';

const CURSOR = encodeCursor({ activityAt: '2026-07-26T09:14:02Z', entityId: 'abc123' });

test('the feed key is §4.4 verbatim: [feed, surface, forum, tag, cursor]', () => {
  assert.deepEqual(
    feedKey({ surface: 'validate', forum: 'rental-tech', tag: 'leases', cursor: CURSOR }),
    ['feed', 'validate', 'rental-tech', 'leases', CURSOR],
  );
});

test('absent filters are null, in position — the tuple never changes length', () => {
  assert.deepEqual(feedKey(), ['feed', null, null, null, null]);
  assert.deepEqual(feedKey({ surface: 'diaries' }), ['feed', 'diaries', null, null, null]);
  assert.equal(feedKey().length, feedKey({ surface: 'diaries', cursor: CURSOR }).length);
});

test('a cursor is canonicalised through @eutectic/core, so one page has one key', () => {
  // Same keyset position, produced by a re-encode: must hash to one entry.
  const equivalent = encodeCursor({ activityAt: '2026-07-26T09:14:02Z', entityId: 'abc123' });
  assert.deepEqual(feedKey({ cursor: CURSOR }), feedKey({ cursor: equivalent }));

  // A different position must not collide.
  const other = encodeCursor({ activityAt: '2026-07-26T09:14:02Z', entityId: 'abc124' });
  assert.notDeepEqual(feedKey({ cursor: CURSOR }), feedKey({ cursor: other }));
});

test('an undecodable cursor keeps its own key rather than poisoning page one', () => {
  assert.equal(cursorKeyPart('####'), '####');
  assert.notDeepEqual(feedKey({ cursor: '####' }), feedKey());
  assert.equal(cursorKeyPart(''), null);
  assert.equal(cursorKeyPart(undefined), null);
  assert.equal(cursorKeyPart(null), null);
});

test('keys are JSON-stable, which is how TanStack Query hashes them', () => {
  assert.equal(
    JSON.stringify(feedKey({ surface: 'validate' })),
    JSON.stringify(['feed', 'validate', null, null, null]),
  );
});

test('related resources sit under a shared prefix so one invalidation reaches them', () => {
  assert.equal(feedNewCountKey({ since: '2026-07-26T09:14:02Z' })[0], 'feed');
  assert.deepEqual(agentKey('bricklayer'), ['agent', 'bricklayer']);
  assert.deepEqual(agentCalibrationKey('bricklayer'), ['agent', 'bricklayer', 'calibration']);
  assert.deepEqual(agentCalibrationKey('bricklayer').slice(0, 2), agentKey('bricklayer'));
});

test('the cursor is always the last element of a paginated key', () => {
  const search = searchKey({ q: 'lease reminders', kind: 'post', cursor: CURSOR });
  assert.deepEqual(search, ['search', 'lease reminders', 'post', CURSOR]);
  assert.equal(search.at(-1), CURSOR);
  assert.equal(feedKey({ cursor: CURSOR }).at(-1), CURSOR);
});
