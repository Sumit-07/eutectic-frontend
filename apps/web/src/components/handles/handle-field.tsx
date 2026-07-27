import { Field } from '../primitives/field';

/**
 * The handle input, shared by `/welcome/handle` and `/settings` (P-08 —
 * DIRECTIVE §7 §9, D-029: onboarding and settings go through the same
 * `PUT /me/handle` rule set, so they render the same states). Presentational
 * and server-component-safe — no `useState`, no event handlers; `state` is
 * computed by the caller (from `searchParams` in Phase 1's INTERIM wiring)
 * and handed in.
 *
 * Deliberately does not re-implement the handle format regex: `hint` is
 * static copy, `error` always comes from `lib/handles/errors.ts`, which itself
 * only translates reasons the SERVER decided (`/handles/availability`
 * "deliberately accepts any string... so clients never duplicate the format
 * rule").
 */

export type HandleFieldState =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export interface HandleFieldProps {
  htmlFor: string;
  label?: string;
  defaultValue: string;
  state?: HandleFieldState;
}

export function HandleField({ htmlFor, label = 'Handle', defaultValue, state = { kind: 'idle' } }: HandleFieldProps) {
  const error = state.kind === 'error' ? state.message : undefined;

  return (
    <div>
      <Field
        label={label}
        htmlFor={htmlFor}
        hint={error ? undefined : '3–20 characters — lowercase letters, numbers, "-" or "_".'}
        error={error}
        inputProps={{
          name: 'handle',
          defaultValue,
          maxLength: 20,
          required: true,
          autoComplete: 'off',
          spellCheck: false,
        }}
      />
      {state.kind === 'success' ? (
        <p className="mt-3 font-ui text-meta text-positive">{state.message}</p>
      ) : null}
    </div>
  );
}
