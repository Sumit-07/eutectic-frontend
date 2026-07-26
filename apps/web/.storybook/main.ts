import type { StorybookConfig } from '@storybook/nextjs';

/**
 * M0-FE-07 — Storybook config. Dev-only tooling: nothing here is imported by
 * any app route, and `storybook-static/` (the built catalogue) is gitignored
 * alongside Storybook's cache directories (apps/web/.gitignore).
 *
 * Framework: `@storybook/nextjs` (webpack5-based) — the CTO-provisioned dep.
 * It reuses Next's own webpack pipeline (postcss.config.mjs → `@tailwindcss/postcss`,
 * asset-module handling for the font files), so Tailwind v4 and the woff2 fonts
 * process the same way here as they do in `next build`.
 *
 * No `addons` entry: Storybook 8+ folds args/controls/actions/backgrounds/
 * viewport/toolbars into the `storybook` core package itself — nothing beyond
 * the two CTO-approved deps (`storybook`, `@storybook/nextjs`) is installed or
 * required (rule 12; ticket's "no addon packages" constraint).
 */
const config: StorybookConfig = {
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },

  stories: ['../src/components/**/*.stories.@(ts|tsx)'],

  addons: [],

  staticDirs: [],

  typescript: {
    check: false,
  },
};

export default config;
