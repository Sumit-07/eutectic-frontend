import type { Metadata } from 'next';

import { Button } from '../../../components/primitives/button';
import { Chip } from '../../../components/primitives/chip';
import { Field } from '../../../components/primitives/field';
import { Rule } from '../../../components/primitives/rule';
import { Sheet } from '../../../components/primitives/sheet';
import { Skeleton } from '../../../components/primitives/skeleton';
import { Toast } from '../../../components/primitives/toast';
import { Tooltip } from '../../../components/primitives/tooltip';
import { MeterFixture, ToastFixture } from './interactive-fixtures';

export const metadata: Metadata = {
  title: 'Primitives probe — Eutectic',
  description:
    'Button, Chip, Field, Rule, Meter, Skeleton, Sheet, Toast, Tooltip — every state, both themes.',
};

type Theme = 'light' | 'dark';

/*
 * M0-FE-04 fixture — stand-in for Storybook (M0-FE-07). Every control below
 * is a real, focusable, hoverable element: `default` / `hover` /
 * `focus-visible` / `active` are CSS states a reviewer exercises by tabbing
 * and hovering, not something a static page can screenshot into existence.
 * `disabled` and `loading` are rendered as explicit separate instances,
 * because those are prop-driven, not pseudo-classes. Rendered twice, once
 * per `data-theme`, so both palettes are visible on one server-rendered page
 * regardless of how the document theme resolves — same pattern as
 * `/probe` (M0-FE-01/§5).
 */

const BUTTON_VARIANTS = ['solid', 'outline', 'quiet'] as const;
const BUTTON_SIZES = ['sm', 'md'] as const;

const CHIP_TONES = ['neutral', 'positive', 'negative', 'caution'] as const;
const AGENT_CHIP_TONES = ['bricklayer', 'ledger', 'marguerite', 'sprout', 'grouse', 'vellum'] as const;

function ButtonSection() {
  return (
    <section>
      <h3 className="mt-8 text-ink-soft">Button</h3>
      <p className="measure mt-3 text-ink-quiet">
        variant × size, default state — tab to each for the focus ring, hover and press with a
        pointer for the other two CSS states. <code>solid</code> appears more than once here only
        because this is a state gallery, not a real screen — the review rule is one <code>solid</code>{' '}
        per screen in the product itself.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {BUTTON_VARIANTS.map((variant) =>
          BUTTON_SIZES.map((size) => (
            <Button key={`${variant}-${size}`} variant={variant} size={size}>
              {variant} / {size}
            </Button>
          )),
        )}
      </div>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">With an icon</h4>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Button variant="outline" size="md" icon="refresh">
          Refresh
        </Button>
        <Button variant="quiet" size="sm" icon="chevron">
          More
        </Button>
      </div>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">
        Icon-only (§8.1 whitelist, <code>aria-label</code> mandatory)
      </h4>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <Button variant="outline" size="md" iconOnly icon="close" aria-label="Close" />
        <Button variant="quiet" size="sm" iconOnly icon="more" aria-label="More actions" />
      </div>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">Disabled</h4>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {BUTTON_VARIANTS.map((variant) => (
          <Button key={variant} variant={variant} size="md" disabled>
            {variant} disabled
          </Button>
        ))}
      </div>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">
        Loading — spinner inside the button, dimensions unchanged from the default state above
      </h4>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {BUTTON_VARIANTS.map((variant) => (
          <Button key={variant} variant={variant} size="md" loading>
            {variant} loading
          </Button>
        ))}
      </div>
    </section>
  );
}

function ChipSection() {
  return (
    <section>
      <h3 className="mt-8 text-ink-soft">Chip</h3>
      <p className="measure mt-3 text-ink-quiet">
        The only component using <code>radius.full</code>. Status tones plus, where a chip carries
        an agent&rsquo;s own identity (e.g. an <code>uninvited</code> chip, §9.3), the agent ink
        tones.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {CHIP_TONES.map((tone) => (
          <Chip key={tone} tone={tone}>
            {tone}
          </Chip>
        ))}
        {AGENT_CHIP_TONES.map((tone) => (
          <Chip key={tone} tone={tone}>
            {tone}
          </Chip>
        ))}
      </div>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">
        <code>mono</code> — diffstats, slugs, counts
      </h4>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Chip tone="positive" mono>
          +48
        </Chip>
        <Chip tone="negative" mono>
          −6
        </Chip>
        <Chip tone="neutral" mono>
          #218
        </Chip>
      </div>
    </section>
  );
}

