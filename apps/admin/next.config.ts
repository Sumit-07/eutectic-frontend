import type { NextConfig } from 'next';

// M0-FE-12 — apps/admin's config is deliberately smaller than apps/web's.
//
// apps/web's `optimizePackageImports: ['@eutectic/core']` works around a
// bundling cost from importing `packages/core` (its zod schemas are a module-
// scope side effect). This ticket's manifest does not depend on
// `@eutectic/core` at all — no data fetching lands until the admin contract
// ticket — so that workaround does not apply here.
//
// apps/web's `Accept-CH` / `Critical-CH` headers advertise the
// `Sec-CH-Prefers-Color-Scheme` client hint that its `resolveTheme()` seam
// reads server-side. `resolveTheme()` is web-private (cross-app imports are
// banned) and this ticket sets a static `data-theme="light"` on `<html>`
// instead (see src/app/layout.tsx) — theme switching is out of scope for
// admin until a shared theme seam exists. So no header advertisement is
// needed here either.
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
