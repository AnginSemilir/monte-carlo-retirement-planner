// ARCHIVE THE PLAN'S CLOSED ROWS (drafts/framework-feedback-review.md, P1-P2; the maintainer's go-ahead, 30 Sep 18:47 UK:
// "do 1-4"). PLAN.md is read whole by every reviewer that needs it and grows by about 75 KB a day; rows that no longer
// steer anything move VERBATIM to PLAN-HISTORY.md, and PLAN.md keeps a pointer line naming each moved row:
//   - the register's resolved and closed rows (their status cell starts "resolved" or "closed");
//   - the ledger's deep-review rows dated on or before the cut-off (their bold headline starts "The ... deep review"):
//     each review's receipt is deep-review-log.md, and what it changed is in the rows it changed.
// Nothing is reworded. Dry run by default (prints what would move and the bytes); --apply writes both files.
//   node research/solver/archive-plan.mjs [--cutoff "28 Sep"] [--apply]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), PLAN = join(HERE, 'PLAN.md'), HIST = join(HERE, 'PLAN-HISTORY.md');
const argv = process.argv.slice(2), ci = argv.indexOf('--cutoff'), APPLY = argv.includes('--apply'), CUTS = ci >= 0 ? argv[ci + 1] : '28 Sep';
// kept whatever their status: the plan checker's own test (locked) plants a duplicate id by renaming PLAN.md's O2 row to
// O1, and reads O7's row, so all three must stay for its planted faults to plant (found when the first archive failed it, 30 Sep)
const KEEP = new Set(['O1', 'O2', 'O7']);
const MON = { Sep: 9, Oct: 10, Nov: 11 };
const dayOf = s => { const m = /^(\d{1,2}) ([A-Z][a-z]{2})/.exec(s.trim()); return m && MON[m[2]] ? MON[m[2]] * 100 + Number(m[1]) : null; };
const CUT = dayOf(CUTS);
if (!CUT) { console.error('archive-plan: bad --cutoff (e.g. "28 Sep")'); process.exit(2); }
const text = readFileSync(PLAN, 'utf8'), lines = text.split('\n');
const cells = l => l.split(' | ');
const key = l => (/^\| ([^|]+?) \|/.exec(l) || [])[1];
const last = l => { const c = cells(l); return (c[c.length - 1] || '').replace(/\|\s*$/, '').replace(/\*\*/g, '').trim(); };
// the two tables, by their headings
const sectionOf = (heading) => { const i = lines.findIndex(l => l.startsWith(heading)); if (i < 0) return null; let a = i + 1; while (a < lines.length && !lines[a].startsWith('|')) a++; let b = a; while (b < lines.length && lines[b].startsWith('|')) b++; return [a, b]; };
const REG = sectionOf('## Odd results register');
const LEDI = lines.findIndex(l => l.startsWith('| date | the settled result |'));
if (!REG || LEDI < 0) { console.error('archive-plan: the register or the ledger table was not found'); process.exit(2); }
let lb = LEDI; while (lb < lines.length && lines[lb].startsWith('|')) lb++;
const moveReg = [], moveLed = [];
for (let i = REG[0] + 2; i < REG[1]; i++) if (/^O\d+$/.test(key(lines[i]) || '') && !KEEP.has(key(lines[i])) && /^(resolved|closed)\b/.test(last(lines[i]))) moveReg.push(i);
for (let i = LEDI + 2; i < lb; i++) {
  const k = key(lines[i]) || '', d = dayOf(k), head = (/\*\*([^*]+)\*\*/.exec(lines[i]) || [])[1] || '';
  if (d && d <= CUT && /^The (\w+ )?deep review/i.test(head.trim())) moveLed.push(i);
}
const bytes = is => is.reduce((t, i) => t + lines[i].length + 1, 0);
console.log(`ARCHIVE (${APPLY ? 'applying' : 'dry run'}; cut-off for ledger rows ${CUTS}):`);
console.log(`  register: ${moveReg.length} resolved or closed rows, ${bytes(moveReg)} bytes: ${moveReg.map(i => key(lines[i])).join(', ')}`);
console.log(`  ledger: ${moveLed.length} deep-review rows, ${bytes(moveLed)} bytes: ${moveLed.map(i => key(lines[i])).join('; ')}`);
console.log(`  PLAN.md ${text.length} bytes -> about ${text.length - bytes(moveReg) - bytes(moveLed)}`);
if (!APPLY) process.exit(0);
const stamp = new Date().toISOString().slice(0, 10);
const regIds = moveReg.map(i => key(lines[i])), ledKeys = moveLed.map(i => key(lines[i]));
const hist = [
  '', '---', '', `## Archived from PLAN.md on ${stamp} (archive-plan.mjs; verbatim)`, '',
  `### The register's resolved and closed rows (${regIds.join(', ')})`, '', lines[REG[0]], lines[REG[0] + 1], ...moveReg.map(i => lines[i]), '',
  `### The ledger's deep-review rows to ${CUTS} (receipts: deep-review-log.md)`, '', lines[LEDI], lines[LEDI + 1], ...moveLed.map(i => lines[i]), ''];
const drop = new Set([...moveReg, ...moveLed]);
const out = [];
lines.forEach((l, i) => {
  if (!drop.has(i)) out.push(l);   // the pointer lines follow a table's last row even when that row itself moves
  if (i === REG[1] - 1) out.push('', `Resolved and closed rows archived ${stamp}, verbatim, in PLAN-HISTORY.md ("Archived from PLAN.md"): ${regIds.join(', ')}.`);
  if (i === lb - 1) out.push('', `Deep-review rows to ${CUTS} archived ${stamp}, verbatim, in PLAN-HISTORY.md ("Archived from PLAN.md"): ${ledKeys.join('; ')}.`);
});
writeFileSync(PLAN, out.join('\n'));
writeFileSync(HIST, readFileSync(HIST, 'utf8').replace(/\n*$/, '\n') + hist.join('\n'));
// verbatim: every moved line is in the history exactly once more than before, and no longer in the plan
const H = readFileSync(HIST, 'utf8'), P = readFileSync(PLAN, 'utf8');
const bad = [...drop].filter(i => !H.includes(lines[i]) || P.split('\n').includes(lines[i]));
if (bad.length) { console.error(`archive-plan: ${bad.length} rows not moved verbatim`); process.exit(1); }
console.log(`  applied: ${drop.size} rows moved verbatim; PLAN.md now ${P.length} bytes`);
