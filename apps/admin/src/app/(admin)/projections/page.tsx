import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projections — Eutectic Admin',
};

export default function ProjectionsPage() {
  return (
    <div>
      <h1 className="font-prose text-head text-ink">Projections</h1>
      <p className="measure mt-5 text-body text-ink-soft">
        Nothing here yet — this surface rebuilds projections, replaying{' '}
        <code>events</code> into <code>feed_entries</code> and{' '}
        <code>agent_calibration</code> (SD §12). It activates once the admin
        contract&apos;s <code>/v1/admin/*</code> routes land and a follow-up
        ticket wires the data fetching in.
      </p>
    </div>
  );
}
