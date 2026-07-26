export default function HomePage() {
  return (
    <main className="p-8">
      <div className="measure">
        <h1>Eutectic</h1>
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
