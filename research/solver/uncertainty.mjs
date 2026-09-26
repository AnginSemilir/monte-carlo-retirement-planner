/*
 * THE UNCERTAINTY INDEX, AND WHETHER A DEEP REVIEW IS DUE (RULES.md section 9; drafts/unmasking-proposal.md section 4;
 * the maintainer, 26 Sep: "automated deep thought review on a periodic basis based on the level of uncertainty of the
 * model"). Read from the records, printed with its parts:
 *   - calibration: the Brier score over the last 10 scored items (results-scorecard.txt, in its order);
 *   - surprises since the last deep review: scored items missed at credence 0.8 or more, or held at 0.3 or less, in the
 *     tests after the one the last receipt covered;
 *   - families: the largest number of OPEN register items (PLAN.md's odd-results register) sharing one "family: <name>";
 *   - weak foundations: ledger rows after the last receipt whose evidence cell grades something C or D;
 *   - unmasking flags: ledger rows after the last receipt reading FALSIFIED or harm on a fix (their title);
 *   - settled results: ledger rows after the last receipt that name a prediction file.
 * The level is HIGH when calibration is over 0.25, there are 2 surprises or a family of 3; MEDIUM when calibration is over
 * 0.20, there is a surprise, an unmasking flag, or 2 weak foundations; else LOW. A deep review is DUE when the settled
 * results since the last receipt reach 6 (LOW), 3 (MEDIUM) or 1 (HIGH): at HIGH every settled result gets one, and a
 * receipt with nothing settled after it is not due again (calibration and families do not reset at a receipt, so a level
 * alone would keep the Stop hook blocked for ever).
 * The last receipt: the newest line of deep-review-log.md, "- <dd Mon HH:MM> UK | covered <test name> | ...".
 *   node research/solver/uncertainty.mjs            the index and whether a review is due
 *   node research/solver/uncertainty.mjs --due      exit 1 when a review is due (for a hook), else 0
 *   node research/solver/uncertainty.mjs --planted  the planted checks alone
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
// "26 Sep 16:02" -> a sortable number (the year is not written in the ledger; the research runs within one year)
export const stamp = s => { const m = /(\d{1,2}) (\w{3})\w* (\d{2}):(\d{2})/.exec(s || ''); return m ? ((MONTHS[m[2]] * 31 + +m[1]) * 24 + +m[3]) * 60 + +m[4] : null; };

// the scorecard's tests, in order, each with its items [credence, held]
export function scoredTests(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const m = /^(.+?): Brier [\d.]+ over \d+ \((.*)\)$/.exec(line);
    if (!m) continue;
    const items = [...m[2].matchAll(/(?:^|; )[^;]*?(0?\.\d+|1(?:\.0+)?) -> (held|not)/g)].map(x => [Number(x[1]), x[2] === 'held' ? 1 : 0]);
    out.push({ name: m[1].trim(), items });
  }
  return out;
}
const brier = items => items.length ? items.reduce((a, [p, o]) => a + (p - o) ** 2, 0) / items.length : null;

// the register's open items and their families; the ledger's rows after a time
export function registerFamilies(plan) {
  const fam = {};
  for (const line of plan.split('\n')) {
    if (!/^\| O\d+ \|/.test(line)) continue;
    const cells = line.split(' | '), status = (cells[cells.length - 1] || '').replace(/\|\s*$/, '').trim();
    if (!/^open/i.test(status)) continue;
    const f = /family: ([\w -]+?)\s*(?:[;.,)|]|$)/i.exec(line);
    if (f) fam[f[1].trim()] = (fam[f[1].trim()] || 0) + 1;
  }
  return fam;
}
export function ledgerAfter(plan, after) {
  return plan.split('\n').filter(l => /^\| \d{1,2} \w{3} \d{2}:\d{2} \|/.test(l)).map(l => ({ t: stamp(l.slice(2, 14)), line: l })).filter(r => after === null || r.t > after);
}
export function index({ scorecard, plan, log }) {
  const tests = scoredTests(scorecard);
  const last = (log || '').split('\n').filter(l => /^- .* UK \| covered /.test(l)).pop() || null;
  const since = last ? stamp(last) : null, covered = last ? /\| covered (.+?) \|/.exec(last)[1].trim() : null;
  const all = tests.flatMap(t => t.items), cal = brier(all.slice(-10));
  const after = covered === null ? tests : tests.slice(tests.findIndex(t => t.name === covered) + 1);
  const surprises = after.flatMap(t => t.items.filter(([p, o]) => (p >= 0.8 && !o) || (p <= 0.3 && o)).map(([p, o]) => `${t.name} ${p} ${o ? 'held' : 'missed'}`));
  const fams = registerFamilies(plan), family = Math.max(0, ...Object.values(fams));
  const rows = ledgerAfter(plan, since);
  const weak = rows.filter(r => /grade [CD]\b/.test(r.line.split(' | ').slice(-1)[0] || '')).length;
  const unmask = rows.filter(r => /\*\*[^*]*(FALSIFIED|harm)[^*]*\*\*/.test(r.line)).length;
  const settled = rows.filter(r => /prediction: predictions\/\S+\.md/.test(r.line)).length;
  const level = (cal !== null && cal > 0.25) || surprises.length >= 2 || family >= 3 ? 'HIGH'
    : (cal !== null && cal > 0.20) || surprises.length >= 1 || unmask >= 1 || weak >= 2 ? 'MEDIUM' : 'LOW';
  const every = { LOW: 6, MEDIUM: 3, HIGH: 1 }[level];
  return { cal, surprises, fams, family, weak, unmask, settled, level, every, due: settled >= every, last, covered };
}

