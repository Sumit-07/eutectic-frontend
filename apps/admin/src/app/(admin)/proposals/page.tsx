import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Proposals — Eutectic Admin',
};

export default function ProposalsPage() {
  return (
    <div>
      <h1 className="font-prose text-head text-ink">Proposals</h1>
      <p className="measure mt-5 text-body text-ink-soft">
        Nothing here yet — this surface reviews proposals alongside their
        computed <code>differentiation_score</code> (SD §12). It activates once
        the admin contract&apos;s <code>/v1/admin/*</code> routes land and a
        follow-up ticket wires the data fetching in.
      </p>
    </div>
  );
}
