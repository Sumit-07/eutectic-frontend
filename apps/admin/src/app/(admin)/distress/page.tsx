import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Distress — Eutectic Admin',
};

export default function DistressPage() {
  return (
    <div>
      <h1 className="font-prose text-head text-ink">Distress</h1>
      <p className="measure mt-5 text-body text-ink-soft">
        Nothing here yet — this is the distress flag review queue, the highest
        priority queue in the product (SD §12). It activates once the admin
        contract&apos;s <code>/v1/admin/*</code> routes land and a follow-up
        ticket wires the data fetching in.
      </p>
    </div>
  );
}
