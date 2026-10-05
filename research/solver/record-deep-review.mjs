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
 *   node research/solver/record-deep-review.mjs --settle "<receipt time> | <id> | held|not | <results file> | <its deciding line>"
 *        (a ranked cause settled by a registered result: appended to review-causes.md, which only this writes)
 *   node research/solver/record-deep-review.mjs --planted          the planted checks alone
 * The receipt's time is the clock's (UK), its level and the test it covers are read from the records, not typed.
 */
import { readFileSync, appendFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
  // the second unlock (5 Oct; the plan-auditor's MINOR 3 of 11:37 UK): each id is a cause the findings rank before the
  // segment (the id, or its part after the last hyphen: O101-EDGE or EDGE), and rival causes' credences sum to at most
  // 1.05 unless the findings say "CAUSES OVERLAP: <why>" (more than one can be the cause)
  const pre = c.slice(0, c.search(/CAUSE CREDENCES:/i)), esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const named = id => [id, id.split('-').pop()].filter(Boolean).some(w => new RegExp(`(^|[^\\w])${esc(w)}($|[^\\w])`).test(pre));
  const missing = cc.filter(x => !named(x.id));
  if (missing.length) return `CAUSE CREDENCES names ${missing.map(x => x.id).join(', ')}, not a cause the findings rank before it (the id, or its part after the last hyphen, written there)`;
  const sum = cc.reduce((s, x) => s + x.p, 0);
  if (sum > SUM_MAX + 1e-9 && !/CAUSES OVERLAP:/i.test(pre)) return `the cause credences sum to ${sum.toFixed(2)}: rival causes sum to at most ${SUM_MAX} (or the findings say "CAUSES OVERLAP: <why>" before them)`;
  return null;
}
export const SUM_MAX = 1.05;

/* THE CAUSES SETTLED BY A REGISTERED RESULT, NOT BY THE AUTHOR (the second unlock of 5 Oct; the plan-auditor's MINOR 3 of
   11:37 UK). review-causes.md is written only by --settle (pre-tool.mjs PROTECTED; its committed text must stay a prefix of
   the file, so a settled line cannot be removed or changed), one line per settled cause:
     - <the receipt's time> | <id> | held|not | <results file> | <the results file's deciding line, quoted whole>
   The quoted line must be a line of that results file, and a deciding one (OUTCOME:, SHARES:, LEGS: or "=> "): a
   cause is settled by what a reducer printed, not by judgement. scorecard.mjs scores the stated credences against them. */