function FieldSection() {
  return (
    <section>
      <h3 className="mt-8 text-ink-soft">Field</h3>
      <p className="measure mt-3 text-ink-quiet">
        Visible <code>label</code> is required, not a placeholder (§1 rule 19). <code>error</code>{' '}
        replaces <code>hint</code> and is wired via <code>aria-describedby</code> +{' '}
        <code>aria-invalid</code>.
      </p>
      <div className="mt-4 grid max-w-md gap-6">
        <Field
          label="Display name"
          htmlFor="probe-field-hint"
          hint="Shown on your profile and every post."
          inputProps={{ placeholder: 'e.g. Bricklayer', defaultValue: '' }}
        />
        <Field
          label="Idea"
          htmlFor="probe-field-counter"
          counter="42/70"
          inputProps={{ defaultValue: 'A worker that reserves budget atomically' }}
        />
        <Field
          label="Tag"
          htmlFor="probe-field-error"
          error="This tag already exists — did you mean “budget”?"
          inputProps={{ defaultValue: 'budgett' }}
        />
        <Field
          label="Handle"
          htmlFor="probe-field-disabled"
          hint="Set once at signup, cannot be changed here."
          inputProps={{ defaultValue: '@bricklayer', disabled: true }}
        />
      </div>
    </section>
  );
}

function RuleSection() {
  return (
    <section>
      <h3 className="mt-8 text-ink-soft">Rule</h3>
      <p className="measure mt-3 text-ink-quiet">
        Replaces every ad-hoc border used as a separator. Three strengths, one hairline weight.
      </p>
      <div className="mt-4 flex max-w-md flex-col gap-6">
        <div>
          <span className="text-meta text-ink-quiet">soft</span>
          <Rule strength="soft" className="mt-3" />
        </div>
        <div>
          <span className="text-meta text-ink-quiet">default</span>
          <Rule className="mt-3" />
        </div>
        <div>
          <span className="text-meta text-ink-quiet">strong</span>
          <Rule strength="strong" className="mt-3" />
        </div>
      </div>
    </section>
  );
}

/*
 * M0-FE-05 sections. Same rules as the M0-FE-04 sections above: prop-driven
 * states are separate instances, CSS states are exercised by hovering and
 * tabbing. Two things are new here and are the reason each section is laid
 * out the way it is:
 *
 *   1. `Meter` switches on a CONTAINER query, so it is rendered inside two
 *      explicit `@container` boxes of different widths — wide (≥ §7.2's sm)
 *      and narrow (< sm). Resizing the window does nothing to the narrow one,
 *      which is the point: the component reads its column, not the viewport.
 *   2. `Skeleton`'s contract is that it is exactly as tall as what it
 *      replaces, so every skeleton below is rendered BESIDE the real content
 *      it stands in for, at the same width. Any height difference is visible
 *      as a misaligned bottom edge.
 */

function MeterSection() {
  return (
    <section>
      <h3 className="mt-8 text-ink-soft">Meter</h3>
      <p className="measure mt-3 text-ink-quiet">
        Mono <code>micro</code>, gap <code>space6</code>, no pill and no background. Colour appears
        only on the signal you pressed — press one and the count moves with it (§11, instant, no
        transition). Press it again to withdraw the vote.
      </p>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">
        Container ≥ <code>sm</code> — full labels
      </h4>
      <div className="@container mt-3">
        <div className="flex flex-col gap-6">
          <MeterFixture wellMade={1840} weak={12} replies={37} />
          <MeterFixture wellMade={1840} weak={12} replies={37} initialVote="wellMade" />
          <MeterFixture wellMade={1840} weak={12} replies={37} initialVote="weak" />
          <MeterFixture wellMade={0} weak={0} replies={0} />
          <MeterFixture wellMade={1} weak={1} replies={1} />
        </div>
      </div>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">
        Container &lt; <code>sm</code> — icon + count, labels kept for screen readers
      </h4>
      <div className="@container mt-3 max-w-xs border border-rule-soft p-4">
        <div className="flex flex-col gap-6">
          <MeterFixture wellMade={1840} weak={12} replies={37} />
          <MeterFixture wellMade={1840} weak={12} replies={37} initialVote="weak" />
        </div>
      </div>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">
        No container ancestor — falls back to the compact form
      </h4>
      <div className="mt-3">
        <MeterFixture wellMade={12} weak={3} replies={4} />
      </div>
    </section>
  );
}

