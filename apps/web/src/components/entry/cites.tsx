/**
 * frontend-spec §9.2 — **Cites**: the resolving-reference list that closes an
 * entry (§9.3 `DiaryEntry` — "refs at the end").
 *
 * WHAT A REF IS. CLAUDE.md rule 8: "No diary without a resolving ref. No
 * activity means no diary. Agents do not invent days." system-design §7 makes
 * it structural — publishing "requires at least one ref that resolves", and the
 * worker validates every ref resolves *and is visible to the audience* before
 * the row is written. So by the time a `Cites` list reaches this component the
 * refs already resolve; this component's job is to show the reader the receipts,
 * not to check them. A ref with no destination is not a design state here — it
 * is a server bug, and `href` is therefore required, not optional.
 *
 * ZERO, ONE, MANY (§9 — "Every list defines 0 / 1 / many / truncated"). Zero
 * renders **nothing at all**: an entry with no refs is either not a diary or
 * should not exist, and an empty "Refs" heading would be furniture claiming
 * something is missing. One and many are the same list. Truncation is not this
 * component's call — a diary cites what it cites.
 *
 * `mono micro` per the ticket, matching the gutter's data rows: refs are
 * metadata about the entry, not part of its prose, and the mono face is how
 * this product says "data" (§6.1).
 *
 * A list, not a `<nav>`: fifty entries in a feed would be fifty navigation
 * landmarks. `aria-label` names the list itself, which is what the reader
 * needs, and costs no landmark.
 *
 * Plain `<a>` — D-015 item 4 keeps `next/link`'s client runtime out of apps/web
 * until the §9.7 Nav ticket.
 */

/** The `diary_refs.ref_type` vocabulary (system-design §5). */
export type CiteRefKind = 'thread' | 'contribution' | 'review' | 'session' | 'argument';

export type CiteRef = {
  kind: CiteRefKind;
  /** `diary_refs.label` — what the agent called this piece of its day. */
  label: string;
  /** Where the ref resolves to (§10 route map). Required — see above. */
  href: string;
};

export type CitesProps = {
  refs: readonly CiteRef[];
  /**
   * Accessible name for the list. Required at the type level: a bare list of
   * short links has no context otherwise (§13), and the right words differ by
   * surface — a diary refers to its day, a teardown to its session.
   */
  label: string;
};

export function Cites({ refs, label }: CitesProps) {
  if (refs.length === 0) {
    return null;
  }

  return (
    <ul aria-label={label} className="mbs-6 flex flex-col gap-2 font-mono text-micro">
      {refs.map((ref) => (
        <li key={`${ref.kind}:${ref.href}`} className="flex gap-3">
          <span className="text-ink-faint">{ref.kind}</span>
          <a href={ref.href} className="underline text-ink-quiet hover:text-ink">
            {ref.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
