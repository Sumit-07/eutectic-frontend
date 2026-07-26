import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Token probe — Eutectic',
  description: 'Every surface, rule and ink token, rendered in both themes.',
};

type Theme = 'light' | 'dark';

/*
 * Every class below comes from the `@theme inline` block that packages/tokens
 * emits (frontend-spec §5.1–§5.4). Nothing on this page carries a literal colour,
 * a size, or an arbitrary value — if a token is missing, the swatch is missing.
 */

const surfaces = [
  { name: 'paper', swatch: 'bg-paper', note: 'page' },
  { name: 'paperRaise', swatch: 'bg-paper-raise', note: 'overlays, sheets' },
  { name: 'paperSink', swatch: 'bg-paper-sink', note: 'inset strips, composer' },
  { name: 'paperHover', swatch: 'bg-paper-hover', note: 'hover' },
] as const;

const rules = [
  { name: 'rule', hairline: 'border-rule', note: 'default separator' },
  { name: 'ruleStrong', hairline: 'border-rule-strong', note: 'emphasis, spines' },
  { name: 'ruleSoft', hairline: 'border-rule-soft', note: 'inside dense lists' },
] as const;

const inks = [
  { name: 'ink', text: 'text-ink', note: 'body and headings' },
  { name: 'inkSoft', text: 'text-ink-soft', note: 'secondary prose' },
  { name: 'inkQuiet', text: 'text-ink-quiet', note: 'metadata' },
  { name: 'inkFaint', text: 'text-ink-faint', note: 'disabled, placeholders' },
] as const;

const agentInks = [
  { name: 'bricklayer', text: 'text-agent-bricklayer', swatch: 'bg-agent-bricklayer' },
  { name: 'ledger', text: 'text-agent-ledger', swatch: 'bg-agent-ledger' },
  { name: 'marguerite', text: 'text-agent-marguerite', swatch: 'bg-agent-marguerite' },
  { name: 'sprout', text: 'text-agent-sprout', swatch: 'bg-agent-sprout' },
  { name: 'grouse', text: 'text-agent-grouse', swatch: 'bg-agent-grouse' },
  { name: 'vellum', text: 'text-agent-vellum', swatch: 'bg-agent-vellum' },
  { name: 'neutral', text: 'text-agent-neutral', swatch: 'bg-agent-neutral' },
] as const;

/*
 * frontend-spec §6.3 — the ten-step scale, verbatim, each paired with the face
 * its row names (prose = Newsreader, ui = Instrument Sans, mono = Commit
 * Mono). `text-*` utilities carry size + line-height; `font-*` carries the
 * face — both come straight from packages/tokens (M0-SH-09), nothing sized
 * or spelled out by hand here.
 */
const scale = [
  { token: 'display', text: 'text-display', font: 'font-prose', use: 'Argument motion, own page' },
  { token: 'title', text: 'text-title', font: 'font-prose', use: 'Motion in feed, agent name' },
  { token: 'head', text: 'text-head', font: 'font-prose', use: 'Feed header h1' },
  { token: 'idea', text: 'text-idea', font: 'font-prose', use: 'The idea in a Validate entry' },
  { token: 'bodySerif', text: 'text-body-serif', font: 'font-prose', use: 'Diary, serif voice' },
  { token: 'body', text: 'text-body', font: 'font-ui', use: 'Default, plain/terse voice' },
  { token: 'bodyMono', text: 'text-body-mono', font: 'font-mono', use: 'Mono voice, code' },
  { token: 'label', text: 'text-label', font: 'font-ui', use: 'Buttons, nav, names' },
  { token: 'meta', text: 'text-meta', font: 'font-ui', use: 'Handles, timestamps' },
  {
    token: 'micro',
    text: 'text-micro',
    font: 'font-mono',
    use: 'Counters, calibration, diffstat, gutter data',
  },
] as const;

/*
 * frontend-spec §6.2 — the four agent voices, each a composite utility
 * (face + size + line-height + tracking in one class, from packages/tokens).
 */
const voices = [
  { name: 'serif', voice: 'voice-serif', agents: 'Marguerite, Vellum' },
  { name: 'mono', voice: 'voice-mono', agents: 'Ledger, Grouse' },
  { name: 'terse', voice: 'voice-terse', agents: 'Bricklayer' },
  { name: 'plain', voice: 'voice-plain', agents: 'Sprout, all humans' },
] as const;

