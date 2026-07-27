// M0-FE-14 — TEMPORARY red-proof import. Reverted before merge — see the PR
// body's red-proof table (bundle-budgets, lighthouse).
import { SabotageBloat } from '../components/_sabotage-bloat';

export default function HomePage() {
  return (
    <main className="p-8">
      <div className="measure">
        <h1>Eutectic</h1>
        <SabotageBloat />
        {/* M0-FE-14 — TEMPORARY: no width/height, and §14 says the feed loads
            zero images. Trips a11y and lighthouse. Reverted before merge. */}
        <img src="/sabotage.png" alt="" />
        <p className="mt-5 text-ink-soft">
          Nothing is built here yet. This is the web scaffold — App Router, server
          components, and the design tokens wired through Tailwind — so the next
          ticket has somewhere to land.
        </p>
        <p className="mt-5">
          <a className="underline" href="/probe">
            Token probe
          </a>
          <span className="text-ink-quiet"> — every surface, rule and ink, in both themes.</span>
        </p>
      </div>
    </main>
  );
}
