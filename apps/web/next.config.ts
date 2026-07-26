import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // M0-FE-08 / D-012 — app-authored JS on any route that imports `@eutectic/core`.
  //
  // `packages/core` has no `export *` (it names every symbol, per its own header
  // comment) but it is still a single entry module, and its entry pulls in the
  // zod composer schemas. Those schemas call `z.string().regex(...)` at module
  // scope, which webpack must treat as a side effect, so importing one pure
  // function — `encodeCursor`, for the §4.4 feed key — dragged the whole of zod
  // into the client bundle: /probe/api measured 133KB first load, i.e. 30KB
  // app-authored, over §14's 25KB per-route ceiling.
  //
  // `optimizePackageImports` is Next's built-in remedy: at build time it rewrites
  // `import { encodeCursor } from '@eutectic/core'` to a direct import of the
  // module that defines it, so the unreferenced siblings are never in the graph.
  // No new dependency, no source change in eutectic-shared, no import site
  // reaching past a package's public entry point. Measured: 133KB → 117KB first
  // load on /probe/api (30KB → 14KB app-authored), every other route unchanged
  // at the 103KB framework baseline; `ZodError` no longer appears in any client
  // chunk.
  //
  // The permanent fix belongs in the shared package — `"sideEffects": false` in
  // `packages/core/package.json`, which would let webpack drop those modules
  // unaided — but that is Fable's file (CLAUDE.md rule 3), so it is reported,
  // not reached into. `@eutectic/contracts` was measured in this list too and
  // changed nothing, so it is not listed: this is the one package that needed it.
  experimental: {
    optimizePackageImports: ['@eutectic/core'],
  },

  // frontend-spec §5.3 — the theme is resolved server-side, including the
  // OS-preference step. Advertising the client hint here is what makes that
  // possible without any client JS: `Accept-CH` asks the browser to send
  // `Sec-CH-Prefers-Color-Scheme` on subsequent requests, and `Critical-CH`
  // makes it retry the very first document request with the hint attached,
  // so the first painted HTML already carries the right `data-theme`.
  // Browsers that do not implement the hint simply fall through to light.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Accept-CH', value: 'Sec-CH-Prefers-Color-Scheme' },
          { key: 'Critical-CH', value: 'Sec-CH-Prefers-Color-Scheme' },
        ],
      },
    ];
  },
};

export default nextConfig;