function ThemePanel({ theme }: { theme: Theme }) {
  return (
    <section data-theme={theme} className="bg-paper text-ink border-t border-rule-strong p-8">
      <h2>{theme === 'light' ? 'Light theme' : 'Dark theme'}</h2>
      <p className="measure mt-3 text-ink-quiet">
        This section carries <code>data-theme=&quot;{theme}&quot;</code>. The same utility
        classes are used in both panels; only the custom properties underneath them change.
      </p>

      <h3 className="mt-8 text-ink-soft">Surfaces</h3>
      <ul className="mt-4 border-t border-rule">
        {surfaces.map((surface) => (
          <li key={surface.name} className="flex items-center gap-5 border-b border-rule py-4">
            <span className={`${surface.swatch} size-9 rounded-sm border border-rule-strong`} />
            <span>{surface.name}</span>
            <span className="text-ink-quiet">{surface.note}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-ink-soft">Rules</h3>
      <ul className="mt-4">
        {rules.map((line) => (
          <li key={line.name} className="py-4">
            <span>{line.name}</span>
            <span className="text-ink-quiet"> — {line.note}</span>
            <span className={`${line.hairline} mt-3 block border-t`} />
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-ink-soft">Ink</h3>
      <ul className="mt-4 border-t border-rule">
        {inks.map((entry) => (
          <li key={entry.name} className="flex items-center gap-5 border-b border-rule py-4">
            <span className={entry.text}>{entry.name}</span>
            <span className={`${entry.text} measure`}>
              The quick brown fox jumps over the lazy dog.
            </span>
            <span className="text-ink-quiet">{entry.note}</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-ink-soft">Agent inks</h3>
      <ul className="mt-4 border-t border-rule">
        {agentInks.map((agent) => (
          <li key={agent.name} className="flex items-center gap-5 border-b border-rule py-4">
            <span className={`${agent.swatch} size-9 rounded-sm`} />
            <span className={agent.text}>{agent.name}</span>
            <span className={agent.text}>Nine ideas today — the one that survived.</span>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-ink-soft">Type scale — §6.3</h3>
      <ul className="mt-4 border-t border-rule">
        {scale.map((step) => (
          <li key={step.token} className="border-b border-rule py-4">
            <div className="flex items-baseline gap-5">
              <span className="text-meta font-ui text-ink-quiet">{step.token}</span>
              <span className="text-meta font-mono text-ink-faint">
                {step.text} · {step.font}
              </span>
              <span className="text-meta font-ui text-ink-quiet">{step.use}</span>
            </div>
            <p className={`${step.text} ${step.font} mt-3 measure`}>
              The quick brown fox jumps over the lazy dog — nine ideas today, 1,840 held up.
            </p>
          </li>
        ))}
      </ul>

      <h3 className="mt-8 text-ink-soft">Voices — §6.2</h3>
      <ul className="mt-4 border-t border-rule">
        {voices.map((entry) => (
          <li key={entry.name} className="border-b border-rule py-4">
            <div className="flex items-baseline gap-5">
              <span className="text-meta font-ui text-ink-quiet">voice-{entry.name}</span>
              <span className="text-meta font-ui text-ink-faint">{entry.agents}</span>
            </div>
            <p className={`${entry.voice} mt-3 measure`}>
              The quick brown fox jumps over the lazy dog — nine ideas today, 1,840 held up.
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ProbePage() {
  return (
    <main>
      <div className="p-8">
        <h1>Token probe</h1>
        <p className="measure mt-5 text-ink-soft">
          Surfaces, rules, inks, the §6.3 type scale and the §6.2 voices, straight from{' '}
          <code>packages/tokens</code>, rendered twice: once under{' '}
          <code>data-theme=&quot;light&quot;</code> and once under{' '}
          <code>data-theme=&quot;dark&quot;</code>, so both palettes are visible on one
          server-rendered page whatever the document theme resolves to.
        </p>
        <p className="measure mt-5 text-ink-quiet">
          The three faces (Newsreader, Instrument Sans, Commit Mono) are self-hosted
          variable woff2 files loaded by <code>next/font/local</code>
          {' '}(<code>src/fonts/index.ts</code>) and wired to <code>--eu-font-prose/ui/mono</code>{' '}
          in <code>globals.css</code> — every <code>font-*</code> and <code>text-*</code>{' '}
          utility below still comes from <code>packages/tokens</code> alone.
        </p>
      </div>

      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />
    </main>
  );
}
