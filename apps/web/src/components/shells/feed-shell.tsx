import type { ReactNode } from 'react';

/**
 * frontend-spec §7.1 — **Feed shell**: `236px / minmax(0,1fr) / 300px`, centre
 * column capped at 720px. Used by every feed.
 *
 * Responsive behaviour is §7.2, and §7.2 alone. Media queries live in shells;
 * components use container queries, which is why the centre column declares
 * itself a container context and why nothing here sets `overflow` or `contain`
 * on an ancestor of `children`.
 *
 *   lg ≥1180    three columns
 *   md 780–1179 right rail hidden, its content reachable at `/staff`
 *   sm 480–779  single column, the surface strip scrolls horizontally,
 *               bottom tab bar appears
 *   xs <480     shell-level tightening only: the page gutter narrows
 *
 * There is no hamburger, at any width, ever (§7.2): the horizontally scrolling
 * surface strip *is* the navigation.
 *
 * This is a layout component. The three §9.7 shell components that fill it —
 * `Nav`, `RightRail`, `MobileTabs` — are separate tickets; until they land the
 * shell renders plain structural containers over the items it is handed, with
 * no active indicator, no counts and no icons.
 *
 * Every link here is a plain `<a>`, not `next/link`. `next/link` is a client
 * component: importing it costs ~3KB of router JS on the first load of every
 * route that renders a shell, measured, and D-012 ratchets the framework
 * baseline at 103KB. A shell is on every page, so it is the worst possible
 * place to spend that quietly. Whether the product wants client-side
 * transitions is a real decision with a real price and belongs to the §9.7
 * `Nav` ticket, taken deliberately — not inherited from a layout container.
 */

/**
 * A placeholder nav entry. Replaced by the §9.7 `Nav`/`MobileTabs` models.
 *
 * `label` is the React key, not `href`: two entries may legitimately point at
 * one route (a tab bar and a surface strip both reaching Bell, say) but two
 * entries with the same label would be a bug the reader can see.
 */
export type ShellNavItem = {
  href: string;
  label: string;
};

export type FeedShellProps = {
  /** §7.2 surface strip — the primary navigation. Vertical rail from md up. */
  surfaces: ShellNavItem[];
  /** §7.3 bottom tabs. Rendered below md only. */
  tabs: ShellNavItem[];
  /** §9.7 `RightRail` content. Rendered in the aside at lg; at `/staff` below. */
  rail: ReactNode;
  children: ReactNode;
};

/**
 * §7.2 md — "its content becomes a `Staff` nav route". One route, referenced by
 * the shell that hides the rail and by the page that re-homes it.
 */
export const STAFF_ROUTE = '/staff';

export function FeedShell({ surfaces, tabs, rail, children }: FeedShellProps) {
  return (
    <div>
      {/* §13 — skip link first in tab order. The nav precedes main in source
          order at every width, so this is the shell's job, not a page's. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-sticky focus:m-3 focus:bg-paper-raise focus:p-4 focus:text-label focus:font-ui focus:text-ink"
      >
        Skip to content
      </a>

      {/* xs <480 keeps the narrower gutter; sm and up gets the wider one. The
          grid is a single column until md — §7.2's "single column" — and gains
          its tracks from the two @utility rules in globals.css. */}
      <div className="grid gap-8 px-5 pb-10 sm:px-7 md:shell-grid-2 md:pb-0 lg:shell-grid-3">
        {/*
          Below md this is the §7.2 surface strip: one horizontal row that
          scrolls. `overflow-x` is scoped to that range with `max-md:` so it
          cannot become a containment trap for the component container queries
          that run at md and up.
        */}
        <nav
          aria-label="Surfaces"
          className="flex gap-5 border-b border-rule py-5 max-md:overflow-x-auto md:flex-col md:gap-3 md:border-b-0 md:py-8"
        >
          {surfaces.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-label font-ui whitespace-nowrap text-ink-soft hover:text-ink"
            >
              {item.label}
            </a>
          ))}

          {/*
            §7.2 md/sm/xs — the right rail is hidden, so its content has to stay
            reachable. It becomes a route in the primary nav, never a hamburger,
            never a drawer.
          */}
          <a
            href={STAFF_ROUTE}
            className="text-label font-ui whitespace-nowrap text-ink-soft hover:text-ink lg:hidden"
          >
            Staff
          </a>
        </nav>

        {/*
          §7.2 — "container queries for components". The centre column is the
          container context every entry-level component measures itself against,
          so it is declared here rather than by each page.
        */}
        <main id="main" className="@container py-8">
          <div className="shell-column">{children}</div>
        </main>

        {/* §7.1 right rail; §7.2 lg only. Its content lives on at STAFF_ROUTE. */}
        <aside aria-label="Staff" className="hidden py-8 lg:block">
          {rail}
        </aside>
      </div>

      {/*
        §7.2 sm and xs — bottom tab bar. Fixed, so the grid above reserves room
        for it with `pb-10` up to md. Text labels only here: an icon-only tab
        would need the §8.1 whitelist, and this is a placeholder (§8.3's
        icon + 10px label pairing is `MobileTabs`' ticket, not this one).
      */}
      <nav
        aria-label="Sections"
        className="fixed bottom-0 start-0 end-0 z-sticky border-t border-rule bg-paper md:hidden"
      >
        <ul className="flex justify-around">
          {tabs.map((item) => (
            <li key={item.label}>
              {/* py-5 keeps the target ≥44px tall on sm/xs (§13). */}
              <a
                href={item.href}
                className="block px-4 py-5 text-label font-ui text-ink-soft hover:text-ink"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
