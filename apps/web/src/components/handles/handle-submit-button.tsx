import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * The real submit control for the handle-change forms (P-08).
 *
 * Not the shared `Button` primitive: `Button` hard-codes `type="button"`
 * (it is never a form's submit control by construction — see its own
 * comment), which is correct for the click-driven, client-side actions it
 * was built for but cannot submit a plain `<form action={...}>`. Phase 1's
 * INTERIM wiring (see `lib/handles/actions.ts`) depends on a real
 * `type="submit"` button working with JavaScript disabled, so this is a
 * second, minimal, server-component-safe control — not a fork of `Button`'s
 * variant system, just its solid-button token recipe, kept in one place so
 * both handle forms match it.
 */
export type HandleSubmitButtonProps = {
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'>;

export function HandleSubmitButton({ children, ...rest }: HandleSubmitButtonProps) {
  return (
    <button
      {...rest}
      type="submit"
      className="inline-flex items-center justify-center gap-2 rounded-sm bg-ink px-6 py-4 font-ui font-emphasis text-label text-paper hover:bg-ink-soft active:opacity-90 disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
