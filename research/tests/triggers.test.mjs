// triggers.mjs and record-review.mjs's tag rule (RULES.md section 10, the feedback loop; amended by the deep review of the
// loop, drafts/feedback-loop-review.md): the parsing, the windows and the success measure, the retirement pass's due rule,
// and the receipt's tag rule - each shown able to fail on a planted case.
//   node research/tests/triggers.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { CODES, tagsIn, minuteKey, lessonsOf, findingsOf, receiptsOf, blockingCodesBetween, passesOf, passDue, windowStats, report } from '../solver/triggers.mjs';
import { tagProblems, movedProblems, startedBlob, liveReceipts } from '../solver/record-review.mjs';
import { planMoves, applyMoves, cutoffOf, archiveOpts, LEDGER_KEEP, POINTER } from '../solver/archive-plan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (c, name) => { assert.ok(c, name); n++; console.log(`PASS  ${name}`); };
const J = x => JSON.stringify(x);

// codes and tags
ok(Object.keys(CODES).every(k => /^[a-z-]+$/.test(k)), 'every code is a plain lower-case word the tag pattern reads');
ok(!CODES.carried && !CODES['c-review'] && CODES.code, 'carried is a modifier, not a code; c-review is gone; code is in');
ok(J(tagsIn('[T:relook] [T:figure]').tags) === '["relook","figure"]', 'known codes parse in order');
ok(tagsIn('[T:nonsense]').unknown[0] === 'nonsense', 'an unknown code is reported, not counted');
ok(J(tagsIn('[T:other:decision-fed] [T:decision-fed]').tags) === '["decision-fed","decision-fed"]' && tagsIn('[T:other:decision-fed]').words.length === 0, 'a word promoted to its own code counts as that code, and is no longer an other word');
ok(J(tagsIn('[T:other:c-deep]').words) === '["other:c-deep"]' && tagsIn('[T:other:c-deep]').tags[0] === 'other', 'a catch code is never taken from an other word');
ok(tagsIn('[T:other]').unknown.length === 1 && J(tagsIn('[T:other:vague]').words) === '["other:vague"]', 'other needs its word, and the word is kept');

// times
ok(minuteKey('30 Sept, 19:08 UK') === minuteKey('30 Sep 19:08 UK') && minuteKey('30 Sep 19:08') === 202609301908, 'the logs\' two date forms read alike');
ok(minuteKey('2026-09-30 17:54 UTC') === 202609301854, 'a UTC time reads as UK summer time');

// findings and receipts
const f = findingsOf('BLOCKING 1. [T:relook] a; MINOR 2: [T:stale] b; MINOR (carried 2) 3. [T:figure] c; BACKLOG 4. [T:register] d');
ok(J(f.map(x => [x.grade, x.carried, x.tags[0]])) === '[["BLOCKING",0,"relook"],["MINOR",0,"stale"],["MINOR",2,"figure"],["BACKLOG",0,"register"]]', 'graded findings split on "n." and "n:", with the carried count');
const log = [
  '- 29 Sept, 10:00 UK | plan ' + 'a'.repeat(40) + ' | FAIL | plan-auditor | BLOCKING 1. [T:figure] old',
  '- 30 Sept, 12:00 UK | plan ' + 'b'.repeat(40) + ' | FAIL | plan-auditor | BLOCKING 1. [T:relook] x; BLOCKING (carried 1) 2. [T:stale] y; BACKLOG 3. [T:register] z',
  '- 30 Sept, 13:00 UK | plan ' + 'c'.repeat(40) + ' | PASS | plan-auditor | none',
  '- 30 Sept, 13:00 UK | plan ' + 'c'.repeat(40) + ' | STARTED | plan-auditor | started x'].join('\n');
const R = receiptsOf(log);
ok(R.length === 3, 'receipts are read, starts are not');
ok(J([...blockingCodesBetween(R, minuteKey('30 Sep 11:00'), minuteKey('30 Sep 14:00'))]) === '["relook"]', 'the window\'s BLOCKING codes exclude carried ones and those before the window');

// lessons, closes, the retirement pass
const lessonsText = n => ['Seed: after 7ai (30 Sep 17:52)', ...Array.from({ length: n }, (_, i) => `## 7x${i} (closed 30 Sep ${String(18 + Math.floor(i / 6)).padStart(2, '0')}:${String(10 * (i % 6)).padStart(2, '0')})\n- [T:relook] a -> DROP: once`)].join('\n');
const L = lessonsOf(lessonsText(3));
ok(L.seed.test === '7ai' && L.closes.length === 3 && L.closes[0].lines.length === 1, 'the seed and the closes, with their lines');
ok(!passDue(lessonsOf(lessonsText(4)).closes, []).due && passDue(lessonsOf(lessonsText(5)).closes, []).due, 'the pass is due at the 5th close and not the 4th');
const deep = '- 30 Sep 18:25 UK | retirement | proposals';
ok(passesOf(deep).length === 1 && !passDue(lessonsOf(lessonsText(5)).closes, passesOf(deep)).due, 'a retirement line in the locked deep-review log resets the count (lessons.md cannot)');

