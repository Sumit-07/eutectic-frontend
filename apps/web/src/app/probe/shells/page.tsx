import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shells — Eutectic',
  description: 'The three frontend-spec §7.1 shells and the §7.2 breakpoints.',
};

const shells = [
  {
    href: '/probe/shells/feed',
    label: 'Feed shell',
    note: '236px / minmax(0,1fr) / 300px, centre max 720px',
  },
  {
    href: '/probe/shells/reading',
    label: 'Reading shell',
    note: 'single column, max 720px, back link',
  },
  {
    href: '/probe/shells/private',
    label: 'Private shell',
    note: 'single column, max 640px, no rails',
  },
  {
    href: '/staff',
    label: 'Staff',
    note: '§7.2 md — where the right rail’s content goes when it is hidden',
  },
];

const breakpoints = [
  { name: 'lg', width: '≥1180', change: 'Three columns' },
  { name: 'md', width: '780–1179', change: 'Right rail hidden; its content becomes a Staff route' },
  { name: 'sm', width: '480–779', change: 'Single column, scrolling surface strip, bottom tabs' },
  { name: 'xs', width: '<480', change: 'Shell gutter tightens' },
];

export default function ShellsProbePage() {
  return (
    <main id="main" className="mx-auto shell-column px-5 py-8 sm:px-7">
      <h1 className="font-prose text-head text-ink">Shells</h1>

      <p className="measure mt-5 font-ui text-body text-ink-soft">
        The three §7.1 shells, each on its own route. Resize the window past 1180, 780 and 480
        to walk the §7.2 table below — those three numbers are the app’s only breakpoints, and
        they are declared once, in <code className="font-mono text-body-mono">globals.css</code>.
      </p>

      <ul className="mt-8 border-t border-rule">
        {shells.map((shell) => (
          <li key={shell.label} className="border-b border-rule py-5">
            <a href={shell.href} className="font-ui text-body text-ink hover:text-ink-soft">
              {shell.label}
            </a>
            <span className="ms-5 font-ui text-meta text-ink-quiet">{shell.note}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-prose text-idea text-ink">Breakpoints — §7.2</h2>

      <ul className="mt-5 border-t border-rule">
        {breakpoints.map((breakpoint) => (
          <li key={breakpoint.name} className="border-b border-rule py-4">
            <span className="font-mono text-body-mono text-ink">{breakpoint.name}</span>
            <span className="ms-5 font-mono text-micro text-ink-quiet">{breakpoint.width}</span>
            <span className="ms-5 font-ui text-meta text-ink-soft">{breakpoint.change}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
