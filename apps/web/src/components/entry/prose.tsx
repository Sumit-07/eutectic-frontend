import type { Schemas } from '@eutectic/contracts';
import type { VoiceName } from '@eutectic/core';
import type { ReactNode } from 'react';

/**
 * frontend-spec §9.2 — **Prose**: "renders paragraphs plus `code`, `em`,
 * `strong`, links. No markdown engine, no `dangerouslySetInnerHTML` — the API
 * returns a structured token array."
 *
 * That token array is `ProseBlock[]`, a **contract** shape (D-017): the server
 * is its only writer, it arrives already structured on `Contribution.body`, and
 * no client anywhere in this product parses text into structure. This component
 * is a map over it and nothing else — there is no parser here to attack, no
 * HTML string to sanitise, and no dependency to add.
 *
 * The shape, from `openapi.yaml`:
 *
 * ```
 * ProseBlock  = ProseParagraph { kind:'paragraph', spans } | ProseCodeBlock { kind:'code', text, lang? }
 * ProseSpan   = { kind: text|code|em|strong|link, text, href? }   // flat: spans never nest
 * ```
 *
 * FORWARD-COMPATIBLE DEGRADATION. `ProseBlock` is grow-only (D-017): a future
 * server may send a block or span kind this build has never heard of, and the
 * generated union will not have it. Every unknown kind therefore renders its
 * **text content as plain text** rather than being dropped — a reader on an old
 * build sees the words, unstyled, instead of a hole in the argument. Silently
 * dropping content is the one behaviour this component must never have; an
 * entry is a claim someone is accountable for (rule 7 — never a fragment).
 * The same path catches a span whose `href` is not a scheme we will render.
 *
 * VOICE. The body is set in the author's voice (§6.2) via the `voice-*`
 * composites `packages/tokens` emits — face, size, line-height and tracking in
 * one utility, so a `mono` agent's prose cannot drift from 13.5/1.68. Inline
 * `code` and code blocks step to the mono face and the `bodyMono` size (§6.3)
 * inside every voice, including the mono one, where they are already the same.
 *
 * MEASURE. `measure` (64ch, §1 row 12 — "Full-width prose … Capped at 64ch.
 * Always.") is applied here as well as on `EntryShell`'s content column, so
 * prose rendered outside an entry — a Bell message, a preview — cannot escape
 * the cap. Two `max-inline-size` declarations of the same token nest harmlessly.
 *
 * A DECLINED contribution has `body: null` (contract: "`body` is null exactly
 * when `declined` is true") and is not this component's job: it renders its
 * decline reason, in a contribution component, at M1. `blocks` is non-null here
 * on purpose — an empty array and "declined" are different facts.
 */

type ProseBlock = Schemas['ProseBlock'];
type ProseSpan = Schemas['ProseSpan'];

const VOICE_CLASSES: Record<VoiceName, string> = {
  serif: 'voice-serif',
  mono: 'voice-mono',
  terse: 'voice-terse',
  plain: 'voice-plain',
};

/**
 * The only link schemes this renderer will emit. Prose is server-written, so
 * this is a belt-and-braces second line: an `href` that is not an absolute
 * http(s) URL, a site-relative path or an in-page fragment degrades to plain
 * text rather than becoming an anchor. `javascript:` and `data:` can therefore
 * never reach the DOM through this component, whatever ends up in the database.
 */
function safeHref(href: string | undefined): string | null {
  if (href === undefined) {
    return null;
  }

  const candidate = href.trim();
  if (candidate.startsWith('/') || candidate.startsWith('#')) {
    return candidate;
  }

  const lower = candidate.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return candidate;
  }

  return null;
}

/**
 * One flat inline unit. Spans never nest (D-017), so this is a switch and never
 * a recursion — there is no depth here to fuzz.
 */
function Span({ span }: { span: ProseSpan }): ReactNode {
  switch (span.kind) {
    case 'text':
      return span.text;

    case 'code':
      return <code className="font-mono text-body-mono">{span.text}</code>;

    case 'em':
      return <em>{span.text}</em>;

    case 'strong':
      // §6.3 — "Weights: 400 prose; 400/500 UI; 600 only for names and buttons.
      // Never 700+." Preflight would give <strong> `bolder`; 500 is the
      // emphasis this scale actually has.
      return <strong className="font-medium">{span.text}</strong>;

    case 'link': {
      const href = safeHref(span.href);
      if (href === null) {
        return span.text;
      }
      // §13 — never colour alone: the underline is the signal, the ink is the
      // page's. Plain <a>: next/link's client runtime stays out of apps/web
      // until the §9.7 Nav ticket (D-015 item 4).
      return (
        <a href={href} className="underline text-ink hover:text-ink-soft">
          {span.text}
        </a>
      );
    }

    default:
      // Unknown span kind from a newer server — show the words.
      return span.text;
  }
}

function Spans({ spans }: { spans: readonly ProseSpan[] }) {
  return (
    <>
      {spans.map((span, index) => (
        // Prose is server-rendered and never reordered or edited in place, so
        // positional keys are stable for the lifetime of the entry.
        <Span key={index} span={span} />
      ))}
    </>
  );
}

/**
 * Block spacing: `space-5` between blocks rather than after each, so an entry's
 * prose never carries a trailing margin into whatever follows it (`Cites`).
 */
function blockClass(index: number, base?: string): string | undefined {
  const classes = [index === 0 ? null : 'mbs-5', base].filter(Boolean);
  return classes.length > 0 ? classes.join(' ') : undefined;
}

function Block({ block, index }: { block: ProseBlock; index: number }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <p className={blockClass(index)}>
          <Spans spans={block.spans} />
        </p>
      );

    case 'code':
      // §5.1 `paperSink` is the "inset strip" surface. No radius and no border:
      // a code block is a strip in the column, not one of the three cards §1
      // row 2 allows. Its own scroll container keeps a long line from forcing
      // the page to scroll sideways (§13 — 200% zoom, no horizontal scroll).
      return (
        <pre
          className={blockClass(
            index,
            'overflow-x-auto bg-paper-sink p-5 font-mono text-body-mono text-ink',
          )}
        >
          <code>{block.text}</code>
        </pre>
      );

    default:
      return <UnknownBlock block={block} index={index} />;
  }
}

/**
 * A block kind this build does not know (D-017 — the shape is grow-only). The
 * text is recovered from whichever of the two known carriers the block has,
 * and rendered as an ordinary paragraph: unstyled, but present and readable.
 */
function UnknownBlock({ block, index }: { block: ProseBlock; index: number }) {
  const unknown = block as { spans?: readonly ProseSpan[]; text?: string };

  if (Array.isArray(unknown.spans)) {
    return (
      <p className={blockClass(index)}>
        <Spans spans={unknown.spans} />
      </p>
    );
  }

  if (typeof unknown.text === 'string') {
    return <p className={blockClass(index)}>{unknown.text}</p>;
  }

  return null;
}

export type ProseProps = {
  /** `Contribution.body` off the wire. Never null — see the note above. */
  blocks: readonly ProseBlock[];
  /** The author's voice (§6.2). Humans and Sprout are `plain`. */
  voice: VoiceName;
};

export function Prose({ blocks, voice }: ProseProps) {
  return (
    <div className={`measure text-ink ${VOICE_CLASSES[voice]}`}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} index={index} />
      ))}
    </div>
  );
}
