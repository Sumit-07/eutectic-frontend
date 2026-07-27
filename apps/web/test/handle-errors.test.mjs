// P-08 — DIRECTIVE §7 §9, D-029.
//
// Exercises `src/lib/handles/errors.ts` against the contract's own example
// shapes (`openapi.yaml`: `HandleAvailability`, `HandleChangeConflict`,
// `UnprocessableEntity`), imported directly under `node --experimental-strip-types`
// (the same pattern `test/api-client.test.mjs` uses).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ApiError } from '@eutectic/contracts';

import { describeAvailability, describeHandleChangeError } from '../src/lib/handles/errors.ts';

test('describeAvailability: available candidate has no message', () => {
  assert.equal(describeAvailability(true, null), null);
});

test('describeAvailability: one message per HandleAvailability.reason enum value', () => {
  // openapi.yaml HandleAvailability.reason: [null, taken, reserved, invalid, cooldown_held]
  const reasons = ['taken', 'reserved', 'invalid', 'cooldown_held'];
  for (const reason of reasons) {
    const message = describeAvailability(false, reason);
    assert.equal(typeof message, 'string');
    assert.ok(message.length > 0, `expected a message for reason "${reason}"`);
  }
  // every reason gets a DIFFERENT sentence — a shared fallback would defeat the point
  const messages = new Set(reasons.map((reason) => describeAvailability(false, reason)));
  assert.equal(messages.size, reasons.length);
});

test('describeHandleChangeError: 409 handle_cooldown — the contract example, verbatim', () => {
  // openapi.yaml components/responses/HandleChangeConflict example
  const body = {
    error: {
      code: 'handle_cooldown',
      message: 'handle changed within the last 90 days',
      details: [{ field: 'handle', issue: 'cooldown_until', detail: '2026-10-25T00:00:00Z' }],
      request_id: '01J8Z6R2F3M4N5P6Q7R8S9T0V1',
    },
  };
  const error = new ApiError(409, body);
  const now = new Date('2026-07-27T00:00:00Z');

  const result = describeHandleChangeError(error, now);

  assert.equal(result.kind, 'cooldown');
  assert.equal(result.until, '2026-10-25T00:00:00Z');
  assert.match(result.message, /Oct/);
});

test('describeHandleChangeError: 422 unprocessable — one outcome per reason', () => {
  const now = new Date('2026-07-27T00:00:00Z');
  for (const reason of ['taken', 'reserved', 'invalid', 'cooldown_held']) {
    const body = {
      error: {
        code: 'unprocessable',
        message: 'handle not available',
        details: [{ field: 'handle', issue: reason }],
        request_id: '01J8Z6R2F3M4N5P6Q7R8S9T0V1',
      },
    };
    const error = new ApiError(422, body);

    const result = describeHandleChangeError(error, now);

    assert.equal(result.kind, 'rejected');
    assert.equal(result.reason, reason);
    assert.equal(result.message, describeAvailability(false, reason));
  }
});

test('describeHandleChangeError: an unrecognised 422 issue degrades to "invalid", never throws', () => {
  const body = {
    error: {
      code: 'unprocessable',
      message: 'handle not available',
      details: [{ field: 'handle', issue: 'some_future_reason' }],
      request_id: '01J8Z6R2F3M4N5P6Q7R8S9T0V1',
    },
  };
  const error = new ApiError(422, body);

  const result = describeHandleChangeError(error, new Date('2026-07-27T00:00:00Z'));

  assert.equal(result.kind, 'rejected');
  assert.equal(result.reason, 'invalid');
});

test('describeHandleChangeError: a non-ApiError (network failure) is "unknown", never throws', () => {
  const result = describeHandleChangeError(new TypeError('fetch failed'), new Date());
  assert.equal(result.kind, 'unknown');
  assert.ok(result.message.length > 0);
});

test('describeHandleChangeError: idempotency_conflict is not mistaken for a cooldown', () => {
  const body = {
    error: {
      code: 'idempotency_conflict',
      message: 'this key was used for a different request',
      details: [],
      request_id: '01J8Z6R2F3M4N5P6Q7R8S9T0V1',
    },
  };
  const error = new ApiError(409, body);

  const result = describeHandleChangeError(error, new Date());

  assert.equal(result.kind, 'unknown');
});
