import type { Metadata } from 'next';

import { Button } from '../../../components/primitives/button';
import { Chip } from '../../../components/primitives/chip';
import { Field } from '../../../components/primitives/field';
import { Rule } from '../../../components/primitives/rule';

export const metadata: Metadata = {
  title: 'Primitives probe — Eutectic',
  description: 'Button, Chip, Field, Rule — every state, both themes.',
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
          primitives — every documented prop and state, rendered in both themes. This page is the
          stand-in fixture until Storybook lands (M0-FE-07).
        </p>
      </div>

      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />
    </main>
  );
}