export const DECIDING = /^(OUTCOME|SHARES|LEGS):|^=> /;
const SETTLE = /^- ([^|\n]+?) \| ([\w+-]+) \| (held|not) \| ([^|\n]+?) \| (.+?)\s*$/;
export function statedCauses(log) {
  const stated = new Map();
  for (const m of String(log).matchAll(/^- (\d{1,2} \w{3} \d{2}:\d{2}) UK \| covered [^\n]*$/gm)) { const cc = causeCredences(m[0]); if (cc && cc.length && cc.every(Boolean)) for (const x of cc) stated.set(`${m[1]}|${x.id}`, x.p); }
  return stated;
}
// `read(file)` gives a results file's text, or null when it does not exist
export function settlements(log, settled, read = () => null) {
  const stated = statedCauses(log), pairs = [], seen = new Set(), errs = [];
  for (const raw of String(settled).split('\n')) {
    if (!raw.startsWith('- ')) continue;
    const m = SETTLE.exec(raw);
    if (!m) { errs.push(`"${raw.slice(0, 60)}" is not "- <time> | <id> | held|not | <results file> | <its deciding line>"`); continue; }
    const k = `${m[1].replace(/ UK$/, '')}|${m[2]}`, at = `${m[1]} ${m[2]}`, q = m[5].trim();
    if (!stated.has(k)) { errs.push(`${at}: no receipt states that cause`); continue; }
    if (seen.has(k)) { errs.push(`${at}: settled twice`); continue; }
    const text = read(m[4]);
    if (text == null) { errs.push(`${at}: its results file ${m[4]} does not exist`); continue; }
    if (!DECIDING.test(q)) { errs.push(`${at}: it quotes "${q.slice(0, 50)}", not a deciding line (OUTCOME:, SHARES:, LEGS: or "=> ")`); continue; }
    if (!String(text).split('\n').some(l => l.trim() === q)) { errs.push(`${at}: the quoted line is not a line of ${m[4]}`); continue; }
    seen.add(k); pairs.push({ p: stated.get(k), o: m[3] === 'held' ? 1 : 0 });
  }
  return { stated, pairs, errs };
}
// append-only: the committed text must remain the start of the file
export const appendOnlyProblem = (committed, now) => (committed != null && !String(now).startsWith(committed) ? 'review-causes.md no longer begins with its committed text: a settled line was removed or changed (it is append-only)' : null);
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
    ['full findings with their cause credences pass', String(findingsProblem(`${long} ranked: rep, quad. CAUSE CREDENCES: rep=0.45; quad=0.35`)), 'null'],
    ['the cause credences read back, a full stop ending them', JSON.stringify(causeCredences('ranked: a, b. CAUSE CREDENCES: rep=0.45; quad=.35. The decisive test X')), '[{"id":"rep","p":0.45},{"id":"quad","p":0.35}]'],
    ['EDGE: credences of 0 and 1 pass', String(findingsProblem(`${long} ranked: rep, quad. CAUSE CREDENCES: rep=0; quad=1`)), 'null'],
    ['planted: a cause credence above 1 is refused', String(!!findingsProblem(`${long} ranked: rep, quad. CAUSE CREDENCES: rep=1.4; quad=0.35`)), 'true'],
    ['planted: one cause alone is refused', String(!!findingsProblem(`${long} ranked: rep, quad. CAUSE CREDENCES: rep=0.45`)), 'true'],
    ['planted: a repeated cause id is refused', String(!!findingsProblem(`${long} ranked: rep, quad. CAUSE CREDENCES: rep=0.45; rep=0.35`)), 'true'],
    ['planted: a cause id the findings never rank is refused', String(/not a cause the findings rank/.test(findingsProblem(`${long} ranked: rep. CAUSE CREDENCES: rep=0.45; quad=0.35`) || '')), 'true'],
    ['EDGE: an id named in the findings by its part after the hyphen passes (O101-EDGE as EDGE)', String(findingsProblem(`${long} ranked: EDGE, WITHIN. CAUSE CREDENCES: O101-EDGE=0.7; O101-WITHIN=0.3`)), 'null'],
    ['planted: an id written only after the segment is refused', String(!!findingsProblem(`${long} ranked: rep. CAUSE CREDENCES: rep=0.45; quad=0.35. quad`)), 'true'],
    ['planted: rival causes summing to 1.4 are refused', String(/sum to 1\.40/.test(findingsProblem(`${long} ranked: rep, quad. CAUSE CREDENCES: rep=0.7; quad=0.7`) || '')), 'true'],
    ['EDGE: a sum of 1.05 passes, 1.06 does not', `${findingsProblem(`${long} ranked: rep, quad. CAUSE CREDENCES: rep=0.7; quad=0.35`)} ${!!findingsProblem(`${long} ranked: rep, quad. CAUSE CREDENCES: rep=0.7; quad=0.36`)}`, 'null true'],
    ['"CAUSES OVERLAP:" before the segment lets overlapping causes sum past 1', String(findingsProblem(`${long} ranked: rep, quad. CAUSES OVERLAP: both can act at once. CAUSE CREDENCES: rep=0.7; quad=0.7`)), 'null'],
    ...(() => {
      const LG = '- 5 Oct 12:00 UK | covered X | level HIGH | ranked rep, quad. CAUSE CREDENCES: rep=0.6; quad=0.3. next\n';
      const files = { 'results-x.txt': 'x\nOUTCOME: 1 HELD; 2 HELD\nSHARES: O101-EDGE SETTLED; O83 SETTLED\n' }, rd = f => (f in files ? files[f] : null);
      const s = l => settlements(LG, `# head\n\n    - <time> | <id> | the format, indented\n${l}\n`, rd);
      return [
        ['a settlement quoting its results file\'s deciding line is scored', (r => `${r.pairs.length} ${r.errs.length} ${r.pairs[0].p} ${r.pairs[0].o}`)(s('- 5 Oct 12:00 | rep | held | results-x.txt | SHARES: O101-EDGE SETTLED; O83 SETTLED')), '1 0 0.6 1'],
        ['planted: a quote that is not a line of its results file is refused', String(/not a line of results-x\.txt/.test(s('- 5 Oct 12:00 | rep | held | results-x.txt | SHARES: O101-EDGE SETTLED').errs[0])), 'true'],
        ['planted: a quoted line that decides nothing is refused', String(/not a deciding line/.test(s('- 5 Oct 12:00 | rep | held | results-x.txt | x').errs[0])), 'true'],
        ['planted: a settlement with no quote is refused', String(/is not "- <time>/.test(s('- 5 Oct 12:00 | rep | held | results-x.txt').errs[0])), 'true'],
        ['planted: a cause no receipt states, one settled twice, a missing file', `${s('- 5 Oct 12:00 | draw | held | results-x.txt | OUTCOME: 1 HELD; 2 HELD').errs.length} ${s('- 5 Oct 12:00 | rep | held | results-x.txt | OUTCOME: 1 HELD; 2 HELD\n- 5 Oct 12:00 | rep | not | results-x.txt | OUTCOME: 1 HELD; 2 HELD').errs.length} ${s('- 5 Oct 12:00 | quad | not | results-y.txt | OUTCOME: 1 HELD; 2 HELD').errs.length}`, '1 1 1'],
        ['append-only: a file that grew passes; one whose committed text changed or lost a line is refused', `${appendOnlyProblem('a\nb\n', 'a\nb\nc\n')} ${!!appendOnlyProblem('a\nb\n', 'a\n')} ${!!appendOnlyProblem('a\nb\n', 'a\nB\nc\n')} ${appendOnlyProblem(null, 'x')}`, 'null true true null'],
      ];
    })(),
    ['planted: a credence written as a word is refused', String(!!findingsProblem(`${long} ranked: rep, quad. CAUSE CREDENCES: rep=likely; quad=0.35`)), 'true'],
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
  if (a.includes('--settle')) {
    const s = String(a[a.indexOf('--settle') + 1] || '').trim(), line = s.startsWith('- ') ? s : `- ${s}`;
    const CAUSES = join(HERE, 'review-causes.md'), now = existsSync(CAUSES) ? readFileSync(CAUSES, 'utf8') : '';
    let committed = null;
    try { committed = execFileSync('git', ['show', 'HEAD:research/solver/review-causes.md'], { cwd: join(HERE, '..', '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { /* not yet committed */ }
    const read = f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : null);
    const r = settlements(readFileSync(LOG, 'utf8'), `${now}\n${line}\n`, read), ao = appendOnlyProblem(committed, now);
    if (ao || r.errs.length) { console.error(`not recorded: ${[ao, ...r.errs].filter(Boolean).join('; ')}`); process.exit(2); }
    appendFileSync(CAUSES, `${now.endsWith('\n') || !now ? '' : '\n'}${line}\n`);
    console.log(`settled: ${line}`);
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
