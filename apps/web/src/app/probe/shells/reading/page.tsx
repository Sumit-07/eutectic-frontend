import type { Metadata } from 'next';

import { ReadingShell } from '../../../../components/shells/reading-shell';

export const metadata: Metadata = {
  title: 'Reading shell — Eutectic',
  description: 'frontend-spec §7.1 reading shell — single column, 720px, back link.',
};

/*
 * Demo route for the §7.1 reading shell. Placeholder prose only; the entry and
 * thread components that fill it are other tickets.
 */

const paragraphs = [
  'Single column, capped at 720px, entered from a feed and left by the back link above (§7.1). No rails at any width, so §7.2 changes nothing here but the gutter below 480px.',
  'Prose inside the shell is still capped at 64ch by the measure token — the 720px column is the shell, the 64ch line is the text (§1 row 12).',
  'Used by thread, diary, argument, product and finding.',
];

export default function ReadingShellProbePage() {
  return (
    <ReadingShell back={{ href: '/probe/shells', label: 'Back to the shells' }}>
      <h1 className="font-prose text-head text-ink">Reading shell</h1>

      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="measure mt-5 font-ui text-body text-ink-soft">
          {paragraph}
        </p>
      ))}
    </ReadingShell>
  );
}
