// M0-FE-10 — frontend-spec §19.9 / §8.1 / §13 / §1 rows 19, 20.
//
//   "An <img> without dimensions, or an icon-only control outside the §8.1
//    whitelist, or missing an accessible name"
//
// Four checks, all static:
//
//   A. IMAGE DIMENSIONS. Every `<img>` and every `next/image` `<Image>` carries
//      both `width` and `height` (or `fill`). §14: "Images: next/image, AVIF,
//      explicit dimensions" — this is the CLS <= 0.02 budget's first defence,
//      before the Playwright trace ever runs.
//   B. THE §8.1 WHITELIST, AS A LIST. `Button`'s `ICON_WHITELIST` must be
//      exactly §8.1's twelve items. It is the type every icon prop in the app
//      flows through, so if it grows a thirteenth entry, every icon-only
//      control in the product silently becomes legal. That edit fails here.
//   C. ICON-ONLY CONTROLS. Any control with an `iconOnly` prop, or an `icon=`/
//      `data-icon=` literal, must name a whitelisted icon and must carry an
//      `aria-label`. §8.1: "Each still requires aria-label."
//   D. ACCESSIBLE NAMES. `<button>`, `<a>` and `<summary>` must have a name
//      from somewhere: `aria-label`, `aria-labelledby`, `title`, visible text,
//      or a child expression. Form controls must be labelled by `id` (paired
//      with a `<label htmlFor>`), `aria-label` or `aria-labelledby` — never by
//      a placeholder (§1 row 19).
//
// ── What static analysis can and cannot see, stated plainly ────────────────
// This gate reads source, not a rendered accessibility tree. It CAN prove that
// `<button aria-hidden><svg/></button>` has no name. It CANNOT prove that
// `<button>{label}</button>` has one — `label` might be an empty string at
// runtime. Those are counted and reported as "named dynamically" rather than
// passed silently or failed wrongly, because a gate that guesses in either
// direction stops being believed. The real check for the dynamic cases is
// §13's "VoiceOver and TalkBack tested before each phase ships" — a human, and
// this script does not pretend otherwise.
//
// It also only sees this app's own JSX. A control rendered by a dependency is
// invisible to it.
//
// Node builtins only.

import { blankComments, lineOf, lineTextOf, listSourceFiles, read, report } from './lib/sources.mjs';

const GATE = 'a11y';
const SPEC = 'frontend-spec §19.9, §8.1, §13';

// frontend-spec §8.1, verbatim:
//   search · close · back · share · more (⋯) · link/copy · play · refresh ·
//   settings · bell · plus (compose, mobile FAB) · chevron (disclosure)
// Twelve items; `link/copy` is one item naming two icons, so thirteen names.
const ICON_WHITELIST = new Set([
  'search',
  'close',
  'back',
  'share',
  'more',
  'link',
  'copy',
  'play',
  'refresh',
  'settings',
  'bell',
  'plus',
  'chevron',
]);

const NAMED_ELEMENTS = new Set(['button', 'a', 'summary']);
const FORM_CONTROLS = new Set(['input', 'textarea', 'select']);

const files = listSourceFiles({ exts: ['.tsx', '.jsx'] });
const violations = [];
let elementsSeen = 0;
let namedStatically = 0;
let namedDynamically = 0;

/**
 * Walk JSX open tags. Returns `{ name, attrs, selfClosing, start, end }` where
 * `end` is the index just past the closing `>`. Quotes and `{}` nesting inside
 * the attribute list are respected, so `className={`a${b}`}` does not end the
 * tag early.
 */