// the success measure
const data = { receipts: R, closes: lessonsOf('Seed: after 7ai (30 Sep 09:00)\n## a (closed 30 Sep 11:00)\n## b (closed 30 Sep 14:00)').closes, launches: [minuteKey('30 Sep 12:30'), minuteKey('30 Sep 12:40')], tagged: [{ at: minuteKey('30 Sep 12:00'), tags: ['c-gate'], words: [], unknown: [] }] };
const w1 = windowStats(data, 1);
const ws = windowStats({ ...data, seedAt: minuteKey('30 Sep 11:30') }, 5);
ok(ws.receipts === 2 && windowStats(data, 5).receipts === 3, 'with n closes or fewer the window opens at the seed, not at the first receipt (the auditor\'s MINOR 5)');
ok(w1.receipts === 2 && w1.fails === 1 && w1.blocking === 1 && w1.backlog === 1 && w1.launchesPerClose === 2 && w1.catches.get('c-gate') === 1, 'the last-close window counts receipts, FAILs, primary BLOCKINGs, BACKLOGs, launches and catches');
const rep = report(data, { 'PLAN.md': 1 });
ok(rep.length <= 40 && rep.some(l => /review cycles/.test(l)) && rep.some(l => /always-read bytes: PLAN.md 1/.test(l)), 'the report prints the measure and the bytes');
ok(report({ ...data, tagged: [{ at: 1, tags: [], words: [], unknown: ['bogus'] }] }, {})[0].startsWith('UNKNOWN CODES'), 'the UNKNOWN line comes first, so the cap cannot drop it');

// the receipt's tag rule (record-review.mjs)
ok(tagProblems('none').length === 0, '"none" alone needs no tag');
ok(tagProblems('none. CHECKED AND SOUND. MINOR 1. PLAN.md l.3: stale').length === 1, '"none." followed by an untagged MINOR is refused (the hole the review found)');
ok(tagProblems('MINOR 1: x [T:other:foo]; MINOR 2: y').length === 1, 'colon-numbered findings are split, and the untagged one refused');
ok(tagProblems('MINOR 1. [T:bogus] x').length === 1 && tagProblems('MINOR 1. [T:other] x').length === 1, 'an unknown code, or other without its word, is refused');
ok(tagProblems('MINOR (carried 3) 1. [T:stale] x', 'PASS').length === 1 && tagProblems('MINOR (carried 3) 1. [T:stale] x', 'FAIL').length === 0, 'a finding carried by 3 receipts cannot sit in a PASS');
ok(tagProblems('BLOCKING 1. [T:relook] a; MINOR 2. [T:stale] b').length === 0, 'tagged findings pass');
let refused = false;
try { execFileSync('node', [join(HERE, '../solver/record-review.mjs'), '--check-only', '--verdict', 'pass', '--findings', 'MINOR 1. untagged'], { stdio: 'pipe' }); } catch { refused = true; }
ok(refused, 'the CLI refuses an untagged finding');
execFileSync('node', [join(HERE, '../solver/record-review.mjs'), '--check-only', '--verdict', 'pass', '--findings', 'MINOR 1. [T:stale] tagged'], { stdio: 'pipe' });
ok(true, 'the CLI accepts a tagged finding (check only, nothing written)');
// a verdict binds to the version its review started on (30 Sep 19:36: a plan edited during a review)
{ const S = (r, v, b) => ({ reviewer: r, verdict: v, blob: b });
  ok(startedBlob([S('plan-auditor', 'STARTED', 'a'), S('archive-plan (verified)', 'PASS', 'b')], 'plan-auditor') === 'a', 'the receipt names the blob the reviewer started on, another reviewer\'s line between');
  ok(startedBlob([S('plan-auditor', 'STARTED', 'a'), S('plan-auditor', 'PASS', 'a')], 'plan-auditor') === null && startedBlob([], 'plan-auditor') === null, 'a start already receipted, or none, binds nothing (the file as it stands)'); }
  // a withdrawn move (the maintainer's unlock of 1 Oct 06:45 UK; RULES.md known limit 25): no base lookup takes its blob
  { const S = (r, v, b) => ({ reviewer: r, verdict: v, blob: b });
    const L = [S('plan-auditor', 'PASS', 'a'), S('archive-plan (verified)', 'PASS', 'm'), S('plan-auditor', 'STARTED', 'b')];
    ok(liveReceipts(L).slice(-1)[0].blob === 'm', 'a verified move stands as the last receipt until withdrawn');
    const W = [...L, S('archive-plan', 'WITHDRAWN', 'm')];
    ok(liveReceipts(W).slice(-1)[0].blob === 'a' && liveReceipts(W).length === 1, 'once withdrawn, the move and the withdrawal line drop out, and the base is the receipt before it');
    ok(liveReceipts([S('plan-auditor', 'PASS', 'm'), S('archive-plan', 'WITHDRAWN', 'm')]).length === 1, 'a withdrawal drops only the move, not a reviewer\'s receipt of the same blob'); }

