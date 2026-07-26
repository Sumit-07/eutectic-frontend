import type { ReactNode } from 'react';

/*
 * SD §12 — the eight admin surfaces. `/distress` is listed first: SD §12
 * calls it "the highest priority queue in the product," and this ticket's
 * acceptance criteria name it first in nav explicitly.
 */
const SURFACES = [
  { href: '/distress', label: 'Distress' },
  { href: '/kill-switch', label: 'Kill switch' },
  { href: '/review-queue', label: 'Review queue' },
  { href: '/reports', label: 'Reports' },
  { href: '/tone-policy', label: 'Tone policy' },
  { href: '/proposals', label: 'Proposals' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/projections', label: 'Projections' },
] as const;

/*
 * M0-FE-12 — the admin shell. Server component; plain <a> links, not
 * next/link — same D-015 ruling apps/web's shells follow (the ~3KB
 * next/link client runtime buys nothing at M0, and client-side transitions
 * are a later ticket's explicit scope). Tokens-only styling throughout.
 */
export function AdminShell({ children, devBypass }: { children: ReactNode; devBypass: boolean }) {
  return (
    <div className="p-8">
      <header className="border-b border-rule-strong pb-5">
        <h1 className="font-prose text-title text-ink">Eutectic Admin</h1>
        {devBypass ? (
          <p className="mt-3 font-mono text-meta text-caution">
            DEV_BYPASS active — this is not real authentication. See src/app/(admin)/layout.tsx.
          </p>
        ) : null}
      </header>

      <nav aria-label="Admin surfaces" className="mt-7 border-b border-rule pb-7">
        <ul className="flex flex-wrap gap-7">
          {SURFACES.map((surface) => (
            <li key={surface.href}>
              <a href={surface.href} className="font-ui text-label text-ink-soft hover:text-ink">
                {surface.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="mt-7">{children}</main>
    </div>
  );
}
