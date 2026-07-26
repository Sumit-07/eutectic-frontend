/**
 * frontend-spec §9.1 — Skeleton. §12 — "Loading is skeletons matching final
 * layout … Spinners only inside a button", and §1 rule 14 bans a spinner as
 * the loading state for a list.
 *
 * Props: `lines?`, `width?`, `height`. `height` is required and has no
 * default, on purpose.
 *
 * ── THE PAIRING RULE ──────────────────────────────────────────────────────
 * A skeleton is only correct if it is EXACTLY as tall as the thing it stands
 * in for. §14 budgets CLS at ≤ 0.02, and a skeleton is the single largest
 * opportunity in the product to blow that: it is, by definition, the box that
 * is about to be replaced by real content. So:
 *
 *   Every place a skeleton is defined, it names the type scale or space token
 *   of the content it replaces, and it is defined NEXT TO that content —
 *   ideally in the same file — so the two cannot drift apart in review.
 *
 *   <Skeleton height="body" lines={3} />   replaces three lines of §6.3 `body`
 *   <Skeleton height="body-serif" />       replaces one line of diary prose
 *   <Skeleton height="space-10" />         replaces the §7.4 56px gutter block
 *
 * That is why `height` is a token NAME and not a CSS length. A length would
 * let a caller type a number that is nearly right; a token name can only be
 * one of the values the real content itself is built from. In text mode the
 * bar is `1lh` tall — one line box of the named scale, leading included — so
 * `lines={3}` at `height="body"` is precisely the height of a three-line
 * `body` paragraph, not an approximation of it.
 *
 * ── RSC ───────────────────────────────────────────────────────────────────
 * No `'use client'`, no hooks, no handlers: a skeleton is markup plus CSS.
 * It is the loading state for streaming RSC, so shipping client JS to render
 * one would be self-defeating — the JS would arrive after the content it was
 * covering for. The shimmer is a CSS animation declared once in globals.css
 * (§11: 1.4s linear) and applied through `motion-safe:`, so under
 * `prefers-reduced-motion: reduce` the animation is never applied at all and
 * the bar is simply static (§11 "static under reduced-motion", §1 "Always").
 *
 * ── ACCESSIBILITY ─────────────────────────────────────────────────────────
 * The skeleton itself is decorative and `aria-hidden`. The REGION that is
 * loading carries the state — `aria-busy="true"` on the container that will
 * receive the content — because that is the element assistive tech is
 * already tracking. A skeleton that announced itself would announce the same
 * nothing three times per paragraph.
 */

/** One line box of a §6.3 type scale — the height of the text being replaced. */
type TextHeight =
  | 'display'
  | 'title'
  | 'head'
  | 'idea'
  | 'body-serif'
  | 'body'
  | 'body-mono'
  | 'label'
  | 'meta'
  | 'micro';

/** A block sized by a §5.4 space token — avatars, gutter blocks, meter rows. */
type BlockHeight = 'space-6' | 'space-7' | 'space-8' | 'space-9' | 'space-10' | 'space-11';

export type SkeletonHeight = TextHeight | BlockHeight;

/**
 * Fractions of the container, not lengths: the real content's line breaks
 * depend on its own measure, so a skeleton's width is a proportion of the
 * column it sits in and nothing else.
 */
export type SkeletonWidth = 'full' | '3/4' | '2/3' | '1/2' | '1/3' | '1/4';

export type SkeletonProps = {
  /** Height of the content being replaced, named by its token. Required. */
  height: SkeletonHeight;
  /** Number of line boxes. Text heights only; a block height is one box. */
  lines?: number;
  /**
   * Inline size of the LAST line — the one that ends mid-sentence in real
   * prose. Earlier lines are always full width, which is what makes a
   * multi-line skeleton read as a paragraph rather than as a bar chart.
   */
  width?: SkeletonWidth;
};

const TEXT_HEIGHT_CLASSES: Record<TextHeight, string> = {
  display: 'text-display',
  title: 'text-title',
  head: 'text-head',
  idea: 'text-idea',
  'body-serif': 'text-body-serif',
  body: 'text-body',
  'body-mono': 'text-body-mono',
  label: 'text-label',
  meta: 'text-meta',
  micro: 'text-micro',
};

const BLOCK_HEIGHT_CLASSES: Record<BlockHeight, string> = {
  'space-6': 'h-6',
  'space-7': 'h-7',
  'space-8': 'h-8',
  'space-9': 'h-9',
  'space-10': 'h-10',
  'space-11': 'h-11',
};

const WIDTH_CLASSES: Record<SkeletonWidth, string> = {
  full: 'w-full',
  '3/4': 'w-3/4',
  '2/3': 'w-2/3',
  '1/2': 'w-1/2',
  '1/3': 'w-1/3',
  '1/4': 'w-1/4',
};

function isTextHeight(height: SkeletonHeight): height is TextHeight {
  return height in TEXT_HEIGHT_CLASSES;
}

/*
 * The visible bar is inset from its box with `p-1` + `bg-clip-content`
 * instead of being separated from its neighbours with a gap or a margin.
 * Preflight puts every element in `border-box`, so padding is taken OUT of
 * the declared height rather than added to it: the box stays exactly one line
 * box tall, the paint is 2px shorter top and bottom, and consecutive lines
 * read as separate bars while the stack's total height stays exactly
 * `lines × 1lh`. A gap would have made the skeleton taller than the text.
 *
 * No radius: §1 rule 7 spends radius on inputs/buttons (2px) and containers
 * (3px), and a skeleton bar is neither.
 */
const BAR_CLASSES = 'bg-paper-sink bg-clip-content p-1 motion-safe:animate-shimmer';

export function Skeleton({ height, lines = 1, width = 'full' }: SkeletonProps) {
  if (!isTextHeight(height)) {
    // Block mode: one box of a space token. `lines` is meaningless here — a
    // gutter block or an avatar has no line boxes to repeat.
    return (
      <div
        aria-hidden="true"
        className={[BAR_CLASSES, BLOCK_HEIGHT_CLASSES[height], WIDTH_CLASSES[width]].join(' ')}
      />
    );
  }

  return (
    // The type scale lives on the wrapper so that `1lh` inside resolves
    // against the same font-size/line-height pair the real text will use.
    <div aria-hidden="true" className={TEXT_HEIGHT_CLASSES[height]}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <div
          key={index}
          className={[
            BAR_CLASSES,
            'block-lh',
            index === lines - 1 ? WIDTH_CLASSES[width] : WIDTH_CLASSES.full,
          ].join(' ')}
        />
      ))}
    </div>
  );
}
