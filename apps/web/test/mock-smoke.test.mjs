// M0-FE-08 — one smoke test through the real network path.
//
// Everything else in test/ stubs `fetch`. This one does not: it goes
// generated client → HTTP → Prism → `openapi.yaml`'s own examples, so a
// mismatch between the client's URL building and the spec's paths cannot hide
// behind a stub.
//
// Two terminals:
//
//   1  pnpm --filter @eutectic/web mock     # Prism on 127.0.0.1:4010
//   2  pnpm --filter @eutectic/web test
//
// With no mock listening the tests skip with that instruction rather than fail:
// the mock is a dev process, not something CI can assume, and a test suite that
// is red by default gets ignored. When CI runs Prism as a service (M0-SH-05),
// set EUTECTIC_REQUIRE_MOCK=1 and the skip becomes a failure.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DEV_API_BASE_URL, createApiClient } from '../src/lib/api/client.ts';

const MOCK_BASE_URL = process.env.EUTECTIC_MOCK_BASE_URL ?? DEV_API_BASE_URL;
const REQUIRE_MOCK = process.env.EUTECTIC_REQUIRE_MOCK === '1';
const SKIP_MESSAGE =
  `no mock answering on ${MOCK_BASE_URL} — start it with ` +
  `\`pnpm --filter @eutectic/web mock\` and re-run (set EUTECTIC_REQUIRE_MOCK=1 to make this a failure)`;

const mockIsUp = await (async () => {
  try {
    const response = await fetch(`${MOCK_BASE_URL}/feed`, {
      headers: { accept: 'application/vnd.staffroom.v1+json' },
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
})();

if (!mockIsUp && REQUIRE_MOCK) {
  throw new Error(`EUTECTIC_REQUIRE_MOCK=1 but ${SKIP_MESSAGE}`);
}

const client = createApiClient({ baseUrl: MOCK_BASE_URL });

test('GET /feed through the generated client returns a contract-shaped page', async (t) => {
  if (!mockIsUp) {
    t.skip(SKIP_MESSAGE);
    return;
  }

  const page = await client.getFeed({ query: { surface: 'validate', limit: 5 } });

  assert.ok(Array.isArray(page.items), 'items must be an array');
  assert.ok(page.items.length > 0, 'the spec examples should yield at least one entry');
  assert.equal(typeof page.page.has_more, 'boolean');

  const entry = page.items[0];
  for (const field of [
    'entity_type',
    'entity_id',
    'surface',
    'author',
    'visibility',
    'activity_at',
    'title',
    'excerpt',
    'reply_count',
  ]) {
    assert.ok(field in entry, `FeedEntry is missing the required field ${field}`);
  }
  assert.ok(['agent', 'user'].includes(entry.author.kind));
});

test('a path parameter is filled in, not sent literally', async (t) => {
  if (!mockIsUp) {
    t.skip(SKIP_MESSAGE);
    return;
  }

  const agent = await client.getAgent({ path: { agentSlug: 'bricklayer' } });
  assert.equal(typeof agent.slug, 'string');
  assert.equal(typeof agent.ink, 'string');
});

test('the mock accepts the versioned media type this client sends', async (t) => {
  if (!mockIsUp) {
    t.skip(SKIP_MESSAGE);
    return;
  }

  // The client sets `Accept: application/vnd.staffroom.v1+json` on every call
  // (test/api-client.test.mjs proves the header; this proves the server the
  // contract describes serves that media type rather than 406-ing on it).
  const response = await fetch(`${MOCK_BASE_URL}/feed`, {
    headers: { accept: 'application/vnd.staffroom.v1+json' },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /vnd\.staffroom\.v1\+json/);
});
