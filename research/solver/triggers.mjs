/*
 * THE TRIGGER COUNTS (RULES.md section 10, the feedback loop; drafts/feedback-loop-plan.md, amended by the deep review
 * drafts/feedback-loop-review.md). Every graded finding (review-log.md; deep-review-log.md), every lesson (lessons.md)
 * and every mutation run (results-mutation-history.txt) carries a trigger code, [T:<code>] (for `other`, [T:other:<word>]):
 * the situation a slip or a catch arises in. This prints the loop's own success measure per window of closes - review
 * cycles (receipts, FAILs), primary BLOCKINGs by code (carried ones excluded), BACKLOGs (the leniency guard: an error an
 * earlier PASS let through), launches per close, and the bytes of the always-read files - so the loop is judged by its
 * record. A close is a lessons.md entry, "## <test> (closed <D Mon HH:MM>)", one per test scored in results-scorecard.txt
 * after lessons.md's seed line (check-plan.mjs's retro check). The retirement pass is due when 5 closes have passed since
 * the last "retirement |" line in deep-review-log.md (written by record-deep-review.mjs --retirement, locked).
 *   node research/solver/triggers.mjs            the report (at most 40 lines)
 *   node research/solver/triggers.mjs --due      exit 0 printing RETIREMENT PASS DUE, else exit 1
 * Everything but the bottom is pure, for research/tests/triggers.test.mjs.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// slips: the situation a mistake arises in; c-...: the situation a catch arises in (a reviewer's BLOCKING is a catch by
// definition, so no code for it)
export const CODES = Object.freeze({
  relook: 'rows the change did not touch, left unmoved by an item it moved', stale: 'within the rows the change touched, text it contradicts',
  branch: 'an outcome unreachable or a combination with no branch', sentinel: 'a missing value or empty class read as data',
  plant: 'a planted fault that trips two checks; a mutation escape', figure: 'a figure not what its cited output says (typed, misread, wrong measure)',
  code: 'a claim about the code that the code contradicts', overclaim: 'a claim stronger than its grade', format: 'an output or ran-line format its consumer does not match',
  order: 'a step before what it depends on', import: 'a check that runs what it checks', lock: 'a hook refusal of a legitimate command',
  time: 'a clock slip where the order matters', register: 'an odd result not registered', enforce: 'a claim about the enforcement',
  design: 'a prediction\'s rule or power unsound otherwise',
  'decision-fed': 'a decision fed ill-posed, unreachable from its rule, or contrary to a standing decision or STOP list (promoted from other:decision-fed, seen 9 times; the maintainer, 4 Oct)',
  other: 'none of these: written other:<word>; a word seen 3 times gets its own code',
  'c-gate': 'a fair-test or identity gate refused a run', 'c-plant': 'a planted check caught a fault', 'c-mutation': 'a mutation run exposed a gap',
  'c-preflight': 'a build check or preflight failed early', 'c-check': 'check-plan or check-prediction refused', 'c-deep': 'a deep review found a root cause',
  'c-relook': 'relook.mjs listed a row that had to move', 'c-falsify': 'a prediction usefully falsified',
});
export const PASS_EVERY = 5;
export const TAG = /\[T:([a-z-]+)(?::([a-z0-9-]+))?\]/g;
/* the tags in a text: known codes; `other` needs its word; anything else is unknown */
export function tagsIn(text) {
  const tags = [], words = [], unknown = [];
  for (const m of String(text).matchAll(TAG)) {
    if (!CODES[m[1]]) { unknown.push(m[1]); continue; }
    if (m[1] === 'other' && !m[2]) { unknown.push('other (write other:<word>)'); continue; }
    // a word since promoted to its own code counts as that code, so the old other:<word> tags join its history
    if (m[1] === 'other' && CODES[m[2]] && !m[2].startsWith('c-') && m[2] !== 'other') { tags.push(m[2]); continue; }
    tags.push(m[1]); if (m[2]) words.push(`${m[1]}:${m[2]}`);
  }
  return { tags, words, unknown };
}
/* a sortable minute: "30 Sept, 19:08 UK", "30 Sep 18:03 UK", "30 Sep 17:52", "2026-09-30 17:54 UTC" (UTC to UK: +1 hour,
   British summer time to 25 Oct) */
