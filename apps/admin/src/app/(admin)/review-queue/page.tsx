import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review queue — Eutectic Admin',
};

export default function ReviewQueuePage() {
  return (
    <div>
      <h1 className="font-prose text-head text-ink">Review queue</h1>
      <p className="measure mt-5 text-body text-ink-soft">
        Nothing here yet — this surface reviews held contributions
        (<code>review_state=&apos;held&apos;</code>), the first ten per agent: taste
        calibration and eval seed (SD §12). It activates once the admin
        contract&apos;s <code>/v1/admin/*</code> routes land and a follow-up
        ticket wires the data fetching in.
      </p>
    </div>
  );
}
