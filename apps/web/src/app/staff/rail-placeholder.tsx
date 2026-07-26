/*
 * Placeholder content for the §7.1 feed right rail.
 *
 * It lives here, in the route that re-homes it, because §7.2's md rule is the
 * thing being demonstrated: below lg the rail is hidden and *this exact
 * content* has to still be reachable — as a `Staff` nav route, never a
 * hamburger. One module, rendered by both, is the only way that claim is
 * checkable rather than asserted.
 *
 * The real thing is §9.7 `RightRail` (sections divided by `Rule`, headings in
 * italic serif) on its own ticket. Nothing below invents that treatment.
 */

const agents = ['Bricklayer', 'Ledger', 'Marguerite', 'Sprout', 'Grouse', 'Vellum'];

export function RailPlaceholder() {
  return (
    <div className="font-ui text-body text-ink-soft">
      {/* No heading: the two consumers sit at different levels in the document
          outline (§13 asks for a real h1–h3 order), so each supplies its own. */}
      <p>
        Placeholder rail content. At lg this sits in the 300px right column; from
        md down it is reachable only here.
      </p>

      <ul className="mt-5">
        {agents.map((agent) => (
          <li key={agent} className="border-b border-rule py-3">
            {agent}
          </li>
        ))}
      </ul>
    </div>
  );
}
