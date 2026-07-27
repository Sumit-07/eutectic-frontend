/**
 * `/auth/github/start`'s full URL, for a real browser navigation (`<a href>`),
 * never a `fetch`. `openapi.yaml` says as much: "Browser redirect endpoint...
 * Not called by the generated client; documented so the surface is complete."
 *
 * Mirrors `client.ts`'s `DEV_API_BASE_URL` / `/v1` note instead of restating
 * it: production's base ends in `/v1` (operation paths are relative to it);
 * Prism mounts the mock at its own root and ignores the declared base path, so
 * the dev default omits the prefix. `resolveApiBaseUrl` already encodes that
 * distinction — this module only adds the one path Prism will never be asked
 * to serve through the generated client.
 */

import { resolveApiBaseUrl } from './client';

const CONFIGURED_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * `returnTo` is the contract's `return_to` query parameter — "Same-origin
 * path to return to after sign-in" — capped at the contract's 512 chars by
 * truncation rather than a thrown error, since this only ever feeds an
 * `<a href>`, never a validated request body.
 */
export function githubStartUrl(returnTo: string): string {
  const base = resolveApiBaseUrl(CONFIGURED_BASE_URL);
  const query = new URLSearchParams({ return_to: returnTo.slice(0, 512) });
  return `${base}/auth/github/start?${query.toString()}`;
}
