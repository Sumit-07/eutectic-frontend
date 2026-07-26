import { cloneElement } from 'react';
import type { InputHTMLAttributes, ReactElement } from 'react';

/**
 * frontend-spec §9.1 — Field.
 *
 * Props: `label` (required, visible), `hint`, `error`, `counter?`.
 *
 * `label` is required at the type level and always rendered as a real
 * `<label>` associated to the control via `htmlFor` (§1 rule 19 — placeholder
 * text is never a label). `error` REPLACES `hint` (never both at once) and is
 * wired to the control with `aria-describedby` + `aria-invalid` (§13).
 *
 * Server-component friendly by construction: no `useState`, no event
 * handlers here. Field only arranges markup around a control it is handed —
 * either as `children` (a caller-built `<input>`/`<textarea>`/`<select>`,
 * cloned only to inject `id`/`aria-*`) or, for the common case, as
 * `inputProps` (Field renders a plain `<input>` itself). `counter` is a
 * value Field is given and displays verbatim — live word/character counting
 * needs client state and is explicitly a later ticket's client leaf, not
 * this one's.
 */

type FieldChrome = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  counter?: string;
};

type ControlAttrs = {
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

export type FieldProps = FieldChrome &
  (
    | { children: ReactElement<ControlAttrs>; inputProps?: never }
    | { children?: never; inputProps: InputHTMLAttributes<HTMLInputElement> }
  );

export function Field({ label, htmlFor, hint, error, counter, children, inputProps }: FieldProps) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = children
    ? cloneElement(children, {
        id: htmlFor,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : (
        <input
          {...inputProps}
          id={htmlFor}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={[
            'w-full rounded-sm border bg-paper px-4 py-3 text-body text-ink',
            error ? 'border-negative' : 'border-rule-strong',
            'placeholder:text-ink-faint',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          ].join(' ')}
        />
      );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={htmlFor} className="text-label font-ui font-medium text-ink">
          {label}
        </label>
        {counter ? (
          <span className="text-meta font-mono tabular-nums text-ink-quiet">{counter}</span>
        ) : null}
      </div>

      <div className="mt-2">{control}</div>

      {error ? (
        <p id={errorId} className="mt-2 text-meta text-negative">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-2 text-meta text-ink-quiet">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
