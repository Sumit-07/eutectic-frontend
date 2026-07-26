import type { Metadata } from 'next';

import { ReadingShell } from '../../../components/shells/reading-shell';

import { ENTRY_FIXTURES, FixtureEntry } from './entry-fixtures';

export const metadata: Metadata = {
  title: 'Entry system — Eutectic',
  description: 'frontend-spec §9.2 — EntryShell, Gutter, Byline, Prose, Cites, in the reading shell.',
};

/*
 * M0-FE-06 — the §9.2 entry system, rendered from `ProseBlock[]` fixtures in
 * the §7.1 reading shell, in both themes.
 *
 * There is no client JS on this route and there is no way for this route to
 * acquire any: every component it renders is a server component and the whole
 * page is static markup (D-012 — app-authored JS for this ticket is 0KB).
 *
 * Both themes on one page: `tokens.css` scopes the dark palette to
 * `[data-theme='dark']`, on any element rather than only on `<html>`, so the
 * second section below flips its whole subtree without a layout change, without
 * a toggle, and without touching the theme resolution the root layout owns
 * (M0-FE-09's ticket, not this one).
 */

export default function EntryProbePage() {
  const now = new Date();

  return (
    <ReadingShell back={{ href: '/probe', label: 'Back to the probes' }}>
      <h1 className="font-prose text-head text-ink">Entry system</h1>

      <p className="measure mbs-5 font-ui text-body text-ink-soft">
        EntryShell · Gutter · Byline · Prose · Cites (§9.2), each entry rendered from the structured
        prose the API returns — paragraphs, code blocks and the five inline span kinds. No markdown
        engine exists anywhere in this product.
      </p>

      <p className="measure mbs-4 font-ui text-body text-ink-soft">
        The same eight fixtures run twice below: once in the light theme, once in the dark. The{' '}
        <a href="/probe/entry/private" className="underline text-ink hover:text-ink-soft">
          private-shell variant
        </a>{' '}
        shows the gutter-less form (§9.8) and the byline’s own timestamp.
      </p>

      <section className="mbs-9">
        <h2 className="font-prose text-idea text-ink">Light</h2>
        <div className="mbs-5">
          {ENTRY_FIXTURES.map((fixture) => (
            <div key={fixture.id}>
              <p className="px-8 pbs-6 font-ui text-meta text-ink-quiet">{fixture.note}</p>
              <FixtureEntry fixture={fixture} now={now} />
            </div>
          ))}
        </div>
      </section>

      <section data-theme="dark" className="mbs-9 bg-paper text-ink">
        <h2 className="pbs-7 px-8 font-prose text-idea text-ink">Dark</h2>
        <div className="mbs-5">
          {ENTRY_FIXTURES.map((fixture) => (
            <div key={fixture.id}>
              <p className="px-8 pbs-6 font-ui text-meta text-ink-quiet">{fixture.note}</p>
              <FixtureEntry fixture={fixture} now={now} idSuffix="-dark" />
            </div>
          ))}
        </div>
      </section>
    </ReadingShell>
  );
}
