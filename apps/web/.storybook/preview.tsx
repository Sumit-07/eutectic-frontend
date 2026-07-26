import type { Decorator, Preview } from '@storybook/nextjs';

import type { Theme } from '../src/lib/theme';

import './fonts.css';
import '../src/app/globals.css';

/**
 * M0-FE-07 — Storybook preview: the theme switch and the font wiring every
 * story renders under.
 *
 * THEME. frontend-spec §5.3's `data-theme` scoping is `[data-theme='light']` /
 * `[data-theme='dark']` in `packages/tokens`' generated `tokens.css` — NOT
 * `html[data-theme]` — verified by reading that file rather than assumed
 * (M0-FE-06/M0-FE-01's probe pages already rely on the same fact: `/probe/entry`
 * nests a `<section data-theme="dark">` to show both palettes on one
 * server-rendered page). That means a plain wrapper `<div>` carrying the
 * attribute is enough to flip every token underneath it — no `<html>` element
 * needed, which Storybook's preview iframe body does not give this decorator
 * anyway. `bg-paper text-ink` on the same div reads the just-switched
 * `--eu-paper`/`--eu-ink` custom properties, matching what `globals.css`'s own
 * `html { background-color: var(--eu-paper); … }` rule does for the app.
 *
 * The toolbar global is named `theme` and defaults to `light`, matching §5.3's
 * resolution order default. Both palettes are the real generated tokens, not a
 * simulated dark mode — the CI contrast gate (§13) already guarantees they are
 * legible; Storybook only has to switch the attribute.
 *
 * FONTS. See `fonts.css` in this directory for why this is a plain
 * `@font-face` file rather than a reproduction of `next/font/local`'s
 * generated-class mechanism.
 */

const THEMES: readonly Theme[] = ['light', 'dark'];

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as Theme | undefined) ?? 'light';

  return (
    <div data-theme={theme} className="bg-paper p-8 text-ink">
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    // tokens' [data-theme] scoping already sets the surface colour per theme;
    // Storybook's own `backgrounds` addon would just fight the same property.
    backgrounds: { disable: true },
  },

  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'frontend-spec §5.3 — resolution order default is light',
      defaultValue: 'light' satisfies Theme,
      toolbar: {
        icon: 'circlehollow',
        items: THEMES.map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
  },

  decorators: [withTheme],
};

export default preview;
