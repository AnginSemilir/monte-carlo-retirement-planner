/*
 * THE TRIGGER COUNTS (RULES.md section 10, the feedback loop; drafts/feedback-loop-plan.md). Every graded finding (the
 * plan-auditor's receipts, review-log.md; the deep reviews, deep-review-log.md), every lesson (lessons.md) and every
 * mutation run (results-mutation-history.txt) carries a trigger code, [T:<code>]: the situation a slip or a catch arises
 * in. This counts them so the loop is judged by its own record: which slips repeat (automate them), which checks still
 * catch (keep them), which have gone quiet (retire them), and whether review cycles fall.
 *   node research/solver/triggers.mjs            the counts (at most 40 lines)
 *   node research/solver/triggers.mjs --due      exit 0 and print RETIREMENT PASS DUE when 5 closes have passed since the
 *                                                last "## Retirement pass" in lessons.md; exit 1 otherwise
 * parseTags() and counts() are pure, for research/tests/triggers.test.mjs.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// slips: the situation a mistake arises in; c-...: the situation a catch arises in
export const CODES = Object.freeze({
  relook: 'a moved item\'s rows not updated', branch: 'an outcome unreachable or a combination with no branch',
  sentinel: 'a missing value or empty class read as data', plant: 'a planted fault that trips two checks; a mutation escape',
  figure: 'a figure typed, not from a script', overclaim: 'a claim stronger than its grade', format: 'an output or ran-line format its consumer does not match',
  order: 'a step before what it depends on', import: 'a check that runs what it checks', lock: 'a hook refusal of a legitimate command',
  time: 'a clock slip where the order matters', stale: 'text the change contradicts', register: 'an odd result not registered',
  enforce: 'a claim about the enforcement', design: 'a prediction\'s rule or power unsound otherwise', carried: 'a finding carried from a previous receipt',
  other: 'none of the above (named at the next retirement pass if seen 3 times)',
  'c-gate': 'a fair-test or identity gate refused a run', 'c-plant': 'a planted check caught a fault', 'c-mutation': 'a mutation run exposed a gap',
  'c-preflight': 'a build check or preflight failed early', 'c-check': 'check-plan or check-prediction refused', 'c-review': 'the auditor found a real error',
  'c-deep': 'a deep review found a root cause', 'c-relook': 'relook.mjs listed a row that had to move', 'c-falsify': 'a prediction usefully falsified',
});
export const PASS_EVERY = 5;
export const TAG = /\[T:([a-z-]+)\]/g;
/* every tag in a text, in order; unknown codes are reported, not counted */
export function parseTags(text) {
  const out = [], unknown = [];
  for (const m of String(text).matchAll(TAG)) (CODES[m[1]] ? out : unknown).push(m[1]);
  return { tags: out, unknown };
}
/* lessons.md: its closes ("## <test> (closed <date>)") and retirement passes ("## Retirement pass <date>"), in order */
export function closesOf(lessons) {
  const ev = [];
  for (const l of String(lessons).split('\n')) {
    const c = /^## (.+?) \(closed ([^)]+)\)\s*$/.exec(l); if (c) { ev.push({ kind: 'close', test: c[1], date: c[2] }); continue; }
    const r = /^## Retirement pass\b(.*)$/.exec(l); if (r) ev.push({ kind: 'pass', date: r[1].trim() });
  }
  return ev;
}
export function passDue(lessons, every = PASS_EVERY) {
  const ev = closesOf(lessons);
  let since = 0;
  for (const e of ev) since = e.kind === 'pass' ? 0 : since + 1;
  return { due: since >= every, since };
}
/*
 * the counts: `sources` are { name, lines: [{ when, text }] } in time order; a window of the last n closes is every line
 * dated on or after the n-th last close's date (lines with no date count in the all-time column only)
 */
