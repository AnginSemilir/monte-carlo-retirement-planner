/*
 * THE STATE FILE'S CHECK (the external review of 21 Oct, Part B Step 3; CHECKLIST.md item 6). research/solver/STATE.md is
 * read whole at every session start, so it stays short and its figures are printed, never typed:
 *   - at most 300 lines, with its six sections in order;
 *   - every printed block is what `state.mjs` prints from the results files now;
 *   - no figure is typed outside a printed block: a decimal, a percentage or a sum in pounds is refused anywhere else,
 *     except inside backticks (a setting, a command, a path) and inside the decided-defaults block (the configuration
 *     the defaults tests pin to the code).
 *   node research/solver/check-state.mjs [STATE.md]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBlocks } from './state.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const MAX_LINES = 300;
export const SECTIONS = ['## 1. ', '## 2. ', '## 3. ', '## 4. ', '## 5. ', '## 6. '];
const FIGURE = /\d+\.\d+|\d+\s?%|£\s?\d/;

/* the problems with a state text that need no results files: its length, its sections, figures typed by hand */
export function textProblems(text) {
  const P = [], lines = text.split('\n');
  if (lines.length > MAX_LINES) P.push(`STATE.md has ${lines.length} lines; the limit is ${MAX_LINES}`);
  let at = -1;
  for (const s of SECTIONS) {
    const i = lines.findIndex(l => l.startsWith(s));
    if (i < 0) P.push(`STATE.md has no section "${s.trim()}"`);
    else if (i < at) P.push(`STATE.md's section "${s.trim()}" is out of order`);
    else at = i;
  }
  // blank out what may carry figures: printed blocks, the decided-defaults block, inline code
  const bare = text
    .replace(/<!-- printed:(\w+) -->[\s\S]*?<!-- end printed:\1 -->/g, '')
    .replace(/<!-- decided-defaults[\s\S]*?-->/g, '')
    .replace(/`[^`\n]*`/g, '');
  bare.split('\n').forEach((l, i) => { const m = FIGURE.exec(l); if (m) P.push(`a figure typed by hand ("${m[0]}") outside a printed block: "${l.trim().slice(0, 80)}"`); });
  return P;
}
export async function stateProblems(text) { return [...textProblems(text), ...(await checkBlocks(text))]; }

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const file = process.argv[2] || join(HERE, 'STATE.md');
  const P = await stateProblems(readFileSync(file, 'utf8'));
  if (P.length) { console.log(`check-state: ${file}\n${P.map(p => `  - ${p}`).join('\n')}`); process.exit(1); }
  console.log(`check-state: ${file} passes (${readFileSync(file, 'utf8').split('\n').length} lines)`);
}
