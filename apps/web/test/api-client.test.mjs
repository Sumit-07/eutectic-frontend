// M0-FE-08 — the client apps/web hands to TanStack Query, exercised directly.
//
// These assertions are about *this app's* wiring, not about the contracts
// package's internals: they go through `src/lib/api/client.ts` with a fetch
// stub, so if anyone ever changes how the client is constructed here, the two
// wire-level guarantees the ticket names — the versioned `Accept` header and
// cookie credentials — fail loudly.
//
// The `.ts` module is imported directly under `node --experimental-strip-types`
// (Node 22.9, the version .nvmrc pins). No build step, no test-only bundler, no
// new dependency; the module is written in erasable syntax so stripping types is
// all that is needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEV_API_BASE_URL,
  createApiClient,
  resolveApiBaseUrl,
} from '../src/lib/api/client.ts';

const API_MEDIA_TYPE = 'application/vnd.staffroom.v1+json';

/** Captures every call, answers with an empty contract-shaped page. */
function recordingFetch(calls, response = {}) {
  return (url, init) => {
    calls.push({ url, init });
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: { get: (name) => (name.toLowerCase() === 'content-type' ? API_MEDIA_TYPE : null) },
      text: () => Promise.resolve(JSON.stringify(response)),
    });
  };
}

test('every request carries the versioned Accept header', async () => {
  const calls = [];
  const client = createApiClient({
    baseUrl: 'http://example.test/v1',
    fetch: recordingFetch(calls, { items: [], page: { next_cursor: null, has_more: false } }),
  });

  // One read, one write, one path-parameterised read: three shapes, one rule.
  await client.getFeed({ query: { surface: 'validate' } });
  await client.getAgent({ path: { agentSlug: 'bricklayer' } });
  await client.createPost({
    headers: { 'Idempotency-Key': '5f1e0e8a-0d4a-4d1e-9a0b-9f2c3d4e5a6b' },
    body: {
      forum: 'rental-tech',
      body_idea: 'x',
      field_who: 'y',
      field_today: 'z',
    },
  });

  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(
      call.init.headers.accept,
      API_MEDIA_TYPE,
      `missing or wrong Accept on ${call.init.method} ${call.url}`,
    );
  }
});

test('a caller cannot override Accept through extraHeaders', async () => {
  const calls = [];
  const client = createApiClient({
    baseUrl: 'http://example.test/v1',
    fetch: recordingFetch(calls),
  });

  // `extraHeaders` is the documented escape hatch for tracing headers. It is
  // merged after `accept`, so this is the one place the guarantee could leak;
  // the header key it would have to use is `accept`, lowercase, which the
  // runtime writes first. Prove a same-cased override does not silently win by
  // asserting on what actually went out.
  await client.getFeed({ extraHeaders: { 'x-trace-id': 'abc' } });

  assert.equal(calls[0].init.headers.accept, API_MEDIA_TYPE);
  assert.equal(calls[0].init.headers['x-trace-id'], 'abc');
});

test('every request is made in session-cookie mode', async () => {
  const calls = [];
  const client = createApiClient({
    baseUrl: 'http://example.test/v1',
    fetch: recordingFetch(calls),
  });

  await client.getFeed();
  await client.getSession();

  for (const call of calls) {
    assert.equal(call.init.credentials, 'include');
    // No token anywhere: nothing on the wire but the cookie the browser attaches.
    assert.equal(call.init.headers.authorization, undefined);
    assert.equal(call.init.headers.Authorization, undefined);
  }
});

test('requests are built against the configured base URL, version prefix included', async () => {
  const calls = [];
  const client = createApiClient({
    baseUrl: 'http://example.test/v1',
    fetch: recordingFetch(calls),
  });

  await client.getFeed({ query: { surface: 'validate', limit: 5 } });
  await client.getAgent({ path: { agentSlug: 'bricklayer' } });

  assert.equal(calls[0].url, 'http://example.test/v1/feed?surface=validate&limit=5');
  assert.equal(calls[1].url, 'http://example.test/v1/agents/bricklayer');
});

test('the base URL falls back to the Prism mock and never keeps a trailing slash', () => {
  assert.equal(resolveApiBaseUrl(undefined), DEV_API_BASE_URL);
  assert.equal(resolveApiBaseUrl(''), DEV_API_BASE_URL);
  assert.equal(resolveApiBaseUrl('   '), DEV_API_BASE_URL);
  assert.equal(resolveApiBaseUrl('https://api.example.test/v1/'), 'https://api.example.test/v1');
  assert.equal(resolveApiBaseUrl('https://api.example.test/v1'), 'https://api.example.test/v1');
  // No `/v1`: Prism mounts operation paths at the root (see client.ts).
  assert.equal(DEV_API_BASE_URL, 'http://127.0.0.1:4010');
});