// PLANTED (rule 6)
function planted() {
  const sc = 'X\n7e (a): Brier 0.166 over 3 (1 0.7 -> held; 2 0.9 -> not; carried forward 0.6 -> not)\n7r (b): Brier 0.3 over 2 (1 0.3 -> held; outcome HELD 0.55 -> held)\n';
  const plan = ['| O1 | a | 1 Sep | C | g | open |', '| O2 | b; family: risk | 1 Sep | C | g | open |', '| O3 | c; family: risk | 1 Sep | C | g | open |', '| O4 | d; family: risk | 1 Sep | C | g | resolved 2 Sep |',
    '| 26 Sep 16:02 | **7s FALSIFIED: x** | y | results: r; prediction: predictions/a.md; grade B |', '| 26 Sep 13:27 | **7r HELD** | y | results: r; prediction: predictions/b.md; grade C for z |', '| 25 Sep 10:00 | old | y | grade D |'].join('\n');
  const log = '- 26 Sep 12:00 UK | covered 7e (a) | x\n';
  const u = index({ scorecard: sc, plan, log });
  const cases = [
    ['the scorecard read: two tests, three and two items', scoredTests(sc).map(t => t.items.length).join(','), '3,2'],
    ['calibration over the last items', u.cal.toFixed(4), (((0.7 - 1) ** 2 + 0.9 ** 2 + 0.6 ** 2 + (0.3 - 1) ** 2 + (0.55 - 1) ** 2) / 5).toFixed(4)],
    ['surprises after the covered test: 7r\'s item at 0.3 held (7e\'s 0.9 miss is before it)', u.surprises.join('|'), '7r (b) 0.3 held'],
    ['families count open items only: risk 2 (O4 is resolved)', JSON.stringify(u.fams), '{"risk":2}'],
    ['ledger rows after the receipt: 2 settled, 1 weak (grade C), 1 unmasking flag (FALSIFIED in the title); the 25 Sep row is before it', `${u.settled} ${u.weak} ${u.unmask}`, '2 1 1'],
    ['the level: calibration 0.40 is HIGH, so a review is due', `${u.level} ${u.due}`, 'HIGH true'],
    ['LOW with few settled results is not due; LOW at six is', (() => { const a = index({ scorecard: '7x (c): Brier 0 over 1 (1 0.9 -> held)', plan: '', log: '- 26 Sep 12:00 UK | covered 7x (c) | x' }); const rows = Array.from({ length: 6 }, (_, i) => `| 26 Sep 13:0${i} | r | y | prediction: predictions/p${i}.md; grade B |`).join('\n'); const b = index({ scorecard: '7x (c): Brier 0 over 1 (1 0.9 -> held)', plan: rows, log: '- 26 Sep 12:00 UK | covered 7x (c) | x' }); return `${a.level} ${a.due} ${b.level} ${b.due}`; })(), 'LOW false LOW true'],
    ['no receipt yet: every test counts as after it', String(index({ scorecard: sc, plan: '', log: '' }).surprises.length), '2'],
    ['HIGH with nothing settled since the receipt is not due (a family of 3 does not reset)', (() => { const fam = ['| O1 | a; family: r | 1 Sep | C | g | open |', '| O2 | b; family: r | 1 Sep | C | g | open |', '| O3 | c; family: r | 1 Sep | C | g | open |', '| 26 Sep 11:00 | **7s** | y | prediction: predictions/a.md; grade B |'].join('\n'); const v = index({ scorecard: sc, plan: fam, log: '- 26 Sep 12:00 UK | covered 7r (b) | x' }); return `${v.level} ${v.settled} ${v.due}`; })(), 'HIGH 0 false'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const n = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${n}): all read as they should`); process.exit(0); }
  const rd = f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : '');
  const u = index({ scorecard: rd('results-scorecard.txt'), plan: rd('PLAN.md'), log: rd('deep-review-log.md') });
  if (process.argv.includes('--due')) { console.log(u.due ? `DEEP REVIEW DUE (${u.level})` : `no deep review due (${u.level})`); process.exit(u.due ? 1 : 0); }
  console.log(`THE UNCERTAINTY INDEX (RULES.md section 9): ${u.level}; a deep review ${u.due ? 'IS DUE' : 'is not due'}`);
  console.log(`  last deep review: ${u.last || 'none yet'}`);
  console.log(`  calibration, the last 10 scored items: Brier ${u.cal === null ? '-' : u.cal.toFixed(3)} (HIGH over 0.25, MEDIUM over 0.20)`);
  console.log(`  surprises since: ${u.surprises.length}${u.surprises.length ? ` (${u.surprises.join('; ')})` : ''} (HIGH at 2)`);
  console.log(`  open register families: ${Object.keys(u.fams).length ? Object.entries(u.fams).map(([k, v]) => `${k} ${v}`).join(', ') : 'none noted'} (HIGH at 3)`);
  console.log(`  since the last review: ${u.settled} settled results (a review every ${u.every} at ${u.level}), ${u.weak} resting on grade C or D, ${u.unmask} FALSIFIED or harm verdicts`);
}