// the archive (archive-plan.mjs) and its verified move (record-review.mjs --moved)
ok(cutoffOf(lessonsText(2)) === '28 Sep' && cutoffOf('Seed: after 7ai (30 Sep 17:53)\n## a (closed 1 Oct 09:00)\n- x\n## b (closed 2 Oct 09:00)\n- x\n## c (closed 3 Oct 09:00)\n- x') === '1 Oct', 'the cut-off is the newest-but-two close, 28 Sep before three');
{
  const led = Array.from({ length: LEDGER_KEEP + 2 }, (_, i) => `| ${29 - Math.floor(i / 10)} Sep ${String(10 + (i % 10)).padStart(2, '0')}:00 | **${i === 5 ? 'The deep review after 7x' : `result ${i}`}** | c | e |`);
  const plan = ['## Odd results register', '', '| id | a | b | c | d | status |', '|---|---|---|---|---|---|', '| O1 | x | y | z | w | resolved: kept |', '| O8 | x | y | z | w | resolved: by 7x |', '| O9 | x | y | z | w | open |', '',
    '**The re-look ledger**', '', '| date | the settled result | what it changed | evidence |', '|---|---|---|---|', ...led, '',
    '## The schedule', '', '| # | step | status |', '|---|---|---|', '| 7x | a | DONE: read |', '| 7y | b | REGISTERED |', '| 7z | c | **READ** (x) |', '| 7w | d | READ (y) |', '', '## After'].join('\n');
  const lz = 'Seed: after 7w (29 Sep 09:00)\n## 7z (closed 29 Sep 10:00)\n- x\n## 7q (closed 29 Sep 11:00)\n- x\n## 7r (closed 29 Sep 12:00)\n- x\n';
  const deepLog = '- 29 Sep 20:00 UK | covered 7r (x) | level HIGH | y\n';
  const m = planMoves(plan, '29 Sep', archiveOpts(lz, deepLog));
  ok(J(m.reg.map(i => m.lines[i].slice(0, 6))) === '["| O8 |"]', 'the register moves resolved rows, never O1, O2 or O7, never open ones');
  ok(m.led.length === 3 && m.led.some(i => /deep review/.test(m.lines[i])), `the ledger moves the rows beyond its newest ${LEDGER_KEEP} and the deep-review rows to the cut-off`);
  ok(planMoves(plan, '28 Sep').led.length === 2, 'a deep-review row after the cut-off stays');
  ok(J(m.sch.map(i => m.lines[i].slice(0, 6))) === '["| 7x |","| 7z |","| 7w |"]', 'the schedule moves finished rows (DONE, READ) two closes old; an unfinished row stays');
  ok(planMoves(plan, '29 Sep', archiveOpts(lz.replace(/## 7r[\s\S]*$/, ''), deepLog)).sch.map(i => m.lines[i].slice(0, 6)).join() === '| 7x |,| 7w |', 'a finished row closed only one close ago (7z) stays');
  ok(planMoves(plan, '29 Sep', archiveOpts(lz, '- 29 Sep 13:00 UK | covered 7r (x) | level HIGH | y\n')).led.length === 2 && planMoves(plan, '29 Sep', archiveOpts(lz, '- 28 Sep 13:00 UK | covered 7r (x) | level HIGH | y\n')).led.length === 0, 'ledger rows after the last deep review stay, for uncertainty.mjs\'s count (the auditor\'s MINOR 6)');
  const r = applyMoves(m, '2026-09-30');
  const pointers = r.plan.split('\n').filter(l => POINTER.test(l));
  ok(pointers.length === 3 && r.moved === 7, 'one pointer line per table that lost rows');
  ok(movedProblems(plan, r.plan, r.hist).length === 0, '--moved: the archive\'s own move verifies');
  ok(movedProblems(plan, r.plan.replace('| O9 | x |', '| O9 | X |'), r.hist).length === 2, '--moved: a reworded live row is refused (removed and added)');
  ok(movedProblems(plan, r.plan, r.hist.replace('| O8 | x', '| O8 | q')).length === 1, '--moved: a row missing from the history is refused');
  ok(movedProblems(plan, plan, '').length === 1, '--moved: no change is not a move');
}
console.log(`${n} passed`);
