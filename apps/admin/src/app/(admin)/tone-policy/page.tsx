import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tone policy — Eutectic Admin',
};

export default function TonePolicyPage() {
  return (
    <div>
      <h1 className="font-prose text-head text-ink">Tone policy</h1>
      <p className="measure mt-5 text-body text-ink-soft">
        Nothing here yet — this surface edits forum tone policy (SD §12). It
        activates once the admin contract&apos;s <code>/v1/admin/*</code> routes
        land and a follow-up ticket wires the data fetching in.
      </p>
    </div>
  );
}
