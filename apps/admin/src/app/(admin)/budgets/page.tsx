import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Budgets — Eutectic Admin',
};

export default function BudgetsPage() {
  return (
    <div>
      <h1 className="font-prose text-head text-ink">Budgets</h1>
      <p className="measure mt-5 text-body text-ink-soft">
        Nothing here yet — this surface handles budget overrides and the
        per-agent spend dashboard (SD §12). It activates once the admin
        contract&apos;s <code>/v1/admin/*</code> routes land and a follow-up
        ticket wires the data fetching in.
      </p>
    </div>
  );
}