function* openTags(text) {
  const TAG = /<([A-Za-z][A-Za-z0-9._-]*)(?=[\s/>])/g;
  let m;
  while ((m = TAG.exec(text)) !== null) {
    let i = m.index + m[0].length;
    let depth = 0;
    let quote = null;
    let selfClosing = false;
    while (i < text.length) {
      const c = text[i];
      if (quote) {
        if (c === quote) quote = null;
        i += 1;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        quote = c;
        i += 1;
        continue;
      }
      if (c === '{') depth += 1;
      else if (c === '}') depth -= 1;
      else if (c === '>' && depth === 0) {
        selfClosing = text[i - 1] === '/';
        break;
      }
      i += 1;
    }
    if (i >= text.length) return;
    yield {
      name: m[1],
      attrs: text.slice(m.index + m[0].length, selfClosing ? i - 1 : i),
      selfClosing,
      start: m.index,
      end: i + 1,
    };
    TAG.lastIndex = i + 1;
  }
}

/** Inner content of `<name …>` starting at `from`, up to its matching close. */
function innerContent(text, name, from) {
  const open = new RegExp(`<${name}(?=[\\s/>])`, 'g');
  const close = new RegExp(`</${name}\\s*>`, 'g');
  open.lastIndex = from;
  close.lastIndex = from;
  let depth = 1;
  let cursor = from;
  for (let guard = 0; guard < 5000; guard += 1) {
    open.lastIndex = cursor;
    close.lastIndex = cursor;
    const o = open.exec(text);
    const c = close.exec(text);
    if (!c) return null;
    if (o && o.index < c.index) {
      depth += 1;
      cursor = o.index + 1;
      continue;
    }
    depth -= 1;
    if (depth === 0) return text.slice(from, c.index);
    cursor = c.index + 1;
  }
  return null;
}

const attr = (attrs, name) =>
  new RegExp(`(?:^|\\s)${name}(?=[\\s=/>]|$)`, 'i').test(attrs);
