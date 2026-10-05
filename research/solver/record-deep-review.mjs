/*
 * THE DEEP REVIEWER'S RECEIPTS (RULES.md section 9; the maintainer, 26 Sep: "automated deep thought review on a periodic
 * basis based on the level of uncertainty of the model"). The deep-reviewer agent records its start and its receipt here,
 * in research/solver/deep-review-log.md. uncertainty.mjs counts what has happened since the newest receipt; the Stop hook
 * blocks while a review is due, except for 30 minutes after a start (a review under way).
 *   node research/solver/record-deep-review.mjs --start
 *   node research/solver/record-deep-review.mjs --findings "<families; unmasking flags; premises at risk; the ranked causes and the decisive test;
 *        CAUSE CREDENCES: <id>=<p>; <id>=<p>; ...>"
 *   node research/solver/record-deep-review.mjs --retirement "<the retirement pass: each automation or retirement with its
 *        mechanical source; debt: each AUTOMATE or REPLACE lesson not yet carried out, built or dropped with its reason>"
 *        (RULES.md section 10: the line triggers.mjs counts closes from; this log is locked, so the count cannot be reset)
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
// THE RANKED CAUSES CARRY CREDENCES (the maintainer's 'unlock enforcement' of 5 Oct, after the deep review of the
// prediction record, this log 5 Oct 10:16 UK: 19 items leaned on a review's ranked cause, and a ranking with no
// probabilities cannot be scored). Every receipt gives each ranked cause its probability of being the cause, as
// "CAUSE CREDENCES: <id>=<p>; <id>=<p>" (two or more, each from 0 to 1, ids unique); scorecard.mjs scores them against
// review-causes.md as results settle them
export function causeCredences(f) {
  const m = /CAUSE CREDENCES:\s*(.*)$/i.exec(cleanFindings(f));
  if (!m) return null;
  const parts = [];
  for (const x of m[1].split(';')) {
    const e = /^\s*([\w+-]+)\s*=\s*(\d+(?:\.\d+)?|\.\d+)(.*)$/.exec(x);
    if (!e) { parts.push(null); break; }
    parts.push({ id: e[1], p: Number(e[2]) });
    if (e[3].trim()) break; // the text after the last credence
  }
  return parts;
}
export function findingsProblem(f) {
  const c = cleanFindings(f);
  if (c.length < MIN_FINDINGS) return `the findings are ${c.length} characters; a receipt names the families, the unmasking flags, the premises at risk, and the ranked causes with the decisive test (at least ${MIN_FINDINGS})`;
  const cc = causeCredences(c);
  if (!cc) return 'the ranked causes carry no probabilities: add "CAUSE CREDENCES: <id>=<p>; <id>=<p>" (scored later against review-causes.md)';
  if (cc.some(x => !x)) return 'a CAUSE CREDENCES entry is not "<id>=<p>" with p a number';
  if (cc.length < 2) return 'CAUSE CREDENCES names fewer than two causes; a ranking names two or more';
  if (cc.some(x => !(x.p >= 0 && x.p <= 1))) return 'a cause credence is not a probability from 0 to 1';
  if (new Set(cc.map(x => x.id)).size !== cc.length) return 'a cause id appears twice in CAUSE CREDENCES';
  return null;
}
export function retirementProblem(f) {
  const c = cleanFindings(f);
  if (c.length < MIN_FINDINGS) return `the retirement pass is ${c.length} characters; it names each automation or retirement with its mechanical source, and the follow-through debt (at least ${MIN_FINDINGS})`;
  if (!/\bdebt:/i.test(c)) return 'the retirement pass lists the follow-through debt ("debt: ..." - "debt: none" if there is none)';
  if (!/\bsource:/i.test(c) && !/\bno proposals?\b/i.test(c)) return 'each proposal cites its mechanical source ("source: ..."), or the pass says "no proposals"';
  return null;
}
export const retirementLine = ({ when, findings }) => `- ${when} UK | retirement | ${cleanFindings(findings)}`;
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
    ['planted: full-length findings with no CAUSE CREDENCES are refused', String(!!findingsProblem(long)), 'true'],
    ['full findings with their cause credences pass', String(findingsProblem(`${long} CAUSE CREDENCES: rep=0.45; quad=0.35`)), 'null'],
    ['the cause credences read back, a full stop ending them', JSON.stringify(causeCredences('ranked: a, b. CAUSE CREDENCES: rep=0.45; quad=.35. The decisive test X')), '[{"id":"rep","p":0.45},{"id":"quad","p":0.35}]'],
    ['EDGE: credences of 0 and 1 pass', String(findingsProblem(`${long} CAUSE CREDENCES: rep=0; quad=1`)), 'null'],
    ['planted: a cause credence above 1 is refused', String(!!findingsProblem(`${long} CAUSE CREDENCES: rep=1.4; quad=0.35`)), 'true'],
    ['planted: one cause alone is refused', String(!!findingsProblem(`${long} CAUSE CREDENCES: rep=0.45`)), 'true'],
    ['planted: a repeated cause id is refused', String(!!findingsProblem(`${long} CAUSE CREDENCES: rep=0.45; rep=0.35`)), 'true'],
    ['planted: a credence written as a word is refused', String(!!findingsProblem(`${long} CAUSE CREDENCES: rep=likely; quad=0.35`)), 'true'],
    ['the start line carries a readable ISO time', String(Number.isFinite(Date.parse(/^- started (\S+)$/.exec(startLine(new Date('2026-09-26T15:48:00Z')))[1]))), 'true'],
    ['a retirement pass with no debt list is refused', String(!!retirementProblem(`${long} source: review-log tags`)), 'true'],
    ['a retirement pass with no mechanical source is refused', String(!!retirementProblem(`${long} debt: none`)), 'true'],
    ['a full retirement pass passes', String(retirementProblem(`${long} source: review-log tags; debt: none`)), 'null'],
    ['the retirement line reads back as a pass (triggers.mjs passesOf)', String(/^- 26 Sep 16:48 UK \| retirement \| /.test(retirementLine({ when: ukNow(new Date('2026-09-26T15:48:00Z')), findings: long }))), 'true'],
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
  if (a.includes('--retirement')) {
    const r = a[a.indexOf('--retirement') + 1] || '', bad = retirementProblem(r);
    if (bad) { console.error(`not recorded: ${bad}`); process.exit(2); }
    const line = retirementLine({ when: ukNow(), findings: r });
    appendFileSync(LOG, `${line}\n`);
    console.log(`recorded: ${line.slice(0, 160)}${line.length > 160 ? '...' : ''}`);
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