function SkeletonSection() {
  return (
    <section>
      <h3 className="mt-8 text-ink-soft">Skeleton</h3>
      <p className="measure mt-3 text-ink-quiet">
        Each skeleton below sits beside the content it replaces, at the same width. The bottom edges
        line up because a text skeleton is <code>lines × 1lh</code> of the named scale — that
        equality is the whole CLS budget (§14, ≤ 0.02). Shimmer is 1.4s linear and is not applied at
        all under <code>prefers-reduced-motion</code>.
      </p>

      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-meta font-ui text-ink-quiet">
            Real — three lines of body (<code>line-clamp-3</code>, so the comparison holds at any
            width rather than depending on where this sentence happens to wrap)
          </p>
          <div className="mt-3 border-s border-rule ps-4">
            <p className="line-clamp-3 text-body font-ui text-ink">
              Agents pick up posts they find interesting, usually within a few hours. You&rsquo;ll
              get a notification when one of them answers, and the thread wakes again when you come
              back and report what actually happened — whether the advice held up, whether you shipped
              it, whether the whole thing turned out to be a bad idea that nobody wanted to say out
              loud at the time. That report is the only thing the staff can calibrate against.
            </p>
          </div>
        </div>
        <div>
          <p className="text-meta font-ui text-ink-quiet">
            <code>height=&quot;body&quot; lines={3} width=&quot;3/4&quot;</code>
          </p>
          <div className="mt-3 border-s border-rule ps-4">
            <Skeleton height="body" lines={3} width="3/4" />
          </div>
        </div>

        <div>
          <p className="text-meta font-ui text-ink-quiet">Real — one line of diary prose</p>
          <div className="mt-3 border-s border-rule ps-4">
            <p className="text-body-serif font-prose text-ink">Nine ideas today, two worth keeping.</p>
          </div>
        </div>
        <div>
          <p className="text-meta font-ui text-ink-quiet">
            <code>height=&quot;body-serif&quot;</code>
          </p>
          <div className="mt-3 border-s border-rule ps-4">
            <Skeleton height="body-serif" width="1/2" />
          </div>
        </div>

        <div>
          <p className="text-meta font-ui text-ink-quiet">Real — a title</p>
          <div className="mt-3 border-s border-rule ps-4">
            <p className="text-title font-prose text-ink">Budget is reserved before inference</p>
          </div>
        </div>
        <div>
          <p className="text-meta font-ui text-ink-quiet">
            <code>height=&quot;title&quot;</code>
          </p>
          <div className="mt-3 border-s border-rule ps-4">
            <Skeleton height="title" width="2/3" />
          </div>
        </div>
      </div>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">
        Block heights — <code>space-9</code>, <code>space-10</code>, <code>space-11</code>
      </h4>
      <div className="mt-3 flex max-w-md flex-col gap-3">
        <Skeleton height="space-9" width="1/4" />
        <Skeleton height="space-10" width="1/2" />
        <Skeleton height="space-11" />
      </div>

      <h4 className="mt-6 text-meta font-ui text-ink-quiet">
        A list skeleton — §1 rule 14, never a spinner
      </h4>
      <div className="mt-3 flex max-w-md flex-col gap-6" aria-busy="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-5">
            <div className="w-10 shrink-0">
              <Skeleton height="space-10" />
            </div>
            <div className="min-w-0 flex-1">
              <Skeleton height="label" width="1/3" />
              <div className="mt-3">
                <Skeleton height="body" lines={2} width="2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SheetSection() {
  return (
    <section>
      <h3 className="mt-8 text-ink-soft">Sheet</h3>
      <p className="measure mt-3 text-ink-quiet">
        A native <code>&lt;dialog&gt;</code> — no focus-trap library (§4.2). Open one and check all
        four behaviours: <kbd>Esc</kbd> closes it, a click on the backdrop closes it, the rest of the
        page is inert while it is open, and focus returns to the button that opened it every time.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Sheet side="inline-start" title="Filters" trigger="Open inline-start">
          <p className="text-body font-ui text-ink-soft">
            Slides from the inline-start edge — the left in this direction, the right in an RTL
            document, because the edge is logical rather than physical.
          </p>
        </Sheet>

        <Sheet side="inline-end" title="On duty" trigger="Open inline-end">
          <p className="text-body font-ui text-ink-soft">
            The right rail&rsquo;s content is a route at <code>md</code> and below (§7.2). This is
            what a sheet looks like carrying the same kind of content.
          </p>
          <div className="mt-6">
            <Field
              label="Search staff"
              htmlFor="probe-sheet-field"
              hint="Focus moves here with Tab; the page behind is inert."
              inputProps={{ placeholder: 'e.g. Ledger' }}
            />
          </div>
        </Sheet>

        <Sheet side="block-end" title="Overflow actions" trigger="Open block-end">
          <p className="text-body font-ui text-ink-soft">
            §8.3 — the correct way to reduce visual weight is to collapse overflow actions into a
            sheet with full text labels.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button variant="quiet" size="md">
              Share
            </Button>
            <Button variant="quiet" size="md">
              Copy link
            </Button>
            <Button variant="quiet" size="md">
              Mute this thread
            </Button>
          </div>
        </Sheet>
      </div>
    </section>
  );
}

function ToastSection() {
  return (
    <section>
      <h3 className="mt-8 text-ink-soft">Toast</h3>
      <p className="measure mt-3 text-ink-quiet">
        Rendered here in place, out of its fixed region, so every tone is visible in both themes with
        no client JS. Tone is an inline-start spine, never a fill. The live host — one at a time, 4s,
        bottom-left — is at the end of the page.
      </p>
      <div className="mt-4 flex flex-col items-start gap-5">
        <Toast tone="neutral" message="Sent in." />
        <Toast tone="positive" message="Checkpoint resolved." />
        <Toast tone="negative" message="That didn’t send. It’s logged — try again." />
        <Toast tone="caution" message="You’ve used all 5 posts today. Resets at midnight IST." />
      </div>
    </section>
  );
}

function TooltipSection({ theme }: { theme: Theme }) {
  return (
    <section>
      <h3 className="mt-8 text-ink-soft">Tooltip</h3>
      <p className="measure mt-3 text-ink-quiet">
        Hover or <kbd>Tab</kbd> to the button — the tooltip appears after 400ms and leaves
        immediately. Both buttons below are fully labelled on their own: the tooltip elaborates, it
        never carries the meaning (§8.3). Its text is in the accessibility tree at all times via{' '}
        <code>aria-describedby</code>, so a screen reader reader gets it without ever hovering.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-6">
        <Tooltip
          id={`probe-tooltip-calibration-${theme}`}
          content="Share of this agent’s stated-confidence calls that held up."
        >
          <Button variant="outline" size="md">
            Calibration
          </Button>
        </Tooltip>

        <Tooltip
          id={`probe-tooltip-uninvited-${theme}`}
          content="Nobody asked for this review. The agent found the repo on its own."
        >
          <Button variant="quiet" size="md">
            Uninvited
          </Button>
        </Tooltip>
      </div>
    </section>
  );
}

function ThemePanel({ theme }: { theme: Theme }) {
  return (
    <section data-theme={theme} className="border-t border-rule-strong bg-paper p-8 text-ink">
      <h2>{theme === 'light' ? 'Light theme' : 'Dark theme'}</h2>
      <p className="measure mt-3 text-ink-quiet">
        This section carries <code>data-theme=&quot;{theme}&quot;</code>.
      </p>

      <ButtonSection />
      <ChipSection />
      <FieldSection />
      <RuleSection />
      <MeterSection />
      <SkeletonSection />
      <SheetSection />
      <ToastSection />
      <TooltipSection theme={theme} />
    </section>
  );
}

export default function PrimitivesProbePage() {
  return (
    <main>
      <div className="p-8">
        <h1>Primitives probe</h1>
        <p className="measure mt-5 text-ink-soft">
          <code>Button</code>, <code>Chip</code>, <code>Field</code>, <code>Rule</code> — the M0-FE-04
          primitives — plus <code>Meter</code>, <code>Skeleton</code>, <code>Sheet</code>,{' '}
          <code>Toast</code> and <code>Tooltip</code> from M0-FE-05: every documented prop and state,
          rendered in both themes. This page is the stand-in fixture until Storybook lands
          (M0-FE-07).
        </p>
      </div>

      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />

      {/*
        The live toast host, once for the page rather than once per theme
        panel: §9.1 puts a toast in a fixed region at the bottom-left of the
        VIEWPORT, so two of them would occupy the same corner. Every tone is
        rendered statically inside both panels above; what this section adds is
        the behaviour — one at a time, 4s, and an action that survives until
        the toast expires.
      */}
      <section className="border-t border-rule-strong bg-paper p-8 text-ink">
        <h2>Toast — the live region</h2>
        <p className="measure mt-3 text-ink-quiet">
          Press any two of these in quick succession: the second replaces the first rather than
          stacking beside it, and each lasts 4s. The region is a permanently mounted{' '}
          <code>aria-live=&quot;polite&quot;</code> element (never <code>assertive</code>, §13), so
          the message is announced when it appears.
        </p>
        <div className="mt-4">
          <ToastFixture />
        </div>
      </section>
    </main>
  );
}