const MON = { Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
export function minuteKey(s) {
  const iso = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})( UTC)?/.exec(String(s));
  if (iso) { const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5])); if (iso[6] && d < Date.UTC(2026, 9, 25, 1)) d.setUTCHours(d.getUTCHours() + 1); return d.getUTCFullYear() * 1e8 + (d.getUTCMonth() + 1) * 1e6 + d.getUTCDate() * 1e4 + d.getUTCHours() * 100 + d.getUTCMinutes(); }
  const m = /(\d{1,2}) (Sep|Oct|Nov|Dec)t?,? (\d{1,2}):(\d{2})/.exec(String(s));
  return m ? 2026 * 1e8 + MON[m[2]] * 1e6 + +m[1] * 1e4 + +m[3] * 100 + +m[4] : null;
}
/* lessons.md: its seed ("Seed: after <test> (<D Mon HH:MM>)") and closes ("## <test> (closed <D Mon HH:MM>)") with their lines */
export function lessonsOf(text) {
  const seedM = /^Seed: after (\S+) \(([^)]+)\)/m.exec(String(text));
  const closes = []; let cur = null;
  for (const l of String(text).split('\n')) {
    const c = /^## (\S+) \(closed ([^)]+)\)\s*$/.exec(l);
    if (c) { cur = { test: c[1], at: minuteKey(c[2]), when: c[2], lines: [] }; closes.push(cur); continue; }
    if (/^## /.test(l)) { cur = null; continue; }
    if (cur && /^- /.test(l)) cur.lines.push(l);
  }
  return { seed: seedM ? { test: seedM[1], at: minuteKey(seedM[2]) } : null, closes };
}
/* review-log.md's receipts, with their graded findings split and tagged */
export const GRADED = /(?=\b(?:BLOCKING|MINOR|BACKLOG)\b(?: \(carried \d+\))? \d+[.:])/;
export function findingsOf(text) {
  return String(text).split(GRADED).map(x => x.trim()).filter(x => /^(BLOCKING|MINOR|BACKLOG)\b/.test(x)).map(x => {
    const g = /^(BLOCKING|MINOR|BACKLOG)\b(?: \(carried (\d+)\))?/.exec(x), t = tagsIn(x);
    return { grade: g[1], carried: g[2] ? Number(g[2]) : 0, tags: t.tags, words: t.words, unknown: t.unknown, text: x };
  });
}
export function receiptsOf(log) {
  return String(log).split('\n').map(l => /^- (.+?) \| plan ([0-9a-f]{40}) \| (PASS|FAIL) \| ([^|]+) \| (.*)$/.exec(l)).filter(Boolean)
    .map(m => ({ at: minuteKey(m[1]), verdict: m[3], reviewer: m[4].trim(), findings: findingsOf(m[5]) }));
}
/* the codes on BLOCKING findings (carried ones excluded) of receipts in (t0, t1] */
export function blockingCodesBetween(receipts, t0, t1) {
  const s = new Set();
  for (const r of receipts) if ((t0 === null || r.at > t0) && r.at <= t1) for (const f of r.findings) if (f.grade === 'BLOCKING' && !f.carried) f.tags.forEach(t => s.add(t));
  return s;
}
/* the retirement passes' times: deep-review-log.md lines "- <D Mon HH:MM UK> | retirement | ..." */
export function passesOf(deepLog) {
  return String(deepLog).split('\n').map(l => /^- (.+? UK) \| retirement \|/.exec(l)).filter(Boolean).map(m => minuteKey(m[1]));
}
export function passDue(closes, passes, every = PASS_EVERY) {
  const last = passes.length ? Math.max(...passes) : null;
  const since = closes.filter(c => last === null || c.at > last).length;
  return { due: since >= every, since };
}
/* the success measure over the last n closes: everything after the close before the window */
export function windowStats({ receipts, closes, launches, tagged, seedAt = null }, n) {
  const sorted = [...closes].sort((a, b) => a.at - b.at);
  // the window opens at the close before the last n, or at the seed while there are n closes or fewer (the plan-auditor's
  // MINOR 5 of 30 Sep 19:36: with no start, "the last 5" counted every receipt since 24 Sep)
  const from = sorted.length > n ? sorted[sorted.length - n - 1].at : seedAt, inw = t => t !== null && (from === null || t > from);
  const rs = receipts.filter(r => inw(r.at)), byCode = new Map(), add = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  let blocking = 0, backlog = 0;
  for (const r of rs) for (const f of r.findings) {
    if (f.grade === 'BACKLOG') backlog++;
    if (f.grade === 'BLOCKING' && !f.carried) { blocking++; f.tags.forEach(t => add(byCode, t)); }
  }
  const catches = new Map();
  for (const x of tagged) if (inw(x.at)) x.tags.filter(t => t.startsWith('c-')).forEach(t => add(catches, t));
  const nClose = Math.min(n, sorted.length);
  return { n, closes: nClose, receipts: rs.length, fails: rs.filter(r => r.verdict === 'FAIL').length, blocking, backlog, byCode, catches,
    launchesPerClose: nClose ? launches.filter(t => inw(t)).length / nClose : null };
}
const fmt = x => (x === null ? '-' : Number.isInteger(x) ? String(x) : x.toFixed(1));
export function report(data, sizes, max = 40) {
  const out = [];
  const unknown = [...data.receipts.flatMap(r => r.findings.flatMap(f => f.unknown)), ...data.tagged.flatMap(x => x.unknown)];
  if (unknown.length) out.push(`UNKNOWN CODES (${unknown.length}): ${[...new Set(unknown)].slice(0, 6).join(', ')}`);
  const W = [5, 20].map(n => windowStats(data, n));
  out.push(`THE LOOP'S MEASURE (last 5 closes | last 20; ${data.closes.length} closes recorded):`);
  out.push(`  review cycles: receipts ${W[0].receipts} | ${W[1].receipts}; FAILs ${W[0].fails} | ${W[1].fails}; primary BLOCKINGs ${W[0].blocking} | ${W[1].blocking}; BACKLOGs ${W[0].backlog} | ${W[1].backlog}`);
  out.push(`  launches per close: ${fmt(W[0].launchesPerClose)} | ${fmt(W[1].launchesPerClose)}`);
  out.push(`  always-read bytes: ${Object.entries(sizes).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  const codes = [...new Set([...W[1].byCode.keys()])].sort((a, b) => (W[0].byCode.get(b) || 0) - (W[0].byCode.get(a) || 0) || W[1].byCode.get(b) - W[1].byCode.get(a));
  out.push('  BLOCKINGs by code (5 | 20):' + (codes.length ? '' : ' none tagged yet'));
  for (const k of codes) out.push(`    ${k.padEnd(10)} ${String(W[0].byCode.get(k) || 0).padStart(3)} | ${W[1].byCode.get(k)}`);
  const cs = Object.keys(CODES).filter(k => k.startsWith('c-'));
  out.push(`  catches recorded (5 | 20): ${cs.map(k => `${k} ${W[0].catches.get(k) || 0}|${W[1].catches.get(k) || 0}`).join(', ')}`);
  const others = new Map(); for (const x of [...data.receipts.flatMap(r => r.findings), ...data.tagged]) for (const w of x.words || []) others.set(w, (others.get(w) || 0) + 1);
  const named = [...others].filter(([, c]) => c >= 3);
  if (named.length) out.push(`  'other' words seen 3 times or more (give each a code): ${named.map(([w, c]) => `${w} ${c}`).join(', ')}`);
  return out.slice(0, max);
}
const read = f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : '');
export function load() {
  const lessons = lessonsOf(read('lessons.md'));
  const receipts = receiptsOf(read('review-log.md'));
  const launches = read('runs.log').split('\n').filter(l => / \| main \| \S*predictions\//.test(l)).map(l => minuteKey(l));
  const tagged = [];
  for (const l of read('deep-review-log.md').split('\n')) { const t = tagsIn(l); if (t.tags.length || t.unknown.length) tagged.push({ at: minuteKey(l), ...t }); }
  for (const l of read('results-mutation-history.txt').split('\n')) { const t = tagsIn(l); if (t.tags.length || t.unknown.length) tagged.push({ at: minuteKey(l), ...t }); }
  for (const c of lessons.closes) for (const l of c.lines) tagged.push({ at: c.at, ...tagsIn(l) });
  return { lessons, receipts, launches, tagged, closes: lessons.closes, seedAt: lessons.seed ? lessons.seed.at : null, passes: passesOf(read('deep-review-log.md')) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const d = load();
  const due = passDue(d.closes, d.passes);
  if (process.argv.includes('--due')) {
    console.log(due.due ? `RETIREMENT PASS DUE: ${due.since} closes since the last pass (every ${PASS_EVERY})` : `retirement pass not due: ${due.since} of ${PASS_EVERY} closes since the last`);
    process.exit(due.due ? 0 : 1);
  }
  const sz = f => (existsSync(join(HERE, f)) ? statSync(join(HERE, f)).size : 0);
  const sizes = { 'PLAN.md': sz('PLAN.md'), 'RULES.md': sz('RULES.md'), 'CHECKLIST.md': sz('CHECKLIST.md'), 'CLAUDE.md': existsSync(join(HERE, '../../CLAUDE.md')) ? statSync(join(HERE, '../../CLAUDE.md')).size : 0 };
  for (const l of report(d, sizes)) console.log(l);
  console.log(due.due ? `RETIREMENT PASS DUE: ${due.since} closes since the last pass` : `retirement pass: ${due.since} of ${PASS_EVERY} closes since the last`);
}
