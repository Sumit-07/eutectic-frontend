// M0-FE-10 — shared helpers for the frontend-spec §19 gates.
//
// Every gate in this directory is a plain Node script with no dependencies, so
// the three things they all need — "list the source files", "ignore comments",
// "report a violation the same way" — live here rather than being written five
// times with five slightly different bugs.
//
// Node builtins only (CLAUDE.md rule 12 / §19.10). Nothing here imports from
// the app.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path of `apps/web`. */
export const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Directories a gate may scan. Anything outside these is not this app's code. */
export const SOURCE_DIRS = ['src', '.storybook'];

const SKIP_DIR_NAMES = new Set(['node_modules', '.next', 'storybook-static', 'test-results']);

/**
 * Every file under `dirs` (relative to apps/web) whose extension is in `exts`.
 * Returned sorted, as `{ absolute, relative }`, so a gate's output is stable
 * across machines and a diff of two runs means something.
 */
export function listSourceFiles({ exts, dirs = SOURCE_DIRS } = {}) {
  const wanted = new Set(exts);
  const out = [];

  function walk(absoluteDir) {
    let entries;
    try {
      entries = readdirSync(absoluteDir, { withFileTypes: true });
    } catch {
      return; // an optional directory (.storybook in a stripped checkout)
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.storybook') {
        // dotfiles are config, not app source; .storybook is passed in explicitly
        if (entry.isDirectory()) continue;
      }
      if (SKIP_DIR_NAMES.has(entry.name)) continue;
      const absolute = path.join(absoluteDir, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile() && wanted.has(path.extname(entry.name))) {
        out.push({ absolute, relative: path.relative(webRoot, absolute) });
      }
    }
  }

  for (const dir of dirs) {
    const absolute = path.join(webRoot, dir);
    try {
      if (statSync(absolute).isDirectory()) walk(absolute);
    } catch {
      /* optional directory */
    }
  }

  return out.sort((a, b) => a.relative.localeCompare(b.relative));
}

export function read(file) {
  return readFileSync(file.absolute ?? file, 'utf8');
}

/**
 * Blank out comments while preserving every byte offset and line number, so a
 * gate can regex the result and still report a truthful `file:line`.
 *
 * Handles `//`, `/* … *\/`, single/double-quoted strings and template literals.
 * It does NOT understand regex literals: a regex containing a quote character
 * (`/['"]/`) would desynchronise the scanner. That is a deliberate limit, not
 * an oversight — a full parser is a dependency, and the failure mode is a loud
 * false positive on a line a human can read, never a silent miss of a real
 * violation somewhere else. If a regex literal ever needs to live in this app's
 * source, this is the function to fix.
 */
export function blankComments(text) {
  const out = text.split('');
  const n = text.length;
  let i = 0;
  let state = 'code'; // code | line-comment | block-comment | single | double | template
  const blank = (index) => {
    if (out[index] !== '\n') out[index] = ' ';
  };

  while (i < n) {
    const c = text[i];
    const next = text[i + 1];
    if (state === 'code') {
      if (c === '/' && next === '/') {
        state = 'line-comment';
        blank(i);
        blank(i + 1);
        i += 2;
        continue;
      }
      if (c === '/' && next === '*') {
        state = 'block-comment';
        blank(i);
        blank(i + 1);
        i += 2;
        continue;
      }
      if (c === "'") state = 'single';
      else if (c === '"') state = 'double';
      else if (c === '`') state = 'template';
      i += 1;
      continue;
    }
    if (state === 'line-comment') {
      if (c === '\n') state = 'code';
      else blank(i);
      i += 1;
      continue;
    }
    if (state === 'block-comment') {
      if (c === '*' && next === '/') {
        blank(i);
        blank(i + 1);
        state = 'code';
        i += 2;
        continue;
      }
      blank(i);
      i += 1;
      continue;
    }
    // inside a string of some kind
    if (c === '\\') {
      i += 2;
      continue;
    }
    if (
      (state === 'single' && c === "'") ||
      (state === 'double' && c === '"') ||
      (state === 'template' && c === '`')
    ) {
      state = 'code';
    }
    i += 1;
  }

  return out.join('');
}

/** 1-based line number of a byte offset. */
export function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i += 1) {
    if (text[i] === '\n') line += 1;
  }
  return line;
}

/** The full source line containing `index`, trimmed for display. */
export function lineTextOf(text, index) {
  const start = text.lastIndexOf('\n', index) + 1;
  let end = text.indexOf('\n', index);
  if (end === -1) end = text.length;
  return text.slice(start, end).trim();
}

/**
 * Uniform reporting. `violations` is `{ file, line, message, snippet? }[]`.
 * Prints the §19 gate name, every violation, and exits 1 — or prints the OK
 * line and returns. A gate that finds nothing still prints what it looked at,
 * because a gate whose output is silence is indistinguishable from a gate that
 * did not run.
 */
export function report({ gate, spec, violations, okMessage, hint }) {
  if (violations.length > 0) {
    process.stderr.write(`${gate}: FAILED — ${violations.length} violation(s) (${spec})\n\n`);
    for (const v of violations) {
      process.stderr.write(`  ${v.file}:${v.line}  ${v.message}\n`);
      if (v.snippet) process.stderr.write(`      ${v.snippet}\n`);
    }
    if (hint) process.stderr.write(`\n${hint}\n`);
    process.exit(1);
  }
  process.stdout.write(`${gate}: OK — ${okMessage}\n`);
}
