import { Field } from '../primitives/field';

/**
 * The handle input, shared by `/welcome/handle` and `/settings` (P-08 —
 * DIRECTIVE §7 §9, D-029: onboarding and settings go through the same
 * `PUT /me/handle` rule set, so they render the same states). Presentational
 * and server-component-safe by default — no `useState`, no event handlers of
 * its own; `state` is computed by the caller and handed in.
 *
 * Phase 2 (D-041) adds `onChange`: when a caller supplies it (only the new
 * `handle-form.tsx` client leaf does), the input becomes controlled —
 * `value={defaultValue}` instead of `defaultValue={defaultValue}` — so the
 * leaf can observe keystrokes for debounced availability checking. Every
 * OTHER caller (every Storybook story, unchanged from Phase 1) omits
 * `onChange` and gets the exact same uncontrolled `<input>` as before this
 * phase touched anything here.
 *
 * Deliberately does not re-implement the handle format regex: `hint` is
 * static copy, `error` always comes from `lib/handles/errors.ts`, which itself
 * only translates reasons the SERVER decided (`/handles/availability`
 * "deliberately accepts any string... so clients never duplicate the format
 * rule").
 */

export type HandleFieldState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export interface HandleFieldProps {
  htmlFor: string;
  label?: string;
  defaultValue: string;
  state?: HandleFieldState;
  /** Present only from `handle-form.tsx`. See the module doc comment above. */
  onChange?: (value: string) => void;
}

export function HandleField({
  htmlFor,
  label = 'Handle',
  defaultValue,
  state = { kind: 'idle' },
  onChange,
}: HandleFieldProps) {
  const error = state.kind === 'error' ? state.message : undefined;
  const controlled = onChange !== undefined;

  return (
    <div>
      <Field
        label={label}
        htmlFor={htmlFor}
        hint={error ? undefined : '3–20 characters — lowercase letters, numbers, "-" or "_".'}
        error={error}
        inputProps={{
          name: 'handle',
          ...(controlled
            ? { value: defaultValue, onChange: (e) => onChange(e.target.value) }
            : { defaultValue }),
          maxLength: 20,
          required: true,
          autoComplete: 'off',
          spellCheck: false,
        }}
      />
      {state.kind === 'checking' ? (
        <p className="mt-3 font-ui text-meta text-ink-quiet" aria-live="polite">
          Checking availability…
        </p>
      ) : null}
      {state.kind === 'available' ? (
        <p className="mt-3 font-ui text-meta text-positive" aria-live="polite">
          That handle is available.
        </p>
      ) : null}
      {state.kind === 'success' ? (
        <p className="mt-3 font-ui text-meta text-positive">{state.message}</p>
      ) : null}
    </div>
  );
}
