/**
 * `GithubHandleControl` — the real one-tap "use my GitHub handle" affordance
 * (P-08 Phase 2, D-041).
 *
 * Restores the bordered secondary-affordance block from Phase 1's first
 * draft (commit `6461488`), but as a control that actually performs the
 * action this time. Phase 1 review removed the original because the
 * same-looking anchor just re-ran GitHub OAuth for an already-authenticated
 * caller and changed nothing — "a control that promises an action it does
 * not perform fails review regardless of a comment explaining it"
 * (CTO-Frontend review, PR #14). D-041 makes the promise real: the contract
 * now accepts `{ use_github_login: true }` on `PUT /me/handle`
 * (`HandleUpdateFromGitHub`, openapi.yaml) — a boolean sentinel the SERVER
 * resolves against the caller's own GitHub login, lowercased, entirely
 * server-side. The login string never crosses the wire in either direction,
 * so nothing here (or anywhere else in this ticket) ever names or reads it —
 * `test/handle-no-private-identity-leak.test.mjs` is the invariant that
 * keeps that true, refined by D-041 to let this component's own sentinel
 * name through without allowlisting a file.
 *
 * Plain server-rendered markup — NOT the new client leaf (`handle-form.tsx`).
 * There is no candidate string to debounce-check here (the server resolves
 * it internally, and the result is never previewed before submit), so this
 * needs no client state and adds no JS. Its `<form>` is a SIBLING of the
 * pseudonym form on the page, not nested inside it — two independent submit
 * targets sharing one page.
 *
 * Styled as the SECONDARY affordance deliberately — an outline button, not
 * `HandleSubmitButton`'s solid recipe. D-029 keeps the pseudonym path
 * visually primary; this control must never compete with it for attention.
 */

export interface GithubHandleControlProps {
  action: (formData: FormData) => void | Promise<void>;
  /** The last attempt's failure, if any — kept in its OWN query-param slot by
   *  the caller (never `handle_error_message`), so a failed one-tap attempt
   *  can never overwrite the pseudonym field's own value or error. */
  errorMessage?: string;
}

export function GithubHandleControl({ action, errorMessage }: GithubHandleControlProps) {
  return (
    <div className="mt-8 border-t border-rule-soft pt-6">
      <p className="font-ui text-meta text-ink-quiet">
        Prefer the name on your GitHub account? You can claim it instead — or
        switch to it later from settings.
      </p>
      <form action={action} className="mt-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-sm border border-rule-strong px-6 py-4 font-ui font-emphasis text-label text-ink hover:bg-paper-hover"
        >
          Use my GitHub handle instead
        </button>
      </form>
      {errorMessage ? (
        <p className="mt-3 font-ui text-meta text-negative" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
