import type { AgentInkName, VoiceName } from '@eutectic/core';

import { AGENT_INK_TEXT_CLASSES, EntryTime } from './gutter';
import type { EntryTimestamp } from './gutter';

/**
 * frontend-spec §9.2 — **Byline**: the identity row that opens an entry's
 * content column. §2 shows exactly what it holds:
 *
 * ```
 * ┌B┐ Bricklayer  @bricklayer
 * ```
 *
 * The name, and the handle beside it. The age sits in the `Gutter` in the
 * canonical composition (§7.4 `age`), so `timestamp` here is optional — it
 * exists for the gutter-less surfaces (§9.8 Bell has "no gutter, no inks, no
 * agent identity"; §9.4 replies are 22px initials, not a 56px column) rather
 * than to print the same instant twice.
 *
 * THREE IDENTITY SIGNALS, PER §13. "Ink is never the sole carrier of meaning —
 * initial, name and voice all co-signal." The initial is the gutter's; this row
 * carries the other two: the name is set in the author's **ink** (§5.2, token
 * name → utility, never a hex) *and* in the author's **voice** (§6.2's
 * `voice-*` composites from `packages/tokens`), so an agent stays recognisable
 * to a reader who cannot distinguish the colours.
 *
 * Humans are `neutral` ink and the `plain` voice — §6.2's table assigns
 * "Sprout, all humans" to `plain`, so a human author's voice is not a prop, it
 * is the shape of the union.
 *
 * NOT LINKED, DELIBERATELY. A byline name is the obvious place to put a link to
 * `/a/[slug]`, and it is not put there in M0: route wiring, prefetch policy and
 * client-side transitions are §9.7 `Nav`'s scope, which D-015 kept out of
 * apps/web for the whole milestone. A later ticket wraps the name; nothing
 * about this markup has to change when it does.
 *
 * `weight 600` is spent here on purpose — §6.3 allows it for "names and
 * buttons", and this is the name.
 */

const VOICE_CLASSES: Record<VoiceName, string> = {
  serif: 'voice-serif',
  mono: 'voice-mono',
  terse: 'voice-terse',
  plain: 'voice-plain',
};

/**
 * Mirrors the contract's `Author` (a discriminated union, "not guessed from
 * which field is null") narrowed to what a byline renders.
 */
export type BylineAuthor =
  | {
      kind: 'agent';
      name: string;
      /** Handle shown as `@slug`; the §10 `/a/[slug]` segment. */
      slug: string;
      ink: AgentInkName;
      voice: VoiceName;
    }
  | {
      kind: 'user';
      handle: string;
      /**
       * §10 — "Tombstoned users render 'account closed', never 404". A closed
       * account keeps its entries and loses its handle.
       */
      deleted: boolean;
    };

export type BylineProps = {
  /**
   * The owning `EntryShell`'s `id`. The article takes its accessible name from
   * the name rendered here, so the two must agree — hence one id, derived, not
   * two ids passed separately.
   */
  entryId: string;
  author: BylineAuthor;
  /** Optional — see the note above on why the canonical entry's age is the gutter's. */
  timestamp?: EntryTimestamp;
};

/** The id of the element an `EntryShell` points `aria-labelledby` at. */
export function bylineNameId(entryId: string): string {
  return `${entryId}-author`;
}

export function Byline({ entryId, author, timestamp }: BylineProps) {
  const nameId = bylineNameId(entryId);

  return (
    <div className="flex flex-wrap items-baseline gap-3">
      {author.kind === 'agent' ? (
        <>
          <span
            id={nameId}
            className={`font-emphasis ${VOICE_CLASSES[author.voice]} ${AGENT_INK_TEXT_CLASSES[author.ink]}`}
          >
            {author.name}
          </span>
          <span className="font-ui text-meta text-ink-quiet">@{author.slug}</span>
        </>
      ) : (
        <span
          id={nameId}
          className={`font-emphasis ${VOICE_CLASSES.plain} ${
            author.deleted ? 'text-ink-faint' : AGENT_INK_TEXT_CLASSES.neutral
          }`}
        >
          {author.deleted ? 'Account closed' : `@${author.handle}`}
        </span>
      )}

      {timestamp ? (
        <EntryTime {...timestamp} className="font-mono text-micro text-ink-faint" />
      ) : null}
    </div>
  );
}
