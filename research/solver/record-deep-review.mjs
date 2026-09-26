/*
 * THE DEEP REVIEWER'S RECEIPTS (RULES.md section 9; the maintainer, 26 Sep: "automated deep thought review on a periodic
 * basis based on the level of uncertainty of the model"). The deep-reviewer agent records its start and its receipt here,
 * in research/solver/deep-review-log.md. uncertainty.mjs counts what has happened since the newest receipt; the Stop hook
 * blocks while a review is due, except for 30 minutes after a start (a review under way).
 *   node research/solver/record-deep-review.mjs --start
 *   node research/solver/record-deep-review.mjs --findings "<families; unmasking flags; premises at risk; the ranked causes and the decisive test>"
 *   node research/solver/record-deep-review.mjs --planted          the planted checks alone
 * The receipt's time is the clock's (UK), its level and the test it covers are read from the records, not typed.
 */
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { index, scoredTests, stamp } from './uncertainty.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOG = join(HERE, 'deep-review-log.md');
export const MIN_FINDINGS = 200;

// "26 Sep 16:48", the ledger's time format (en-GB's own string is "26 Sept, 16:48")
export const ukNow = (d = new Date()) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value])); return `${p.day} ${p.month.slice(0, 3)} ${p.hour}:${p.minute}`; };
export const startLine = (d = new Date()) => `- started ${d.toISOString()}`;
export const cleanFindings = f => String(f || '').replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
export function findingsProblem(f) {
  const c = cleanFindings(f);
  if (c.length < MIN_FINDINGS) return `the findings are ${c.length} characters; a receipt names the families, the unmasking flags, the premises at risk, and the ranked causes with the decisive test (at least ${MIN_FINDINGS})`;
  return null;
}
export function receiptLine({ when, covered, level, findings }) {
  if (!covered) throw new Error('no scored test to cover: results-scorecard.txt has none');
  return `- ${when} UK | covered ${covered} | level ${level} | ${cleanFindings(findings)}`;
}

// PLANTED (rule 6)
function planted() {
  const sc = '7e (a): Brier 0.1 over 1 (1 0.7 -> held)\n7t (b): Brier 0.2 over 1 (1 0.6 -> held)\n';
  const long = 'x'.repeat(MIN_FINDINGS);
  const line = receiptLine({ when: ukNow(new Date('2026-09-26T15:48:00Z')), covered: scoredTests(sc).pop().name, level: 'HIGH', findings: `${long} | a pipe` });
  const u = index({ scorecard: sc, plan: '', log: `# log\n${line}\n` });
  const cases = [
    ['the clock in UK time, no comma', ukNow(new Date('2026-09-26T15:48:00Z')), '26 Sep 16:48'],
    ['the receipt is read back by uncertainty.mjs: its test and its time', `${u.covered} ${stamp(u.last) === stamp('26 Sep 16:48')}`, '7t (b) true'],
    ['a pipe in the findings cannot split the line', String(line.split(' | ').length), '4'],
    ['short findings are refused', String(!!findingsProblem('families: none')), 'true'],
    ['full findings pass', String(findingsProblem(long)), 'null'],
    ['the start line carries a readable ISO time', String(Number.isFinite(Date.parse(/^- started (\S+)$/.exec(startLine(new Date('2026-09-26T15:48:00Z')))[1]))), 'true'],
    ['no scored test is an error, not a receipt', (() => { try { receiptLine({ when: 'x', covered: null, level: 'LOW', findings: long }); return 'wrote'; } catch { return 'refused'; } })(), 'refused'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want);
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  return cases.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const n = planted();
  if (a.includes('--planted')) { console.log(`planted (${n}): all read as they should`); process.exit(0); }
  if (a.includes('--start')) {
    appendFileSync(LOG, `${startLine()}\n`);
    console.log(`deep review started (${ukNow()} UK); the Stop hook lets turns end for 30 minutes while it runs`);
    process.exit(0);
  }
  const i = a.indexOf('--findings'), f = i >= 0 ? a[i + 1] : '';
  const bad = findingsProblem(f);
  if (bad) { console.error(`not recorded: ${bad}\nusage: --start | --findings "<...>"`); process.exit(2); }
  const rd = p => (existsSync(join(HERE, p)) ? readFileSync(join(HERE, p), 'utf8') : '');
  const sc = rd('results-scorecard.txt'), u = index({ scorecard: sc, plan: rd('PLAN.md'), log: rd('deep-review-log.md') });
  const line = receiptLine({ when: ukNow(), covered: (scoredTests(sc).pop() || {}).name, level: u.level, findings: f });
  appendFileSync(LOG, `${line}\n`);
  console.log(`recorded: ${line.slice(0, 160)}${line.length > 160 ? '...' : ''}`);
}