export function counts(sources, lessons, windows = [5, 20]) {
  const closes = closesOf(lessons).filter(e => e.kind === 'close');
  const since = n => (closes.length >= n ? closes[closes.length - n].date : null);
  const all = new Map(), last = new Map(), win = windows.map(() => new Map()), unknown = [];
  const add = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const s of sources) for (const [i, ln] of s.lines.entries()) {
    const { tags, unknown: u } = parseTags(ln.text);
    unknown.push(...u.map(x => `${s.name}:${i + 1} ${x}`));
    for (const t of tags) {
      add(all, t); last.set(t, ln.when || last.get(t) || '-');
      windows.forEach((n, j) => { const d = since(n); if (d === null || (ln.day && ln.day >= dayKey(d))) add(win[j], t); });
    }
  }
  return { all, last, win, windows, unknown, closes: closes.length };
}
/* a sortable key from "30 Sep", "30 Sept, 18:12 UK" or "2026-09-30 ..." */
export function dayKey(s) {
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(String(s)); if (iso) return `${iso[1]}${iso[2]}${iso[3]}`;
  const m = /(\d{1,2}) (Sep|Oct|Nov|Dec|Jan)/.exec(String(s)); if (!m) return null;
  const mo = { Sep: '09', Oct: '10', Nov: '11', Dec: '12', Jan: '01' }[m[2]];
  return `${m[2] === 'Jan' ? '2027' : '2026'}${mo}${m[1].padStart(2, '0')}`;
}
export function report(c, max = 40) {
  const rows = [...new Set([...Object.keys(CODES)])].filter(k => c.all.get(k)).sort((a, b) => (c.win[0].get(b) || 0) - (c.win[0].get(a) || 0) || c.all.get(b) - c.all.get(a));
  const out = [`TRIGGERS: ${c.closes} closes in lessons.md; per code: last ${c.windows[0]} closes / last ${c.windows[1]} / all, and the last time it fired`];
  for (const k of rows) out.push(`  ${k.padEnd(12)} ${String(c.win[0].get(k) || 0).padStart(3)} ${String(c.win[1].get(k) || 0).padStart(4)} ${String(c.all.get(k)).padStart(4)}  last ${c.last.get(k)}`);
  const quiet = Object.keys(CODES).filter(k => k.startsWith('c-') && !c.all.get(k));
  if (quiet.length) out.push(`  catches never recorded: ${quiet.join(', ')}`);
  if (c.unknown.length) out.push(`  UNKNOWN CODES (${c.unknown.length}): ${c.unknown.slice(0, 5).join('; ')}`);
  return out.slice(0, max);
}
const read = f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : '');
export function loadSources() {
  const dated = (f, re) => read(f).split('\n').map(l => { const m = re.exec(l); return m ? { when: m[1], day: dayKey(m[1]), text: l } : { when: null, day: null, text: l }; });
  return [
    { name: 'review-log.md', lines: dated('review-log.md', /^- (\d{1,2} Sept?, \d{2}:\d{2} UK)/) },
    { name: 'deep-review-log.md', lines: dated('deep-review-log.md', /^- (\d{1,2} Sep \d{2}:\d{2} UK)/) },
    { name: 'results-mutation-history.txt', lines: dated('results-mutation-history.txt', /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC)/) },
    { name: 'lessons.md', lines: (() => { let d = null; return read('lessons.md').split('\n').map(l => { const c = /\(closed ([^)]+)\)/.exec(l); if (c) d = c[1]; return { when: d, day: d ? dayKey(d) : null, text: l }; }); })() },
  ];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lessons = read('lessons.md');
  if (process.argv.includes('--due')) {
    const d = passDue(lessons);
    if (d.due) { console.log(`RETIREMENT PASS DUE: ${d.since} closes since the last pass (every ${PASS_EVERY})`); process.exit(0); }
    console.log(`retirement pass not due: ${d.since} of ${PASS_EVERY} closes since the last`); process.exit(1);
  }
  const c = counts(loadSources(), lessons);
  for (const l of report(c)) console.log(l);
  const d = passDue(lessons);
  console.log(d.due ? `RETIREMENT PASS DUE: ${d.since} closes since the last pass` : `retirement pass: ${d.since} of ${PASS_EVERY} closes since the last`);
}
