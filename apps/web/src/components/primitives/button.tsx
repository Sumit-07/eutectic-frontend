import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * frontend-spec §9.1 — Button.
 *
 * Props: `variant: 'solid' | 'outline' | 'quiet'`, `size: 'sm' | 'md'`, `loading`,
 * `icon?`, `iconOnly?`.
 *
 * REVIEW RULE (not a runtime check): `solid` at most once per screen. `solid`
 * is the loudest surface in the button set (§1 rule 2 — one accent per
 * context extends to variants, not just colour) and doubling it reads as two
 * competing calls to action. A domain CTO enforces this in review; there is
 * deliberately no prop or lint rule for it because "which button is the one
 * true action on this screen" is a product judgement, not something the type
 * system can decide.
 *
 * ICON WHITELIST (§8.1): a `Button` can only ever request one of the twelve
 * icons below — `icon` is typed as `IconName`, so anything else is already a
 * compile error for callers who go through the type. `iconOnly` buttons are
 * the one place an icon has to carry meaning with no adjacent label, so on
 * top of the type we also throw in development if an `iconOnly` button's
 * icon is somehow outside the whitelist (an `as IconName` cast, a value from
 * an untyped API response, etc.). The throw is dev-only
 * (`process.env.NODE_ENV !== 'production'`) — a malformed value in production
 * renders a blank icon slot rather than crashing the page.
 *
 * There is no icon set yet (§17 is a later ticket). `icon` renders as a
 * neutral placeholder glyph slot — a bordered box tagged with
 * `data-icon="<name>"` for tests/inspection — never an invented glyph or
 * emoji.
 *
 * Loading: the spinner renders *inside* the button (§12 — "spinners only
 * inside a button"). The button's own content (label + icon) stays in the
 * document with `opacity-0` rather than being unmounted or `visibility:
 * hidden` — that keeps the button's box size stable (no layout shift when
 * the loading state toggles) and keeps the accessible name intact for
 * assistive tech, which `visibility: hidden` content would drop from the
 * accessibility tree. `aria-busy` communicates the state on top of that.
 *
 * Focus ring: deliberately not styled here. `globals.css` already puts a
 * `2px solid` `focus`-token ring at `2px` offset with no transition on every
 * `:focus-visible` element (§11) — a native `<button>` picks that up for
 * free, and re-declaring it per component would be the one place it could
 * drift from the global rule.
 */

const ICON_WHITELIST = [
  'search',
  'close',
  'back',
  'share',
  'more',
  'link',
  'copy',
  'play',
  'refresh',
  'settings',
  'bell',
  'plus',
  'chevron',
] as const;

export type IconName = (typeof ICON_WHITELIST)[number];

const ICON_WHITELIST_SET: ReadonlySet<string> = new Set(ICON_WHITELIST);

/**
 * Dev-only guard for the one place an icon has no adjacent label to lean on.
 * Throws outside production when `icon` is not one of the §8.1 twelve.
 */
function assertIconOnlyWhitelisted(icon: IconName): void {
  if (process.env.NODE_ENV !== 'production' && !ICON_WHITELIST_SET.has(icon)) {
    throw new Error(
      `Button: iconOnly icon "${icon}" is outside the frontend-spec §8.1 whitelist ` +
        `(${ICON_WHITELIST.join(', ')}). Icon-only controls may only use a ` +
        'whitelisted icon — anything else needs a visible text label instead.',
    );
  }
}

function IconGlyph({ name, size }: { name: IconName; size: 'sm' | 'md' }) {
  // Placeholder slot only — no icon set exists yet (§17). Same neutral mark
  // for every name; `data-icon` carries the identity for tests/inspection.
  return (
    <span
      aria-hidden="true"
      data-icon={name}
      className={`inline-block shrink-0 rounded-sm border border-current ${
        size === 'sm' ? 'size-3' : 'size-4'
      }`}
    />
  );
}

function Spinner({ size }: { size: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full border border-current border-t-transparent motion-safe:animate-spin ${
        size === 'sm' ? 'size-3' : 'size-4'
      }`}
    />
  );
}

type SharedProps = {
  variant: 'solid' | 'outline' | 'quiet';
  size: 'sm' | 'md';
  loading?: boolean;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className' | 'type' | 'aria-label'
>;

type LabelledButtonProps = SharedProps & {
  iconOnly?: false;
  /** Decorative-adjacent icon; the visible label already carries the meaning. */
  icon?: IconName;
  children: ReactNode;
};

type IconOnlyButtonProps = SharedProps & {
  iconOnly: true;
  icon: IconName;
  children?: never;
  /** Mandatory — an icon-only control has no other source of an accessible name. */
  'aria-label': string;
};

export type ButtonProps = LabelledButtonProps | IconOnlyButtonProps;

const VARIANT_CLASSES: Record<ButtonProps['variant'], string> = {
  solid:
    'bg-ink text-paper hover:bg-ink-soft active:bg-ink-soft active:opacity-90 disabled:opacity-40',
  outline:
    'bg-transparent text-ink border border-rule-strong hover:bg-paper-hover active:bg-paper-sink disabled:opacity-40',
  quiet:
    'bg-transparent text-ink-soft hover:bg-paper-hover active:bg-paper-sink disabled:opacity-40',
};

function sizeClasses(size: ButtonProps['size'], iconOnly: boolean): string {
  if (iconOnly) {
    return size === 'sm' ? 'size-8' : 'size-9';
  }
  return size === 'sm' ? 'px-4 py-2 gap-2' : 'px-6 py-4 gap-3';
}

export function Button(props: ButtonProps) {
  const { variant, size, loading, iconOnly, icon, children, disabled, ...rest } = props;

  if (iconOnly && icon) {
    assertIconOnlyWhitelisted(icon);
  }

  return (
    <button
      {...rest}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'relative inline-flex items-center justify-center rounded-sm',
        'font-ui font-emphasis text-label',
        'disabled:pointer-events-none disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        sizeClasses(size, Boolean(iconOnly)),
      ].join(' ')}
    >
      <span className={`inline-flex items-center justify-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {icon ? <IconGlyph name={icon} size={size} /> : null}
        {iconOnly ? null : children}
      </span>
      {loading ? (
        <span className="absolute inset-0 inline-flex items-center justify-center">
          <Spinner size={size} />
        </span>
      ) : null}
    </button>
  );
}
