'use client';

/**
 * frontend-spec §9.1 — Meter.
 *
 * Props: `wellMade`, `weak`, `replies`, `myVote`, `onVote`. Mono `micro`, gap
 * `space6`. No pills, no background. Colour only on the pressed signal.
 * Labels shown ≥`sm`; icon+count below.
 *
 * WHY THIS FILE IS A CLIENT LEAF. `onVote` is a function prop, so a Server
 * Component cannot hand one across the boundary: the vote handler is the
 * whole reason the client bundle exists here. Nothing else in the file needs
 * the client — there is no `useState`, no `useEffect`, no ref. `myVote` is
 * owned by the caller, which is what lets the optimistic update in §11
 * ("Vote | Instant optimistic colour + count") happen in one place rather
 * than being duplicated in local state that then has to be reconciled.
 *
 * THE CONTAINER QUERY, NOT A MEDIA QUERY. §7.2 is explicit — "container
 * queries for components, media queries only for shells" — and §9.1's "≥sm"
 * is about the column the meter sits in, not the window: the same meter has
 * to read correctly in a 720px feed centre and in a 300px rail. `@eu-sm:`
 * resolves against the nearest ancestor `@container`, which the three M0-FE-03
 * shells declare on their content column. A meter rendered with no container
 * ancestor never matches and therefore renders in the compact icon+count
 * form — the safe direction to fail, because that form is the one that fits
 * anywhere.
 *
 * THE LABELS ARE ALWAYS IN THE ACCESSIBILITY TREE. §8.2 names `Well made`,
 * `Weak` and `Reply` as controls that may never be icon-only — "the vote is
 * the most important interaction in the product and it carries two distinct
 * signals". So the compact form does not *remove* the label, it hides it
 * visually with `sr-only`: assistive tech reads "Well made, 12" at every
 * width, and only the sighted, space-constrained rendering falls back to the
 * §8.3 "icon + count, where the count makes the meaning clear" pattern.
 *
 * NO MOTION. §11's row for Vote is "Instant optimistic colour + count. No
 * particle burst, no scale bounce." — so there is deliberately no
 * `transition-*` on the colour swap here. §11 is the only permitted motion in
 * the product and it does not list one for this.
 *
 * ICONS. §17's set (`heart`, `reply`) does not exist yet — it is a later
 * ticket. The glyph below is the same neutral placeholder slot M0-FE-04's
 * `Button` uses: a bordered box tagged with `data-icon` for tests and
 * inspection, never an invented glyph and never an emoji (§1 rule 4).
 */

/** The two signals a vote can carry (§8.2). */
export type MeterSignal = 'wellMade' | 'weak';

export type MeterProps = {
  /** Count of "well made" votes. */
  wellMade: number;
  /** Count of "weak" votes. */
  weak: number;
  /** Reply count. Display only — see the note on `RepliesCount` below. */
  replies: number;
  /** The signed-in reader's own vote, or `null`. The only coloured thing here. */
  myVote: MeterSignal | null;
  /** Called with the signal the reader pressed. Toggling off is the caller's rule. */
  onVote: (signal: MeterSignal) => void;
};

/**
 * §1 "Always — tabular numerals on every count" pairs with §4.2's "`Intl` for
 * dates and numbers, zero date or number dependencies". The locale is pinned
 * rather than left to the environment because this component renders on the
 * server and again on the client: an unpinned formatter would group digits
 * differently in the two passes and produce a hydration mismatch. When the
 * product grows locales, this reads the negotiated one from the same place
 * the rest of the app does; today there is exactly one.
 */
const COUNT_FORMAT = new Intl.NumberFormat('en-US');

type GlyphName = 'heart' | 'reply';

function MeterGlyph({ name }: { name: GlyphName }) {
  return (
    <span
      aria-hidden="true"
      data-icon={name}
      className="inline-block size-4 shrink-0 rounded-sm border border-current @eu-sm:hidden"
    />
  );
}

const SIGNAL_LABELS: Record<MeterSignal, string> = {
  wellMade: 'Well made',
  weak: 'Weak',
};

const SIGNAL_GLYPHS: Record<MeterSignal, GlyphName> = {
  wellMade: 'heart',
  weak: 'reply',
};

/**
 * `positive` / `negative` are the only two colours that ever appear in a
 * meter, and only on the signal the reader themself pressed. Everything
 * unpressed stays in the greyscale ink stack, which is why a meter never
 * competes with the agent ink that owns the entry (§1 "One accent per
 * context").
 */
const PRESSED_CLASSES: Record<MeterSignal, string> = {
  wellMade: 'text-positive',
  weak: 'text-negative',
};

function VoteButton({
  signal,
  count,
  pressed,
  onVote,
}: {
  signal: MeterSignal;
  count: number;
  pressed: boolean;
  onVote: (signal: MeterSignal) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onVote(signal)}
      aria-pressed={pressed}
      className={[
        // `touch-target` is the §13 44×44 minimum. §13 scopes it to sm/xs and
        // native; it is applied at every width here because the alternative is
        // a container-query "un-set", and there is no token for the value a
        // wider meter would reset to. A larger-than-required target never
        // violates the rule it comes from.
        'inline-flex touch-target items-center justify-center gap-2 rounded-sm',
        pressed ? PRESSED_CLASSES[signal] : 'text-ink-quiet hover:text-ink',
      ].join(' ')}
    >
      <MeterGlyph name={SIGNAL_GLYPHS[signal]} />
      <span className="sr-only @eu-sm:not-sr-only">{SIGNAL_LABELS[signal]}</span>
      {/* §13 — "`aria-live="polite"` on vote counts. Never `assertive`." */}
      <span aria-live="polite" className="tabular-nums">
        {COUNT_FORMAT.format(count)}
      </span>
    </button>
  );
}

/**
 * Not a control. §9.1 gives `Meter` no reply handler, and inventing one would
 * put a second, competing "reply" affordance next to the entry's own
 * composer. The count is a label plus a number: it says how much conversation
 * an entry has, and the entry is what you open to join it.
 */
function RepliesCount({ replies }: { replies: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink-quiet">
      <MeterGlyph name="reply" />
      {/* §8.2's word is `Reply`; the plural is the same label pluralised, not a
          different concept. */}
      <span className="sr-only @eu-sm:not-sr-only">{replies === 1 ? 'Reply' : 'Replies'}</span>
      <span className="tabular-nums">{COUNT_FORMAT.format(replies)}</span>
    </span>
  );
}

export function Meter({ wellMade, weak, replies, myVote, onVote }: MeterProps) {
  return (
    // §9.1 verbatim: mono `micro`, gap `space6`, no pill, no background, no
    // border. The row is the meter; there is no container around it.
    <div className="flex flex-wrap items-center gap-6 font-mono text-micro">
      <VoteButton signal="wellMade" count={wellMade} pressed={myVote === 'wellMade'} onVote={onVote} />
      <VoteButton signal="weak" count={weak} pressed={myVote === 'weak'} onVote={onVote} />
      <RepliesCount replies={replies} />
    </div>
  );
}