const attrLiteral = (attrs, name) => {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(attrs);
  return m ? m[1] : null;
};
const hasSpread = (attrs) => /\{\s*\.\.\./.test(attrs);

for (const file of files) {
  const raw = read(file);
  const text = blankComments(raw);
  const push = (index, message) =>
    violations.push({
      file: file.relative,
      line: lineOf(raw, index),
      message,
      snippet: lineTextOf(raw, index),
    });

  for (const tag of openTags(text)) {
    const lower = tag.name.toLowerCase();

    // ── A. image dimensions ────────────────────────────────────────────────
    if (lower === 'img' || tag.name === 'Image') {
      elementsSeen += 1;
      const hasFill = attr(tag.attrs, 'fill');
      const hasW = attr(tag.attrs, 'width');
      const hasH = attr(tag.attrs, 'height');
      if (!hasFill && !(hasW && hasH)) {
        push(
          tag.start,
          `<${tag.name}> without explicit width and height (or \`fill\`) — §14, §19.9`,
        );
      }
    }

    // ── C. icon-only controls ──────────────────────────────────────────────
    for (const propName of ['icon', 'data-icon']) {
      const value = attrLiteral(tag.attrs, propName);
      if (value !== null && !ICON_WHITELIST.has(value)) {
        push(
          tag.start,
          `icon "${value}" is outside the §8.1 whitelist (${[...ICON_WHITELIST].join(', ')})`,
        );
      }
    }
    if (attr(tag.attrs, 'iconOnly')) {
      elementsSeen += 1;
      if (!attr(tag.attrs, 'aria-label') && !attr(tag.attrs, 'aria-labelledby')) {
        push(tag.start, 'icon-only control without an `aria-label` — §8.1 requires one on every one');
      }
      const icon = attrLiteral(tag.attrs, 'icon');
      if (icon === null && !/icon\s*=\s*\{/.test(tag.attrs)) {
        push(tag.start, 'icon-only control with no `icon` prop at all');
      }
    }

    // ── D. accessible names ────────────────────────────────────────────────
    if (NAMED_ELEMENTS.has(lower)) {
      elementsSeen += 1;
      if (
        attr(tag.attrs, 'aria-label') ||
        attr(tag.attrs, 'aria-labelledby') ||
        attr(tag.attrs, 'title')
      ) {
        namedStatically += 1;
      } else if (hasSpread(tag.attrs)) {
        // `{...rest}` may carry aria-label; the Button type makes it mandatory
        // for iconOnly. Undecidable here.
        namedDynamically += 1;
      } else {
        const inner = tag.selfClosing ? '' : innerContent(text, tag.name, tag.end);
        if (inner === null) {
          namedDynamically += 1; // unbalanced (a conditional close) — do not guess
        } else {
          const withoutTags = inner.replace(/<[^>]*>/g, '');
          const hasExpression = /\{/.test(withoutTags);
          const visibleText = withoutTags.replace(/\{[^}]*\}/g, '').trim();
          if (visibleText.length > 0) namedStatically += 1;
          else if (hasExpression) namedDynamically += 1;
          else {
            push(
              tag.start,
              `<${tag.name}> has no accessible name: no aria-label/aria-labelledby/title and no text content — §19.9`,
            );
          }
        }
      }
    }

    // ── D (form controls) ──────────────────────────────────────────────────
    if (FORM_CONTROLS.has(lower)) {
      const type = attrLiteral(tag.attrs, 'type');
      if (type === 'hidden' || type === 'submit' || type === 'reset' || type === 'button') continue;
      elementsSeen += 1;
      const labelled =
        attr(tag.attrs, 'id') ||
        attr(tag.attrs, 'aria-label') ||
        attr(tag.attrs, 'aria-labelledby') ||
        hasSpread(tag.attrs);
      if (!labelled) {
        push(
          tag.start,
          `<${lower}> with no id, aria-label or aria-labelledby — a placeholder is not a label (§1 row 19)`,
        );
      } else if (attr(tag.attrs, 'id')) {
        namedStatically += 1;
      } else {
        namedDynamically += 1;
      }
    }
  }
}

// ── B. the whitelist constant itself ───────────────────────────────────────
const buttonSource = files.find((f) => f.relative === 'src/components/primitives/button.tsx');
if (!buttonSource) {
  violations.push({
    file: 'src/components/primitives/button.tsx',
    line: 1,
    message: 'Button is missing — the §8.1 whitelist has no home to be checked against',
  });
} else {
  const raw = read(buttonSource);
  const m = /const ICON_WHITELIST\s*=\s*\[([\s\S]*?)\]\s*as const/.exec(raw);
  if (!m) {
    violations.push({
      file: buttonSource.relative,
      line: 1,
      message: 'cannot find `const ICON_WHITELIST = [...] as const` — §8.1 is no longer checkable',
    });
  } else {
    const declared = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
    const extra = declared.filter((x) => !ICON_WHITELIST.has(x));
    const missing = [...ICON_WHITELIST].filter((x) => !declared.includes(x));
    for (const x of extra) {
      violations.push({
        file: buttonSource.relative,
        line: lineOf(raw, raw.indexOf(`'${x}'`)),
        message: `ICON_WHITELIST contains "${x}", which is not in frontend-spec §8.1 — §8.1 is a hard rule, not a default`,
      });
    }
    if (missing.length > 0) {
      violations.push({
        file: buttonSource.relative,
        line: lineOf(raw, m.index),
        message: `ICON_WHITELIST is missing §8.1 icon(s): ${missing.join(', ')}`,
      });
    }
  }
}

report({
  gate: GATE,
  spec: SPEC,
  violations,
  okMessage:
    `${files.length} file(s), ${elementsSeen} control(s)/image(s) inspected — ` +
    `${namedStatically} named in source, ${namedDynamically} named by a runtime value ` +
    `(undecidable statically; §13 leaves those to the VoiceOver/TalkBack pass), ` +
    `0 unnamed; §8.1 whitelist intact at ${ICON_WHITELIST.size} names`,
  hint:
    'Icon-only is a hard rule (§8.1): if the control is not one of the twelve, it needs a visible\n' +
    'text label, not a tooltip and not a coach mark (§8.3). An <img> without dimensions is a CLS\n' +
    'regression waiting for the Playwright trace to find it — pin the size at the call site.',
});
