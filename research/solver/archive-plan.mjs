// ARCHIVE THE PLAN'S CLOSED ROWS (RULES.md section 10, the feedback loop; drafts/feedback-loop-plan.md amended by the
// deep review, amendment 6). PLAN.md is read by every reviewer and grows by about 75 KB a day; rows that no longer steer
// anything move VERBATIM to PLAN-HISTORY.md, and PLAN.md keeps one pointer line per table naming each moved row:
//   - the register's resolved and closed rows (their status cell starts "resolved" or "closed");
//   - the ledger's rows beyond its newest LEDGER_KEEP, and its deep-review rows dated on or before the cut-off (their bold
//     headline starts "The ... deep review"; each review's receipt is deep-review-log.md);
//   - the schedule's rows whose status starts DONE, CANCELLED, SUPERSEDED or EXPIRED.
// The cut-off is the date of the newest-but-two close in lessons.md (28 Sep until there are three). Nothing is reworded.
// Run at every close (the plan-update skill); the plan checker's budget refuses an over-budget PLAN.md only when this
// has something to move. record-review.mjs --moved records the move's receipt when it is verified verbatim.
//   node research/solver/archive-plan.mjs [--cutoff "28 Sep"] [--apply]
// planMoves() and applyMoves() are pure, for research/tests/triggers.test.mjs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessonsOf } from './triggers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), PLAN = join(HERE, 'PLAN.md'), HIST = join(HERE, 'PLAN-HISTORY.md');
export const LEDGER_KEEP = 15;
// kept whatever their status: the plan checker's own test (locked) plants a duplicate id by renaming PLAN.md's O2 row to
// O1, and reads O7's row, so all three must stay for its planted faults to plant (found when the first archive failed it, 30 Sep)
export const KEEP = new Set(['O1', 'O2', 'O7']);
export const POINTER = /^(Resolved and closed rows|Ledger rows|Schedule rows|Deep-review rows to \d{1,2} [A-Z][a-z]{2}) archived \d{4}-\d{2}-\d{2}, verbatim, in PLAN-HISTORY\.md/;
const MON = { Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const dayOf = s => { const m = /^(\d{1,2}) ([A-Z][a-z]{2})/.exec(String(s).trim()); return m && MON[m[2]] ? MON[m[2]] * 100 + Number(m[1]) : null; };
/* the cut-off: the newest-but-two close's date */
export function cutoffOf(lessonsText) {
  const c = lessonsOf(lessonsText).closes.map(x => x.when).filter(Boolean);
  return c.length >= 3 ? c[c.length - 3].replace(/ \d{1,2}:\d{2}.*$/, '') : '28 Sep';
}
const key = l => (/^\| ([^|]+?) \|/.exec(l) || [])[1];
const last = l => { const c = l.split(' | '); return (c[c.length - 1] || '').replace(/\|\s*$/, '').replace(/\*\*/g, '').trim(); };
function tableAt(lines, test) { const i = lines.findIndex(test); if (i < 0) return null; let a = i; while (a < lines.length && !lines[a].startsWith('|')) a++; let b = a; while (b < lines.length && lines[b].startsWith('|')) b++; return [a, b]; }
/* what would move: { reg, led, sch } as line indexes, each table's [start, end), and the cut-off used */
export function planMoves(text, cutoff = '28 Sep') {
  const lines = text.split('\n'), CUT = dayOf(cutoff);
  if (!CUT) throw new Error(`archive-plan: bad cut-off ${cutoff}`);
  const REG = tableAt(lines, l => l.startsWith('## Odd results register'));
  const LED = tableAt(lines, l => l.startsWith('| date | the settled result |'));
  const SCH = tableAt(lines, l => l.startsWith('## The schedule'));
  if (!REG || !LED) throw new Error('archive-plan: the register or the ledger table was not found');
  const reg = [], led = [], sch = [];
  for (let i = REG[0] + 2; i < REG[1]; i++) { const k = key(lines[i]) || ''; if (/^O\d+$/.test(k) && !KEEP.has(k) && /^(resolved|closed)\b/.test(last(lines[i]))) reg.push(i); }
  for (let i = LED[0] + 2, n = 0; i < LED[1]; i++) {
    const k = key(lines[i]) || '', d = dayOf(k); if (!d) continue;
    n++;
    const head = (/\*\*([^*]+)\*\*/.exec(lines[i]) || [])[1] || '';
    if (n > LEDGER_KEEP || (d <= CUT && /^The (\w+ )?deep review/i.test(head.trim()))) led.push(i);
  }
  if (SCH) for (let i = SCH[0] + 2; i < SCH[1]; i++) if (/^(DONE|CANCELLED|SUPERSEDED|EXPIRED)\b/.test(last(lines[i]))) sch.push(i);
  return { lines, reg, led, sch, tables: { REG, LED, SCH }, cutoff };
}
export const bytesOf = (lines, is) => is.reduce((t, i) => t + lines[i].length + 1, 0);
/* the new plan and the history's addition, with the pointer lines */
export function applyMoves(m, stamp) {
  const { lines, reg, led, sch, tables } = m, drop = new Set([...reg, ...led, ...sch]);
  const names = is => is.map(i => key(lines[i])).join('; ');
  const pointers = new Map();
  if (reg.length) pointers.set(tables.REG[1] - 1, `Resolved and closed rows archived ${stamp}, verbatim, in PLAN-HISTORY.md ("Archived from PLAN.md"): ${names(reg)}.`);
  if (led.length) pointers.set(tables.LED[1] - 1, `Ledger rows archived ${stamp}, verbatim, in PLAN-HISTORY.md ("Archived from PLAN.md": the rows beyond the newest ${LEDGER_KEEP} and the deep-review rows to ${m.cutoff}); a live row citing "the <time> row" of these, or a moved register id, points there: ${names(led)}.`);
  if (sch.length && tables.SCH) pointers.set(tables.SCH[1] - 1, `Schedule rows archived ${stamp}, verbatim, in PLAN-HISTORY.md ("Archived from PLAN.md"): ${names(sch)}.`);
  const out = [];
  lines.forEach((l, i) => { if (!drop.has(i)) out.push(l); if (pointers.has(i)) out.push('', pointers.get(i)); });
  const block = (title, t, is) => (is.length ? [`### ${title}`, '', lines[t[0]], lines[t[0] + 1], ...is.map(i => lines[i]), ''] : []);
  const hist = ['', '---', '', `## Archived from PLAN.md on ${stamp} (archive-plan.mjs; verbatim)`, '',
    ...block('The register\'s resolved and closed rows', tables.REG, reg), ...block('The ledger\'s older and deep-review rows', tables.LED, led), ...(tables.SCH ? block('The schedule\'s finished rows', tables.SCH, sch) : [])];
  return { plan: out.join('\n'), hist: hist.join('\n'), moved: drop.size };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2), ci = argv.indexOf('--cutoff'), APPLY = argv.includes('--apply');
  const lessons = existsSync(join(HERE, 'lessons.md')) ? readFileSync(join(HERE, 'lessons.md'), 'utf8') : '';
  const cutoff = ci >= 0 ? argv[ci + 1] : cutoffOf(lessons);
  const text = readFileSync(PLAN, 'utf8'), m = planMoves(text, cutoff);
  console.log(`ARCHIVE (${APPLY ? 'applying' : 'dry run'}; the deep-review cut-off ${cutoff}; the ledger keeps its newest ${LEDGER_KEEP}):`);
  console.log(`  register: ${m.reg.length} rows, ${bytesOf(m.lines, m.reg)} bytes; ledger: ${m.led.length} rows, ${bytesOf(m.lines, m.led)} bytes; schedule: ${m.sch.length} rows, ${bytesOf(m.lines, m.sch)} bytes`);
  const total = m.reg.length + m.led.length + m.sch.length;
  console.log(`  PLAN.md ${text.length} bytes -> about ${text.length - bytesOf(m.lines, [...m.reg, ...m.led, ...m.sch])}`);
  if (!APPLY || !total) process.exit(0);
  const r = applyMoves(m, new Date().toISOString().slice(0, 10));
  writeFileSync(PLAN, r.plan);
  writeFileSync(HIST, readFileSync(HIST, 'utf8').replace(/\n*$/, '\n') + r.hist);
  const H = readFileSync(HIST, 'utf8'), P = new Set(readFileSync(PLAN, 'utf8').split('\n'));
  const bad = [...m.reg, ...m.led, ...m.sch].filter(i => !H.includes(m.lines[i]) || P.has(m.lines[i]));
  if (bad.length) { console.error(`archive-plan: ${bad.length} rows not moved verbatim`); process.exit(1); }
  console.log(`  applied: ${r.moved} rows moved verbatim; PLAN.md now ${readFileSync(PLAN, 'utf8').length} bytes; record its receipt: node research/solver/record-review.mjs --moved`);
}
