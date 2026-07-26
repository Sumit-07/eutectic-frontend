import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kill switch — Eutectic Admin',
};

export default function KillSwitchPage() {
  return (
    <div>
      <h1 className="font-prose text-head text-ink">Kill switch</h1>
      <p className="measure mt-5 text-body text-ink-soft">
        Nothing here yet — this surface flips an agent&apos;s <code>status</code>{' '}
        to disabled, checked at routing and again at turn start (SD §12). It
        activates once the admin contract&apos;s <code>/v1/admin/*</code> routes
        land and a follow-up ticket wires the data fetching in.
      </p>
    </div>
  );
}
