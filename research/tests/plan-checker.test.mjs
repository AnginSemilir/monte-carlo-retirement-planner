/*
 * THE PLAN CHECKER AND THE PREDICTION CHECK, EACH SHOWN TO FAIL ON A PLANTED FAULT (RULES.md rule 2: trust a check only
 * after it has failed on a planted fault). The real PLAN.md must pass; every planted fault must be caught by name.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPlan, MAX_CHECKLIST } from '../solver/check-plan.mjs';
import { checkPredictionText } from '../solver/check-prediction.mjs';
import { VARIABLES } from '../solver/fair-variables.mjs';

const S = join(dirname(fileURLToPath(import.meta.url)), '../solver');
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const read = p => readFileSync(join(S, p), 'utf8');
const base = { plan: read('PLAN.md'), rules: read('RULES.md'), checklist: read('CHECKLIST.md'), added: [], readSolverFile: read, solverFileExists: p => existsSync(join(S, p)) };
const run = over => checkPlan({ ...base, ...over });
const caught = (errs, tag, what) => ok(errs.some(e => e.startsWith(`[${tag}]`)), `planted fault caught (${tag}): ${what}`);

// the real plan passes
const real = run({});
if (real.length) console.log(real.join('\n'));
ok(real.length === 0, 'the plan as it stands passes every whole-file check');

// checklist
caught(run({ checklist: base.checklist + '\n13. an extra rule' }), 'checklist', `more than ${MAX_CHECKLIST} items`);
caught(run({ plan: base.plan.replace('4. Every figure in the plan', '4. Most figures in the plan') }), 'checklist', "PLAN.md's copy drifts from CHECKLIST.md");
// variables
caught(run({ rules: base.rules.replace('| 7 | The market world', '| 7 | The market') }), 'variables', "RULES.md's table drifts from fair-variables.mjs");
// clock
caught(run({ plan: base.plan.replace('**Clock.** Times in this file are UK time', '**Clock.** Times are whatever') }), 'clock', 'no clock declared');
caught(run({ added: ['| 25 Sep 10:00 UTC | something |'] }), 'clock', 'a new time written in UTC');
ok(!run({ added: ['| 25 Sep 11:00 UK (10:00 UTC) | something |'] }).some(e => e.startsWith('[clock]')), 'a UK time with its UTC beside it passes');

// ledger
const ledgerRow = cells => base.plan.replace('|---|---|---|---|\n', `|---|---|---|---|\n| 25 Sep ~10:00 | ${cells} |\n`);
caught(run({ plan: ledgerRow('a result | a change') }), 'ledger', 'a row without the evidence cell');
caught(run({ plan: ledgerRow('a result | a change | results: results-k5-targets.txt; prediction: none (a measurement)') }), 'ledger', 'evidence without the fair-test outcome');
caught(run({ plan: ledgerRow('a result | a change | results: results-nope.txt; fair-test: pass; prediction: none (a measurement)') }), 'ledger', 'a cited results file that does not exist');
caught(run({ plan: ledgerRow('median cut 9.99 | a change | results: results-k5-targets.txt; fair-test: pass; prediction: none (a measurement)') }), 'ledger', 'a figure not in the cited file (an arithmetic slip)');
ok(!run({ plan: ledgerRow('median cut 2.14 | a change | results: results-k5-targets.txt; fair-test: pass; prediction: none (a measurement)') }).some(e => e.startsWith('[ledger]')), 'a figure that is in the cited file passes');
caught(run({ plan: ledgerRow('median cut 2.14 | a change | results: none; fair-test: pass; prediction: none (a measurement)') }), 'ledger', 'a figure with no results file cited');
caught(run({ plan: ledgerRow('a result | a change | results: results-k5-targets.txt; fair-test: fail; prediction: none (a measurement)') }), 'ledger', 'a failed fair test not marked PROVISIONAL');
caught(run({ plan: ledgerRow('a result | a change | results: results-k5-targets.txt; fair-test: n/a; prediction: none (a measurement)') }), 'ledger', 'fair-test n/a without a reason');
caught(run({ plan: ledgerRow('a result | a change | results: results-k5-targets.txt; fair-test: pass; prediction: none') }), 'ledger', 'prediction none without a reason');
caught(run({ plan: ledgerRow('a result | a change | results: results-k5-targets.txt; fair-test: pass; prediction: predictions/nope.md') }), 'ledger', 'a cited prediction file that does not exist');
ok(!run({ plan: ledgerRow('a decision | a change | decision: maintainer, 25 Sep') }).some(e => e.startsWith('[ledger]')), 'a maintainer decision row passes with "decision:"');

// register
const regRow = cells => base.plan.replace('|---|---|---|---|---|---|\n', `|---|---|---|---|---|---|\n| O99 | ${cells} |\n`);
caught(run({ plan: regRow('an odd number | 25 Sep | - | - | open') }), 'register', 'an open odd result with no owner or gate');
caught(run({ plan: regRow('an odd number | 25 Sep | Claude | Phase 4 | pending') }), 'register', 'a status that is not open, resolved or closed');
caught(run({ plan: regRow('an odd number | 25 Sep | Claude | Phase 4 | resolved') }), 'register', 'resolved without saying how');
caught(run({ plan: base.plan.replace('| O2 |', '| O1 |') }), 'register', 'a duplicate id');

// bugs
caught(run({ plan: base.plan.replace('### Bugs found and fixed on 24 Sep\n', '### Bugs found and fixed on 24 Sep\n\n- **A planted bug** with no sweep line.\n') }), 'bugs', 'a bug entry with no "Same pattern searched:"');
ok(!run({ plan: base.plan.replace('### Bugs found and fixed on 23 Sep\n', '### Bugs found and fixed on 23 Sep\n\n- **An old bug** from before the rule.\n') }).some(e => e.startsWith('[bugs]')), 'bug entries before 24 Sep are not held to the new rule');

// schedule
// a made-up pending row, so the planted fault never depends on a live row's state (it used to edit 7b, which then finished)
const planted = '| 0-7k |';   // the finished rows' pointer, which stays (7b, its first anchor, moved to PLAN-HISTORY.md on 25 Sep)
ok(base.plan.includes(planted), 'the schedule row the planted one goes before exists');
caught(run({ plan: base.plan.replace(planted, '| 9z | **A planted run** (`batch-planted.sh`, no prediction) | - | - | not yet |\n' + planted) }), 'schedule', 'a pending batch with no registered prediction');
ok(!run({ plan: base.plan.replace(planted, '| 9z | **A planted run** (`batch-planted.sh`) | - | - | done |\n' + planted) }).some(e => e.startsWith('[schedule]')), 'the same row marked done is not held to it');

// predictions named in the plan
caught(run({ plan: base.plan + '\nSee `predictions/not-there.md`.\n' }), 'predictions', 'a named prediction that does not exist');
caught(run({ readSolverFile: p => (p === 'predictions/m14b.md' ? read(p).replace('## Falsified if', '## Something else') : read(p)) }), 'predictions', 'a named prediction that fails its own check');

// finished work
caught(run({ plan: base.plan + '\n## Step 99 (COMPLETED 25 Sep)\n' }), 'finished', 'a COMPLETED section left in the plan');
// decided defaults
caught(run({ plan: base.plan.replace('"raiseCap": 1.1,', '"raiseCap": 1.1,,') }), 'defaults', 'a decided-defaults block that does not parse');

// no-effect claims on new lines
caught(run({ added: ["K5's matching is unaffected by the cap."] }), 'no-effect', 'an unevidenced "unaffected"');
caught(run({ added: ['The minimum pot does not change the cutting.'] }), 'no-effect', 'an unevidenced "does not change"');
ok(!run({ added: ['The minimum pot does not change the cutting (evidence: results-k5-targets.txt, grade B).'] }).some(e => e.startsWith('[no-effect]')), 'the same claim with graded evidence passes (grade A or B, RULES.md section 8)');
ok(!run({ added: ['Probably unaffected - NOT CHECKED.'] }).some(e => e.startsWith('[no-effect]')), 'the same claim marked NOT CHECKED passes');
ok(!run({ added: ['The rule: "it doesn\'t affect X" is a claim.', '~~K5 is unaffected~~ WRONG'] }).some(e => e.startsWith('[no-effect]')), 'quoted and struck-through text is not a claim');
const multi = base.plan + '\n\nFirst line of a claim ~~that was\nstruck: the pot does not change the cutting~~ and then retracted.\n';
ok(!run({ plan: multi, added: ['struck: the pot does not change the cutting~~ and then retracted.'] }).some(e => e.startsWith('[no-effect]')), 'the tail of a strikethrough that spans lines is not a claim');
const multi2 = base.plan + '\n\nFirst line ~~struck\ntext~~ but the cap does not change the cutting.\n';
caught(run({ plan: multi2, added: ['text~~ but the cap does not change the cutting.'] }), 'no-effect', 'a live claim after a multi-line strikethrough closes');
const stray = base.plan + '\n\nA stray ~~ here, and\nthe cap does not change the cutting.\n\nA stray ~~ here, and the pot does not change the cutting.\n';
caught(run({ plan: stray, added: ['the cap does not change the cutting.'] }), 'no-effect', 'planted: a stray ~~ above does not hide a claim below it');
caught(run({ plan: stray, added: ['A stray ~~ here, and the pot does not change the cutting.'] }), 'no-effect', 'planted: a stray ~~ does not hide the rest of its own line');

// the prediction check
const good = read('predictions/m14b.md');
ok(checkPredictionText(good, { name: 'm14b.md' }).length === 0, 'a complete prediction file passes (m14b.md, registered before the regimen)');
const pErr = t => checkPredictionText(t, { name: 'm14b.md' });
ok(pErr(good.replace(/\| 13 \|(.*)\| TESTED[^|]*\|/, '| 13 |$1| SAME |')).some(e => /TESTED/.test(e)), 'planted: a test with no TESTED row is refused');
ok(pErr(good.replace(/^\| 22 \|.*\n/m, '')).some(e => /variable 22/.test(e)), 'planted: a missing fair-test row is refused');
ok(pErr(good.replace(/^(\| 5 \|[^|]*\|)[^|]*\|/m, '$1 ? |')).some(e => /"\?"/.test(e)), 'planted: a "?" left in the table is refused');
ok(pErr(good.replace(/N\/A - the solver against itself; no rival arm/, 'N/A')).some(e => /needs a reason/.test(e)), 'planted: N/A without a reason is refused');
ok(pErr(good.replace('## Changes after seeing results', '## Notes')).some(e => /Changes after seeing results/.test(e)), 'planted: no "Changes after seeing results" section is refused');
ok(pErr(good.replace(/- \*\*Kind:\*\*.*\n/, '')).some(e => /Kind/.test(e)), 'planted: no Kind field is refused');
ok(VARIABLES.length === 33 && VARIABLES.every((v, i) => v.n === i + 1), 'the variable list is numbered 1 to 33 without gaps');

// the regimen's prediction fields (RULES.md section 8)
const reg = read('predictions/bridge-reader.md');
const rErr = t => checkPredictionText(t, { name: 'bridge-reader.md' });
ok(rErr(reg).length === 0, 'a prediction written under the regimen, with every field, passes (bridge-reader.md)');
ok(checkPredictionText(good).some(e => /the regimen/.test(e)), 'planted: an old prediction checked with no name is held to the regimen (the exemption is by name only)');
ok(checkPredictionText(good, { name: 'new-test.md' }).some(e => /Decision rule/.test(e)), 'planted: a new file without the regimen\'s fields is refused');
ok(rErr(reg.replace('## Pre-mortem', '## Afterthoughts')).some(e => /Pre-mortem/.test(e)), 'planted: a regimen prediction without its pre-mortem is refused');
ok(rErr(reg.replace(/## Decision fed[\s\S]*?(?=\n## )/, '## Decision fed\n\n- **Held:** the reader goes forward.\n')).some(e => /held, falsified and inconclusive/.test(e)), 'planted: a decision-fed section naming one outcome of three is refused');
ok(rErr(reg.replace(/^- `derive: [^\n]*$/m, '- the arithmetic is in derive-7e.mjs')).some(e => /derive:/.test(e)), 'planted: a derivation script with no derive line (and no hash) is refused');
ok(rErr(reg.replace(/## Credence[\s\S]*?(?=\n## )/, '## Credence\n\nHigh on every item.\n')).some(e => /probability/.test(e)), 'planted: a credence with no probability is refused');

// claim linting, evidence grades and the materiality gate (RULES.md section 8)
caught(run({ added: ['The reader is settled by 7e.'] }), 'claims', 'an ungraded "settled by"');
caught(run({ added: ['7c shows that v2 costs survival.'] }), 'claims', 'an ungraded "shows that"');
caught(run({ added: ['The exact final year costs nothing.'] }), 'claims', 'an ungraded "costs nothing"');
ok(!run({ added: ['7c shows that v2 costs survival (grade B: results-f1v2.txt).'] }).some(e => e.startsWith('[claims]')), 'the same claim with a grade B citation passes');
ok(!run({ added: ['After a settled result, re-derive; the table shows the gap; it is not settled until 7e.'] }).some(e => e.startsWith('[claims]')), 'a noun use ("a settled result", "the table shows") and "not settled" are not claims');
caught(run({ added: ['The cap does not change the cutting (evidence: results-k5-targets.txt).'] }), 'no-effect', 'a no-effect claim whose evidence names no grade');
ok(!run({ added: ['The cap does not change the cutting (evidence: results-k5-targets.txt, grade A).'] }).some(e => e.startsWith('[no-effect]')), 'the same claim with grade A evidence passes');
{
  const row = '| 26 Sep 09:00 | **A planted result** | nothing | results: results-reader-checks.txt; fair-test: n/a (a planted row for the test); prediction: none (a planted row) |';
  const ledgerAt = base.plan.indexOf('| 25 Sep 20:31 |');
  const withRow = base.plan.slice(0, ledgerAt) + row + '\n' + base.plan.slice(ledgerAt);
  caught(run({ plan: withRow, added: [row] }), 'grade', 'a new ledger row with no evidence grade');
  const graded = row.replace('prediction: none (a planted row) |', 'prediction: none (a planted row); grade C |');
  ok(!run({ plan: base.plan.slice(0, ledgerAt) + graded + '\n' + base.plan.slice(ledgerAt), added: [graded] }).some(e => e.startsWith('[grade]')), 'the same row naming grade C passes');
}
{
  const o7 = /^\| O7 \|.*$/m.exec(base.plan)[0];
  const noted = o7.replace(/\| [^|]*\|$/, '| noted, below materiality: at most 0.02 points on the panel mean (evidence: results-o19.txt) |');
  ok(!run({ plan: base.plan.replace(o7, noted) }).some(e => e.startsWith('[register]')), 'a register row "noted, below materiality" with its estimate and evidence passes');
  caught(run({ plan: base.plan.replace(o7, noted.replace('0.02 points', '0.3 points')) }), 'register', 'a noted row whose estimate is not below materiality (0.3 points)');
  caught(run({ plan: base.plan.replace(o7, noted.replace(' (evidence: results-o19.txt)', '')) }), 'register', 'a noted row with no evidence');
}

console.log(`\n${n} passed`);
