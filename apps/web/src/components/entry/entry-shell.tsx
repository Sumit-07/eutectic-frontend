import type { ReactNode } from 'react';

import { bylineNameId } from './byline';

/**
 * frontend-spec §9.2 — **EntryShell**: the frame every entry in the product is
 * built in. §9.3's five surface entries (`DiaryEntry`, `ValidateEntry`,
 * `CodeEntry`, `TeardownEntry`, `ArgumentEntry`) differ only in what they put
 * *inside* this frame; the frame itself is §7.4, verbatim:
 *
 * ```
 * entry  padding: space7 space8 space6; borderBottom 1px rule
 * col    flex 1; minWidth 0; maxWidth 64ch
 * ```
 *
 * `pbs-7 px-8 pbe-6` is that padding shorthand in logical properties (§1
 * "Always"), `border-be border-rule` the hairline — 1px, never 2px — and
 * `flex-1 min-inline-0 measure` the content column. `min-inline-0` is what
 * stops a long unbroken token (a URL in a code span) from pushing the column
 * past its track.
 *
 * SLOTS, NOT CHILDREN-AND-HOPE. `gutter`, `byline`, `children` and `cites` are
 * separate props so the composition order §9.2 describes — gutter beside the
 * column; byline, body, refs down it — is the component's, not each caller's.
 * §9.3's "refs at the end" is then structurally true of every surface entry
 * anyone builds later.
 *
 * `<article>` per entry (§13). Its accessible name comes from the author name
 * `Byline` renders, addressed through the shared `bylineNameId` derivation — so
 * a screen reader's list of articles reads as a list of authors rather than
 * twenty identical "article"s. Nothing generates the id: `entryId` is passed in,
 * because a server component has no `useId` and a stable id is the caller's to
 * own anyway (it is the entity id).
 *
 * NO CARD. No border box, no radius, no shadow, no tint (§1 rows 2, 6, 7). An
 * entry is separated from the next one by a hairline and space, which is what
 * makes a feed read like a page rather than a stack of tiles.
 *
 * CONTAINER CONTEXT. `@container` here is what §4.2 asks for — "entry
 * components adapt to their column, not the viewport" — and is the context the
 * components that land inside an entry later (`Meter`'s labels below `sm`,
 * §9.1) query. The one adaptation this ticket owns, §7.2's xs gutter
 * tightening, is on `Gutter` and is documented there: no `--container-*` token
 * sits at 480, so it uses the app's `sm:` breakpoint until one does.
 *
 * HOVER is the only motion (§11 — "Hover on entry → background `paperHover`,
 * `dur1`"), and it is off under `prefers-reduced-motion` (§1 "Always").
 */

export type EntryShellProps = {
  /**
   * Stable id for this entry — the entity id, not a generated one. The
   * `Byline` inside must be given the same value.
   */
  entryId: string;
  /**
   * `<Gutter>` — §7.4's fixed column. Optional because §9.8 Bell is defined by
   * its absence ("no gutter, no inks, no agent identity"): the content column
   * then simply fills the entry, and Bell cannot accidentally grow one.
   */
  gutter?: ReactNode;
  /** `<Byline>` — the identity row. */
  byline: ReactNode;
  /** The body: `<Prose>`, or a surface-specific composition (§9.3). */
  children: ReactNode;
  /** `<Cites>` — refs at the end. Omitted when the entry has none. */
  cites?: ReactNode;
};

export function EntryShell({ entryId, gutter, byline, children, cites }: EntryShellProps) {
  return (
    <article
      id={entryId}
      aria-labelledby={bylineNameId(entryId)}
      className="@container flex border-be border-rule pbs-7 px-8 pbe-6 transition-colors dur-1 hover:bg-paper-hover motion-reduce:transition-none"
    >
      {gutter}

      <div className="min-inline-0 flex-1 measure">
        {byline}
        {/* The one spacing decision §7.4 does not make: the byline row and the
            body are separate blocks, so they get a space-4 gap from the §5.4
            scale. `Cites` carries its own larger gap (space-6) because refs are
            an appendix to the entry, not another paragraph of it. */}
        <div className="mbs-4">{children}</div>
        {cites}
      </div>
    </article>
  );
}
