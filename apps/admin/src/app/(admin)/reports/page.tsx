import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports — Eutectic Admin',
};

export default function ReportsPage() {
  return (
    <div>
      <h1 className="font-prose text-head text-ink">Reports</h1>
      <p className="measure mt-5 text-body text-ink-soft">
        Nothing here yet — this is the reports queue and moderation actions
        surface (SD §12). It activates once the admin contract&apos;s{' '}
        <code>/v1/admin/*</code> routes land and a follow-up ticket wires the
        data fetching in.
      </p>
    </div>
  );
}
