/**
 * The one place apps/web constructs an API client (M0-FE-08).
 *
 * frontend-spec §4.1: "API client — generated from `contracts/openapi.yaml`.
 * Never hand-write a fetch." That is satisfied *by construction* here, not by
 * convention: `@eutectic/contracts` already generates the typed client from the
 * spec (`pnpm --filter @eutectic/contracts generate`, deterministic, staleness
 * gated by `scripts/check-contract-freshness.mjs`) and publishes it on the
 * `./client` subpath. This module does not re-implement, wrap or proxy it — it
 * only supplies the two pieces of configuration a browser deployment owns:
 *
 *   1. `baseUrl`  — where the API lives, from the environment.
 *   2. `credentials: 'include'` — the session-cookie mode (see below).
 *
 * There is deliberately no `fetch` here and no second fetch layer around the
 * generated one. If you find yourself needing a request this module cannot
 * express, the fix is a contract change in eutectic-shared, never a fetch call
 * in apps/web.
 *
 * ── Session cookie mode ────────────────────────────────────────────────────
 * system-design §11 / frontend-spec §4.1: the session is an httpOnly cookie set
 * by the API. `credentials: 'include'` makes the browser attach it on
 * cross-origin API calls (apps/web and apps/api are separate deployables, so
 * every call is cross-origin in production). No token is ever read, held or
 * stored by JavaScript — not in `localStorage`, not in `sessionStorage`, not in
 * a module variable — which is why there is no `setToken`/`getToken` on this
 * surface and never should be. `@eutectic/contracts`' runtime already defaults
 * to `include`; it is passed explicitly anyway so the mode is visible at the
 * one place a reviewer looks, and so a runtime default change cannot silently
 * log everyone out.
 *
 * ── Accept header ──────────────────────────────────────────────────────────
 * `application/vnd.staffroom.v1+json` is set on *every* request by the
 * contracts runtime (`createRequester`), before any caller-supplied header, and
 * `extraHeaders` is documented there as "never for `Accept`". `test/accept-header.test.mjs`
 * proves it through this module with a fetch stub rather than trusting the
 * comment.
 */

import { createClient } from '@eutectic/contracts/client';
import type { EutecticClient } from '@eutectic/contracts/client';
import type { FetchLike } from '@eutectic/contracts';

/**
 * Dev default: the Prism mock from `packages/contracts`
 * (`pnpm --filter @eutectic/contracts mock`, or `pnpm --filter @eutectic/web mock`).
 * Running with no environment at all should talk to the contract, not to a
 * half-built API.
 *
 * The version prefix is *absent* here on purpose, and this is the one place the
 * two environments differ. `openapi.yaml` declares its servers with a `/v1`
 * path (`http://127.0.0.1:4010/v1`, `http://127.0.0.1:4000/v1`) and operation
 * paths are relative to it (`/feed`, never `/v1/feed`), so the real API's base
 * URL ends in `/v1`. Prism mounts operation paths at the server *root* and
 * ignores the declared base path: `GET /feed` answers 200 on the mock and
 * `GET /v1/feed` answers 404. Encoding that here — rather than pretending
 * otherwise and having every request 404 — is what makes the default actually
 * work. For local `apps/api`, set
 * `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000/v1`.
 */
export const DEV_API_BASE_URL = 'http://127.0.0.1:4010';

/**
 * Read at module scope, never at call sites: `NEXT_PUBLIC_API_BASE_URL` is
 * inlined by Next at build time only where it is written out literally, and a
 * base URL spelled inline in a component is exactly the hardcoding this module
 * exists to prevent.
 */
const CONFIGURED_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ApiClientOptions {
  /** Overrides the environment. Tests and the mock smoke test pass this. */
  baseUrl?: string;
  /** Overrides the ambient `fetch`. Tests pass a stub; nothing else should. */
  fetch?: FetchLike;
}

/** Trims a trailing slash so `${baseUrl}${path}` never doubles it. Exported for the test. */
export function resolveApiBaseUrl(configured: string | undefined): string {
  const trimmed = configured?.trim();
  if (trimmed === undefined || trimmed.length === 0) {
    return DEV_API_BASE_URL;
  }
  return trimmed.replace(/\/+$/, '');
}

/** A fresh client. Prefer {@link getApiClient} unless you are overriding something. */
export function createApiClient(options: ApiClientOptions = {}): EutecticClient {
  return createClient({
    baseUrl: options.baseUrl ?? resolveApiBaseUrl(CONFIGURED_BASE_URL),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    credentials: 'include',
  });
}

let cached: EutecticClient | undefined;

/**
 * The app-wide client. Memoised because construction binds `fetch` and the
 * base URL once; it holds no request state, no token and no cache, so one
 * instance per runtime is correct on the server and in the browser alike.
 */
export function getApiClient(): EutecticClient {
  cached ??= createApiClient();
  return cached;
}
