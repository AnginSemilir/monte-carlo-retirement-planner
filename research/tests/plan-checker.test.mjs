/*
 * THE PLAN CHECKER AND THE PREDICTION CHECK, EACH SHOWN TO FAIL ON A PLANTED FAULT (RULES.md rule 2: trust a check only
 * after it has failed on a planted fault). The real PLAN.md must pass; every planted fault must be caught by name.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPlan, stalePhrases, MAX_CHECKLIST, PLAN_BUDGET, RULES_BUDGET } from '../solver/check-plan.mjs';
import { checkPredictionText, seedLaunchProblems, SEED_REGISTRY, SEED_OWNERS, outcomeProblems, edgeProblems, reducerOf, decisionTableProblems, mechanismProblems, heldToDecision } from '../solver/check-prediction.mjs';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
// a copy that stays must match (PLAN.md points to the file since 26 Sep: the copy is planted here)
{ const withCopy = c => `${base.plan}\n<!-- checklist:start -->\n${c}\n<!-- checklist:end -->\n`;
  caught(run({ plan: withCopy(base.checklist.replace('4. Every figure in the plan', '4. Most figures in the plan')) }), 'checklist', "PLAN.md's copy drifts from CHECKLIST.md");
  ok(!run({ plan: withCopy(base.checklist) }).some(e => e.startsWith('[checklist]')), 'a word-for-word copy still passes'); }
{ const noBlock = base.plan.replace(/<!-- checklist:start -->[\s\S]*?<!-- checklist:end -->/, 'The checklist: research/solver/CHECKLIST.md.');
  ok(!run({ plan: noBlock }).some(e => e.startsWith('[checklist]')), 'one copy: a plan that points to CHECKLIST.md instead of copying it passes');
  caught(run({ plan: noBlock.replace(/research\/solver\/CHECKLIST\.md/g, 'the checklist file') }), 'checklist', 'a plan with neither the copy nor a pointer to the file'); }
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
caught(run({ plan: base.plan.replace('### Bugs found on 26 Sep\n', '### Bugs found on 26 Sep\n\n- **A planted bug** with no sweep line.\n') }), 'bugs', 'a bug entry with no "Same pattern searched:"');
ok(!run({ plan: base.plan.replace('### Bugs found on 26 Sep\n', '### Bugs found and fixed on 23 Sep\n\n- **An old bug** from before the rule.\n\n### Bugs found on 26 Sep\n') }).some(e => e.startsWith('[bugs]')), 'bug entries before 24 Sep are not held to the new rule (a 23 Sep section planted: the real ones are in PLAN-HISTORY.md since 26 Sep)');

// schedule
// a made-up pending row, so the planted fault never depends on a live row's state (it used to edit 7b, which then finished)
const planted = '| 0-7k |';   // the finished rows' pointer, which stays (7b, its first anchor, moved to PLAN-HISTORY.md on 25 Sep)
ok(base.plan.includes(planted), 'the schedule row the planted one goes before exists');
caught(run({ plan: base.plan.replace(planted, '| 9z | **A planted run** (`batch-planted.sh`, no prediction) | - | - | not yet |\n' + planted) }), 'schedule', 'a pending batch with no registered prediction');
ok(!run({ plan: base.plan.replace(planted, '| 9z | **A planted run** (`batch-planted.sh`) | - | - | done |\n' + planted) }).some(e => e.startsWith('[schedule]')), 'the same row marked done is not held to it');

// predictions named in the plan
caught(run({ plan: base.plan + '\nSee `predictions/not-there.md`.\n' }), 'predictions', 'a named prediction that does not exist');
caught(run({ plan: base.plan + '\nSee `predictions/m14b.md`.\n', readSolverFile: p => (p === 'predictions/m14b.md' ? read(p).replace('## Falsified if', '## Something else') : read(p)) }), 'predictions', 'a named prediction that fails its own check (the mention planted too: the plan stopped naming m14b.md when its 24 Sep rows moved to PLAN-HISTORY.md)');

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
// the SAME rows may go behind one line (the maintainer, 26 Sep 18:02 UK: "Do all")
{
  const declare = t => t.replace(/(## Fair-test table[\s\S]*?\n)(\n## )/, '$1\n- **All other rows: SAME**\n$2');
  const sameOut = t => t.split('\n').filter(l => !(/^\|\s*\d+\s*\|/.test(l) && /\|\s*SAME\b[^|]*\|\s*$/.test(l))).join('\n');
  ok(pErr(declare(sameOut(good))).every(e => !/has no row/.test(e)), 'a table of only its non-SAME rows passes with "All other rows: SAME"');
  ok(pErr(sameOut(good)).some(e => /has no row/.test(e)), 'planted: the same table without the line is refused');
  ok(pErr(declare(sameOut(good).split('\n').filter(l => !/^\|\s*\d+\s*\|.*\|\s*TESTED\b/.test(l)).join('\n'))).some(e => /at least one TESTED row/.test(e)), 'planted: the line does not excuse a test with no TESTED row');
  ok(pErr(declare(good.replace(/^(\| 26 \|[^\n]*\| )N\/A[^|]*\|$/m, '$1N/A |'))).some(e => /26: N\/A needs a reason/.test(e)), 'planted: a written N/A row still needs its reason');
}
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

// the seed registry (RULES.md section 8 item 9; the maintainer's decision 3, built under the unlock of 25 Sep 22:14 UK)
const withSeeds = (s, nm = 'k6-spread.md') => checkPredictionText(reg.replace(/^(- \*\*Kind:\*\*.*)$/m, `$1\n- **Seeds:** ${s}\n- **Unmasking:** none: a seed-registry fixture, no fix is tested`), { name: nm });
ok(withSeeds('7012 (held-out K6 paths)').length === 0, 'a new prediction declaring its own reserved seed passes (7012 under k6-spread.md)');
ok(checkPredictionText(reg, { name: 'k6-spread.md' }).some(e => /Seeds/.test(e)), 'planted: a prediction written after the registry with no Seeds field is refused');
ok(withSeeds('9999 (fresh)').some(e => /not in the seed registry/.test(e)), 'planted: an unregistered seed is refused');
ok(withSeeds('7003 (Phase 4\'s paths)').some(e => /7003 is reserved/.test(e)), 'planted: Phase 4\'s seed 7003 in another prediction is refused');
// 7013, 7u's own held-out seed (the maintainer's unlock of 26 Sep 20:33 UK)
ok(withSeeds('7013 (7u\'s held-out paths)', 'confirm-7u.md').length === 0, '7u\'s prediction declaring its own seed 7013 passes');
ok(withSeeds('7013 (7u\'s held-out paths)').some(e => /7013 is reserved/.test(e)), 'planted: 7u\'s seed 7013 in another prediction is refused');
ok(withSeeds('7011', 'new-test.md').some(e => /7011 is reserved/.test(e)), 'planted: 7e\'s held-out seed 7011 claimed by a new test is refused');
ok(withSeeds('none: a timing, no paths').length === 0 && withSeeds('see the batch').some(e => /names no seed/.test(e)), 'Seeds: "none: <why>" passes; a field naming no seed is refused');
ok(rErr(reg).length === 0 && checkPredictionText(good, { name: 'm14b.md' }).length === 0, 'predictions written before the Seeds field pass without one (bridge-reader.md, m14b.md)');
// the Unmasking field (RULES.md section 9 rule 2; the maintainer's unlock of 26 Sep), for every test written after it
const withU = (u, nm = 'k6-spread.md') => checkPredictionText(reg.replace(/^(- \*\*Kind:\*\*.*)$/m, `$1\n- **Seeds:** 7012 (held-out K6 paths)${u === null ? '' : `\n- **Unmasking:** ${u}`}`), { name: nm });
ok(withU(null).some(e => /Unmasking/.test(e)), 'planted: a new test with no Unmasking field is refused');
ok(withU('none:').some(e => /needs a reason/.test(e)) && withU('none').some(e => /needs a reason/.test(e)), 'planted: "Unmasking: none:" with no reason is refused');
ok(withU('the reader').some(e => /must name the known error/.test(e)), 'planted: a one-phrase Unmasking field is refused');
ok(withU('none: a timing of the solver, no fix is tested').length === 0, 'Unmasking: "none: <why>" passes');
ok(withU('the arm removes the bridge misread; off\'s misread pushes S126 onto a safer tier for life; the jointWorlds arm separates harm from unmasking').length === 0, 'a full Unmasking field passes');
ok(checkPredictionText(reg, { name: 'diag-7t.md' }).every(e => !/Unmasking/.test(e)) && rErr(reg).every(e => !/Unmasking/.test(e)), 'predictions written before the Unmasking field pass without one (diag-7t.md, bridge-reader.md)');
const L = o => seedLaunchProblems(o);
ok(L({ name: 'bridge-reader.md', predText: reg, texts: [read('batch-7e.sh')] }).length === 0, '7e\'s batch launches under its prediction (seed 7011, owned)');
ok(L({ name: null, texts: [read('batch-7e.sh')] }).some(e => /7011 is reserved.*measurement/.test(e)), 'planted: 7e\'s batch launched as a measurement is refused (7011 is reserved)');
ok(L({ name: 'bridge-reader.md', texts: ['node research/solver/audit-s126.mjs bridge7e 16 1000 part 0/1 off,reader S126 7003'] }).some(e => /7003 is reserved/.test(e)), 'planted: Phase 4\'s seed in 7e\'s command is refused');
ok(L({ name: 'k6-spread.md', predText: '- **Seeds:** 7012', texts: ['node x.mjs 7012 7004'] }).some(e => /7004.*does not declare/.test(e)), 'planted: a seed the Seeds field does not declare is refused');
ok(L({ name: null, texts: ['# seed 7003 is Phase 4\'s\nnode x.mjs 7002'] }).length === 0 && L({ name: null, texts: ['timeout 7200 node x.mjs'] }).length === 0, 'comment lines and numbers that are not registered seeds (timeout 7200) are left alone');
// every batch already written launches under the prediction whose Run field names it, or as a measurement if none does
const { readdirSync } = await import('node:fs');
const owner = {};
for (const p of readdirSync(join(S, 'predictions')).filter(x => x.endsWith('.md'))) {
  const t = read(`predictions/${p}`), m = /^-\s+\*\*Run:\*\*(.*)$/mi.exec(t);
  for (const b of (m ? m[1].match(/batch-[\w.-]+\.sh/g) || [] : [])) owner[b] = { name: p, predText: t };
}
const batchFails = readdirSync(S).filter(x => /^batch-.+\.sh$/.test(x)).flatMap(b => L({ ...(owner[b] || { name: null }), texts: [read(b)] }).map(e => `${b}: ${e}`));
ok(batchFails.length === 0 && Object.keys(owner).includes('batch-7e.sh') && Object.keys(owner).includes('batch-m14b.sh'), `every batch written passes the registry under its own prediction (refused: ${batchFails.join('; ') || 'none'})`);
// the registry in code is the registry RULES.md lists
const rulesSeeds = [...(/9\. \*\*A seed registry:\*\*([\s\S]*?)(?:\n\s*\n|The launcher)/.exec(base.rules) || ['', ''])[1].matchAll(/\b(7\d{3})\b/g)].map(m => Number(m[1]));
ok(rulesSeeds.length > 0 && [...new Set(rulesSeeds)].sort().join() === Object.keys(SEED_REGISTRY).map(Number).sort().join(), `the code's seed registry is RULES.md's (${Object.keys(SEED_REGISTRY).join(', ')})`);
ok(Object.values(SEED_OWNERS).flat().filter(o => typeof o === 'string').every(o => existsSync(join(S, 'predictions', o))), 'every prediction a reserved seed names as an owner exists');

// claim linting, evidence grades and the materiality gate (RULES.md section 8)
caught(run({ added: ['The reader is settled by 7e.'] }), 'claims', 'an ungraded "settled by"');
caught(run({ added: ['7c shows that v2 costs survival.'] }), 'claims', 'an ungraded "shows that"');
caught(run({ added: ['The exact final year costs nothing.'] }), 'claims', 'an ungraded "costs nothing"');
{ const plan = '| O1 | the flag blend is ruled out for the bridge stage, grade A for that only | x |\n| O2 | the flag blend is a direct read only, grade A | y |';
  const w = stalePhrases({ plan, added: ['| O2 | the flag blend is a direct read only, grade A | y |'], removed: ['| O2 | the flag blend is ruled out for the bridge stage, grade A for that only | y |'] });
  ok(w.length === 1 && /still stands in "\| O1/.test(w[0]), 'planted: a clause edited out of one row that still stands in another is reported (the 10:08 and 18:13 FAILs)');
  ok(stalePhrases({ plan: '| O2 | new words entirely | y |', added: ['| O2 | new words entirely | y |'], removed: ['| O2 | the flag blend is ruled out for the bridge stage, grade A for that only | y |'] }).length === 0, 'a clause edited out everywhere is not reported');
  ok(stalePhrases({ plan, added: ['| O1 | the flag blend is ruled out for the bridge stage, grade A for that only | x |'], removed: ['| O9 | the flag blend is ruled out for the bridge stage, grade A for that only | z |'] }).length === 0, 'a clause moved into an added line is not reported'); }
caught(run({ added: ['The flag blend is ruled out for the bridge stage.'] }), 'claims', 'an ungraded "ruled out" (the retirement pass, 3 Oct)');
caught(run({ added: ['S194 is the clean household.'] }), 'claims', 'an ungraded "clean household"');
caught(run({ added: ['Both units read calibrated after access.'] }), 'claims', 'an ungraded "calibrated"');
for (const w of ['Ruled out: the flag blend.', 'EXCLUDED: S126, grade C.', 'The arm is cured.', 'The response is not jitter.', 'No harm to S194.', 'S194 is a clean control.', 'The read is excluded from the family.'])
  caught(run({ added: [w] }), 'claims', `an ungraded strong word in any case: "${w}" (the plan-auditor's MINOR 2 of 3 Oct 18:42 UK)`);
ok(!run({ added: ['The flag blend is ruled out as a direct read (grade A).'] }).some(e => /strong claim/.test(e)), 'a graded "ruled out" passes');
ok(!run({ added: ['The flag blend is not ruled out; S194 reads CALIBRATED (the reducer\'s outcome), item 2 -> CALIBRATED; uncalibrated tables.'] }).some(e => /strong claim/.test(e)), 'a negated "not ruled out", the outcome ("reads CALIBRATED") and "uncalibrated" are not claims');
ok(!run({ added: ['Whether the S126 family crosses is NOT CHECKED, so it is not clean households yet; ruled out NOT CHECKED.'] }).some(e => /strong claim/.test(e)), 'NOT CHECKED on the line lets a strong word stand');
ok(!run({ added: ['7c shows that v2 costs survival (grade B: results-f1v2.txt).'] }).some(e => e.startsWith('[claims]')), 'the same claim with a grade B citation passes');
ok(!run({ added: ['After a settled result, re-derive; the table shows the gap; it is not settled until 7e.'] }).some(e => e.startsWith('[claims]')), 'a noun use ("a settled result", "the table shows") and "not settled" are not claims');
caught(run({ added: ['The cap does not change the cutting (evidence: results-k5-targets.txt).'] }), 'no-effect', 'a no-effect claim whose evidence names no grade');
ok(!run({ added: ['The cap does not change the cutting (evidence: results-k5-targets.txt, grade A).'] }).some(e => e.startsWith('[no-effect]')), 'the same claim with grade A evidence passes');
{
  const row = '| 26 Sep 09:00 | **A planted result** | nothing | results: results-reader-checks.txt; fair-test: n/a (a planted row for the test); prediction: none (a planted row) |';
  const ledgerAt = base.plan.indexOf('\n', base.plan.indexOf('|---|---|---|---|', base.plan.indexOf('**The re-look ledger**'))) + 1;   // the ledger's first row (rows get archived)
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

// the retro and the budget (RULES.md section 10, the feedback loop)
{
  const card = s => `THE SCORECARD\n\n7ai (x): Brier 0.3 over 2 (1 0.6 -> held)\n${s}`;
  const seed = 'Seed: after 7ai (30 Sep 17:53)\n';
  const rlog = '- 30 Sept, 20:00 UK | plan ' + 'a'.repeat(40) + ' | FAIL | plan-auditor | BLOCKING 1. [T:relook] x; BLOCKING (carried 1) 2. [T:stale] y\n';
  const retro = (lessons, s = '7zz (y): Brier 0.2 over 1 (1 0.5 -> held)\n', reviewLog = rlog) => run({ lessons, scorecard: card(s), reviewLog });
  const good = seed + '## 7zz (closed 30 Sep 21:00)\n- [T:relook] the row was missed -> AUTOMATE relook.mjs\n';
  ok(!retro(good).some(e => e.startsWith('[retro]')), 'a close with a tagged, disposed lesson naming the window\'s BLOCKING code passes');
  ok(!retro(seed, '').some(e => e.startsWith('[retro]')), 'nothing scored after the seed needs nothing');
  caught(retro(seed), 'retro', 'a test scored after the seed with no close in lessons.md');
  caught(retro(null), 'retro', 'lessons.md missing');
  caught(retro(good.replace('Seed: after 7ai', 'Seed: after 7nope')), 'retro', 'a seed naming a test not in the scorecard');
  caught(retro(good.replace(seed, '')), 'retro', 'no seed line');
  caught(retro(good.replace(' -> AUTOMATE relook.mjs', '')), 'retro', 'a lesson with no disposition');
  caught(retro(good.replace('[T:relook] ', '')), 'retro', 'a lesson with no trigger code (and so the BLOCKING code unnamed)');
  caught(retro(good.replace('[T:relook]', '[T:bogus] [T:relook]')), 'retro', 'a lesson with an unknown code');
  caught(retro(good.replace('[T:relook]', '[T:figure]')), 'retro', 'a close whose lessons miss the window\'s BLOCKING code');
  ok(!retro(good.replace('[T:relook]', '[T:figure]'), undefined, rlog.replace('30 Sept, 20:00', '30 Sept, 17:00')).some(e => e.startsWith('[retro]')), 'a BLOCKING before the seed is not the close\'s to name; a carried one never is');
  caught(retro(good + '- [T:c-gate] a -> DROP: x\n'.repeat(5)), 'retro', 'six lesson lines, over the five');
  caught(retro(good.replace('(closed 30 Sep 21:00)', '(closed later)')), 'retro', 'a close whose time does not parse');
  // the budget
  caught(run({ rules: base.rules + 'x'.repeat(RULES_BUDGET) }), 'budget', 'RULES.md over its budget');
  // its own fixture, not the live plan (O72: a full archive left the live plan nothing to move, so a plant on it planted
  // nothing and this case failed - the maintainer's unlock of 1 Oct 06:45 UK): a ledger of n rows, one past the newest 15
  // when n is 16, padded past the budget
  const tiny = (pad, n = 1) => `## Odd results register\n\n| id | x | y | z | w | status |\n|---|---|---|---|---|---|\n| O5 | a | b | c | d | open |\n\n**The re-look ledger**\n\n| date | the settled result | what it changed | evidence |\n|---|---|---|---|\n${Array.from({ length: n }, (_, i) => `| ${29 - Math.floor(i / 10)} Sep ${String(10 + (i % 10)).padStart(2, '0')}:00 | r${i} | c | e |`).join('\n')}\n\n<!-- ${'x'.repeat(pad)} -->\n`;
  const w = [], bigErrs = run({ plan: tiny(PLAN_BUDGET, 16), warnings: w });
  caught(bigErrs, 'budget', 'PLAN.md over its budget while archive-plan.mjs has rows to move (a 16-row ledger: one past the newest 15)');
  const w2 = [], e2 = run({ plan: tiny(PLAN_BUDGET), warnings: w2 });
  ok(!e2.some(e => e.startsWith('[budget]')) && w2.length === 1 && /nothing archivable/.test(w2[0]), 'over the budget with nothing to move: a warning, not a refusal');
  const w3 = []; run({ plan: tiny(10), warnings: w3 });
  ok(w3.length === 0, 'under the budget: no warning');
}

// outcome coverage (check-prediction.mjs --outcomes; RULES.md section 10, amendment 7)
{
  const fed = '## Decision fed\n- HELD: a. FALSIFIED: b. INCONCLUSIVE: c.\n\n## Provenance\nx\n';
  ok(outcomeProblems(fed, 'OUTCOMES REACHED: item 1: FALSIFIED, HELD, INCONCLUSIVE\n').length === 0, 'an item whose plants reach all three outcomes passes');
  ok(edgeProblems('planted (40): ok\nEDGES: a gap of 0, an empty class, q at 0.15\n').length === 0, 'an EDGES line naming planted boundary cases passes');
  ok(edgeProblems('planted (40): ok\n').length === 1, 'planted: a reducer with no EDGES line is refused (the retirement pass, 3 Oct)');
  ok(edgeProblems('EDGES: a gap of 0\n').length === 1, 'planted: an EDGES line naming one case is refused');
  ok(outcomeProblems(fed, 'planted (40): ok\n').length === 1, 'planted: a reducer with no OUTCOMES REACHED line is refused');
  ok(outcomeProblems(fed, 'OUTCOMES REACHED: item 1: HELD, INCONCLUSIVE\n').length === 2, 'planted: an item that can never read FALSIFIED is refused, twice (under 3, and the Decision fed names it)');
  ok(outcomeProblems(fed, 'OUTCOMES REACHED: item 1: HELD, INCONCLUSIVE, FALSIFIED\nOUTCOMES REACHED: item 2: HARM, NO MATERIAL HARM\n').length === 1, 'planted: a second item short of 3 is refused on its own');
  ok(outcomeProblems(`## Credence\nreads as predicted: 1 (HELD), 0.5; 2 (FALSIFIED), 0.4\n\n${fed}`, 'OUTCOMES REACHED: item 1: FALSIFIED, HELD, INCONCLUSIVE\n').length === 1, 'planted: a prediction item the reducer prints no line for is refused (the auditor\'s MINOR 2)');
  ok(outcomeProblems(`## Decision rule\nItem 1 reads ...; Item 2 reads ...\n\n${fed}`, 'OUTCOMES REACHED: item 1: FALSIFIED, HELD, INCONCLUSIVE\nOUTCOMES REACHED: item 2: FALSIFIED, HELD, INCONCLUSIVE\n').length === 0, 'the items read from the Decision rule when the Credence names none; both covered pass');
  ok(reducerOf('- **Run:** `batch-7al.sh`; reduced by `reduce-7al.mjs` in the real tree') === 'reduce-7al.mjs' && reducerOf('- **Run:** batch.sh') === null, 'the reducer is read from the Run line');
  const REPO = join(S, '../..'), dir = mkdtempSync(join(tmpdir(), 'outc-'));
  const pred = t => { const f = join(dir, `p${Math.random().toString(36).slice(2)}.md`); writeFileSync(f, t); return f; };
  const cli = f => { try { execFileSync('node', [join(S, 'check-prediction.mjs'), '--outcomes', f], { cwd: REPO, stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
  ok(cli(pred(`# x\n- **Run:** reduced by reduce-7al.mjs\n- **Kind:** test\n\n${fed}`)) === 1, 'the CLI refuses a new (uncommitted) test whose reducer (reduce-7al.mjs) reaches its outcomes but prints no EDGES line - EDGES binds a prediction first committed from 3 Oct 19:00 UK');
  ok(cli(join(S, 'predictions', 'diag-7aq.md')) === 0, 'the CLI passes diag-7aq.md, first committed 1 Oct (before EDGES_FROM): its reducer reaches every outcome, and EDGES does not apply (the plan-auditor\'s MINOR 3 of 3 Oct 18:42 UK)');
  ok(cli(pred(`# x\n- **Run:** batch.sh\n- **Kind:** test\n\n${fed}`)) === 1, 'planted: the CLI refuses a new test that names no reducer');
  ok(cli(pred(`# x\n- **Run:** reduced by reduce-nope.mjs\n- **Kind:** test\n\n${fed}`)) === 1, 'planted: the CLI refuses a reducer that does not exist');
  ok(cli(pred(`# x\n- **Run:** batch.sh\n- **Kind:** measurement\n`)) === 0, 'a measurement has no outcomes to reach');
  ok(cli(join(S, 'predictions/diag-7ak.md')) === 0, 'a test registered before outcome coverage is exempt');
}

// THE DECISION TABLE AND THE MECHANISM (the process review, 4 Oct 13:52 UK; the maintainer's unlock of 4 Oct)
{
  const dt = rows => `## Decision table\n| outcomes | action | credence |\n|---|---|---|\n${rows}\n\n## Next\n`;
  ok(decisionTableProblems(dt('| 1 HELD | build COV | 0.5 |\n| 1 FALSIFIED | drop COV | 0.4 |\n| 1 INCONCLUSIVE | build COV | 0.1 |')).length === 0, 'a decision table whose action changes with chance 0.4 passes');
  ok(decisionTableProblems('## Question\nx\n').some(e => /missing section "## Decision table"/.test(e)), 'planted: a test with no decision table is refused');
  ok(decisionTableProblems(dt('| 1 HELD | build COV | 0.85 |\n| 1 FALSIFIED | drop COV | 0.15 |')).some(e => /under a quarter/.test(e)), 'planted: a test whose action changes with chance 0.15 is refused (7av\'s pattern)');
  ok(decisionTableProblems(dt('| 1 HELD | build COV | 0.85 |\n| 1 FALSIFIED | drop COV | 0.15 |\n- **Waiver:** the maintainer asked for this confirmation before Phase 4') ).length === 0, 'a waiver with its reason lets a low-value test through');
  ok(decisionTableProblems(dt('| 1 HELD | build COV | 0.5 |\n| 1 FALSIFIED | build COV | 0.5 |')).some(e => /one action only/.test(e)), 'planted: a table with one action is refused');
  ok(decisionTableProblems(dt('| 1 HELD | a | 0.5 |\n| 1 FALSIFIED | b | 0.3 |')).some(e => /sum to 0.800/.test(e)), 'planted: credences that do not sum to 1 are refused');
  ok(decisionTableProblems(dt('| 1 HELD | a | 0.75 |\n| 1 FALSIFIED | b | 0.25 |')).length === 0, 'EDGE: a chance of exactly a quarter passes');
  const mech = (f, extra = '') => `## Question\nhow often does the top cell straddle\n\n- **Mechanism:** ${f}\n\n## Derivation script\n${extra}\n`;
  const DER = '- derive: research/solver/derive-x.mjs > research/solver/results-x.txt sha256 0123456789abcdef';
  ok(mechanismProblems(mech('src/solver/grid.js:60 "linAxis"', DER)).length === 0 || mechanismProblems(mech('src/solver/grid.js:60 "linAxis"', DER)).every(e => !/no such file/.test(e)), 'an anchor in an existing file is looked up');
  ok(mechanismProblems(mech('src/solver/nope.js:1 "anything here"', DER)).some(e => /no such file/.test(e)), 'planted: an anchor in a missing file is refused');
  ok(mechanismProblems(mech('src/solver/grid.js:1 "zzzz-not-in-the-file-zzzz"', DER)).some(e => /not within five lines/.test(e)), 'planted: a snippet the file does not hold near that line is refused');
  ok(mechanismProblems(mech('research/solver/check-prediction.mjs:1 "THE PREDICTION FILE CHECK"', '- none: no arithmetic')).some(e => /needs a "derive:" line/.test(e)), 'planted: anchors without a derive line are refused');
  ok(mechanismProblems(mech('research/solver/check-prediction.mjs:1 "THE PREDICTION FILE CHECK"', DER)).length === 0, 'an anchor that matches, with a derive line, passes');
  ok(mechanismProblems('## Question\nwhich cause carries the harm: decompose it\n\n- **Mechanism:** none: nothing is attributed by this run at all\n').some(e => /not accepted/.test(e)), 'planted: "none:" on an attribution test is refused');
  ok(mechanismProblems('- **Mechanism:** none: a confirmation; no cause is attributed\n\n## Question\ndoes the bundle harm survival on the panel\n').length === 0, 'EDGE: "none:" with a reason on a confirmation passes');
  ok(mechanismProblems('## Question\nx\n').some(e => /missing "- \*\*Mechanism/.test(e)), 'planted: no Mechanism field is refused');
  {
    const abs = join(S, 'predictions', 'diag-7au.md');
    ok(heldToDecision(abs) === false && heldToDecision('predictions/diag-7au.md') === false, 'a committed prediction (before 4 Oct 14:30 UK) is exempt, by its full path and by the name check-plan passes');
    const dir = mkdtempSync(join(S, 'predictions', 'zz-dec-')), f = join(dir, 'zz-new-test.md'); writeFileSync(f, '# Prediction: x\n');
    ok(heldToDecision(f) === true, 'an uncommitted prediction on disk is held to the decision rules');
    const relName = f.slice(join(S, '/').length);
    ok(heldToDecision(relName) === true, 'a name relative to research/solver (as check-plan passes it) is found on disk');
    ok(heldToDecision(f, { at: Date.parse('2026-10-04T14:31:00+01:00') }) === true && heldToDecision(f, { at: Date.parse('2026-10-04T14:29:00+01:00') }) === false, 'EDGE: a prediction first committed after 4 Oct 14:30 UK is held, one before is exempt');
    rmSync(dir, { recursive: true, force: true });
    ok(heldToDecision(null) === false && heldToDecision('k6-spread.md') === false && heldToDecision(null, { decision: true }) === true, 'fixtures by name and nameless texts are exempt unless forced');
  }
  // the commit-msg check: listed rows must be answered (relook.mjs --msg, here with given ids)
  {
    const m = join(tmpdir(), `relook-msg-${process.pid}.txt`), run = () => { try { execFileSync('node', [join(S, 'relook.mjs'), 'O67', '--msg', m], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
    writeFileSync(m, 'x\n'); ok(run() === 1, 'planted: a commit message that answers no listed row is refused');
    const ids = execFileSync('node', [join(S, 'relook.mjs'), 'O67']).toString().match(/PLAN\.md:\d+\s+(\S+)/g).map(x => x.split(/\s+/)[1]);
    writeFileSync(m, `x\n\nrelook: ${[...new Set(ids)].join(', ')} unchanged: a test fixture, nothing moves here\n`); ok(run() === 0, 'a commit message answering every listed row passes');
    writeFileSync(m, `x\n\nrelook: ${[...new Set(ids)].join(', ')} unchanged: short\n`); ok(run() === 1, 'EDGE: an answer with a reason under ten characters is refused');
  }
}

// THE REPLACE FOLLOW-THROUGH (the process review, 4 Oct; the maintainer's unlock of 4 Oct)
{
  const { replaceProblems } = await import('../solver/check-plan.mjs');
  const { lessonsOf } = await import('../solver/triggers.mjs');
  const files = { 'a.md': 'the skill now says: quote the gate row\'s own conditions when restating any gate at all' };
  const rf = f => (f in files ? files[f] : null);
  const L = t => lessonsOf(`Seed: after x (1 Oct 10:00)\n${t}`);
  const landed = L('## 7zz (closed 4 Oct 15:00)\n- [T:relook] x -> REPLACE "restate" in a.md with: quote the gate row\'s own conditions when restating any gate at all\n## 7zy (closed 4 Oct 16:00)\n- [T:design] y -> DROP\n');
  ok(replaceProblems(landed, rf).length === 0, 'a REPLACE whose text landed in its target by the next close passes');
  const not = L('## 7zz (closed 4 Oct 15:00)\n- [T:relook] x -> REPLACE "restate" in a.md with: some other text entirely that the file never came to hold\n## 7zy (closed 4 Oct 16:00)\n- [T:design] y -> DROP\n');
  ok(replaceProblems(not, rf).some(e => /has not landed/.test(e)), 'planted: a REPLACE text missing from its target at the next close is refused');
  ok(replaceProblems(L('## 7zz (closed 4 Oct 15:00)\n- [T:relook] x -> REPLACE "restate" with nothing named\n'), rf).some(e => /needs "in <target file>"/.test(e)), 'planted: a REPLACE with no target or new text is refused');
  ok(replaceProblems(L('## 7zz (closed 4 Oct 15:00)\n- [T:relook] x -> REPLACE "restate" in a.md with: text not yet landed but this is the latest close of all\n'), rf).length === 0, 'EDGE: the latest close is not yet held to landing');
  ok(replaceProblems(L('## 7zz (closed 3 Oct 15:00)\n- [T:relook] x -> REPLACE "restate" with nothing\n## 7zy (closed 4 Oct 16:00)\n- [T:design] y -> DROP\n'), rf).length === 0, 'EDGE: a close before 4 Oct 14:30 UK is exempt');
}

// THE PLAN'S SHAPE (the process review, 4 Oct, item 9; the maintainer's unlock of 4 Oct)
{
  const { shapeProblems, ROW_CAP } = await import('../solver/check-plan.mjs');
  const files = { 'results-x.txt': 'figure 1.2345 here', 'reader.js': 'a\nb\nlet unsupported = 0;\nc\n' };
  const rs = f => files[f.replace(/^(\.\.\/)+(src\/solver\/)?/, '')], ex = f => rs(f) !== undefined;
  const prem = (anchor) => `## Premises at risk\n\n| id | premise | code anchor | test | status |\n|---|---|---|---|---|\n| PR1 | p | ${anchor} | t | open |\n\n## Odd results register\n\n| id | what | found | owner | resolve by | status |\n|---|---|---|---|---|---|\n| O1 | x | y | z | g | open |\n\n## The schedule\n\n| 7zz | a | b | c | d |\n\n## End\n`;
  const plan = prem('reader.js:3 "let unsupported = 0;"');
  const sh = o => shapeProblems({ readSolverFile: rs, solverFileExists: ex, plan, ...o }).problems;
  ok(sh({}).length === 0, 'a premise whose anchor matches its file passes');
  ok(shapeProblems({ readSolverFile: rs, solverFileExists: ex, plan: prem('reader.js:3 "not in this file at all"') }).problems.some(e => /not within five lines/.test(e)), 'planted: a premise whose code moved is refused');
  ok(shapeProblems({ readSolverFile: rs, solverFileExists: ex, plan: '## Odd results register\n' }).problems.some(e => /Premises at risk/.test(e)), 'planted: a plan with no premise register is refused');
  const big = `| O1 | ${'x'.repeat(ROW_CAP)} | y | z | g | open |`;
  ok(sh({ added: [big] }).some(e => /at most 3000/.test(e)), 'planted: a new row over the cap is refused');
  ok(sh({ added: [big], removed: [`| O1 | ${'x'.repeat(ROW_CAP + 50)} | y | z | g | open |`] }).every(e => !/at most/.test(e)), 'EDGE: an over-cap row that shrinks may be edited');
  ok(sh({ added: [big + 'more'], removed: [big] }).some(e => /grown from/.test(e)), 'planted: an over-cap row that grows is refused');
  ok(sh({ added: ['| O1 | a new figure 9.8765 here | y | z | g | open |'], removed: ['| O1 | old | y | z | g | open |'] }).some(e => /9.8765/.test(e)), 'planted: a new figure in a register row with no results file is refused');
  ok(sh({ added: ['| O1 | figure 1.2345 (results-x.txt) | y | z | g | open |'], removed: ['| O1 | old | y | z | g | open |'] }).length === 0, 'a new figure found in the cited results file passes');
  ok(sh({ added: ['| O1 | kept 3.1416 and more | y | z | g | open |'], removed: ['| O1 | kept 3.1416 | y | z | g | open |'] }).length === 0, 'EDGE: a figure the row already carried is not re-checked');
  ok(shapeProblems({ readSolverFile: rs, solverFileExists: ex, plan, added: ['| 7zz | waits on 7au REGISTERED | b | c | d |'] }).warnings.some(w => /restates 7au/.test(w)), 'a status word about another item in a schedule row is reported');
}

// --range and --staged read files outside research/solver by a normalised path (the plan-auditor's BLOCKING 1 of 4 Oct:
// git resolves no '..' inside a commit, and CI's --range failed on every push from 2f20a76)
{
  const { exists, source } = await import('../solver/check-plan.mjs');
  ok(exists('rev', 'HEAD')('../../src/solver/reader.js') === true && /buildReaderTable/.test(source('rev', 'HEAD')('../../src/solver/reader.js')), 'rev mode finds and reads a file outside research/solver');
  ok(exists('rev', 'HEAD')('../../src/solver/no-such-file.js') === false, 'rev mode reports a missing file as missing');
  ok(exists('staged')('../../src/solver/reader.js') === true, 'staged mode finds a file outside research/solver');
}

// the audit's MINORs 5 and 6 of 4 Oct: a struck key is the same row; a figure matches whole; a REPLACE is checked at the next close only
{
  const { shapeProblems, replaceProblems, ROW_CAP } = await import('../solver/check-plan.mjs');
  const { lessonsOf } = await import('../solver/triggers.mjs');
  const files = { 'results-x.txt': 'figure 0.4045 here', 'reader.js': 'a\nb\nlet unsupported = 0;\nc\n' };
  const rs = f => files[f.replace(/^(\.\.\/)+(src\/solver\/)?/, '')], ex = f => rs(f) !== undefined;
  const plan = `## Premises at risk\n\n| id | premise | code anchor | test | status |\n|---|---|---|---|---|\n| PR1 | p | reader.js:3 "let unsupported = 0;" | t | open |\n\n## Odd results register\n\n| id | what | found | owner | resolve by | status |\n|---|---|---|---|---|---|\n| O1 | x | y | z | g | open |\n\n## The schedule\n\n| 7zz | a | b | c | d |\n\n## End\n`;
  const sh = o => shapeProblems({ readSolverFile: rs, solverFileExists: ex, plan, ...o }).problems;
  const long = `| 7zz | ${'x'.repeat(ROW_CAP + 10)} | b | c | d |`;
  ok(sh({ added: [long.replace('| 7zz |', '| ~~7zz~~ |')], removed: [long] }).every(e => !/at most/.test(e)), 'EDGE: striking a long row through keeps its key (no cap on a struck row that did not grow)');
  ok(sh({ added: ['| O1 | now 0.404 (results-x.txt) | y | z | g | open |'], removed: ['| O1 | old | y | z | g | open |'] }).some(e => /0\.404/.test(e)), 'planted: 0.404 does not pass against 0.4045 (a whole-number match)');
  ok(sh({ added: ['| O1 | now 0.4045 (results-x.txt) | y | z | g | open |'], removed: ['| O1 | old | y | z | g | open |'] }).length === 0, 'the exact figure passes');
  { const f2 = { ...files, 'predictions/p.md': 'the power 0.8123', 'runs.log': 'load 5.38' }; const rs2 = f => f2[f.replace(/^(\.\.\/)+(src\/solver\/)?/, '')], ex2 = f => rs2(f) !== undefined;
    const sh2 = a => shapeProblems({ readSolverFile: rs2, solverFileExists: ex2, plan, added: [a], removed: ['| O1 | old | y | z | g | open |'] }).problems;
    ok(sh2('| O1 | power 0.8123 (predictions/p.md) | y | z | g | open |').length === 0 && sh2('| O1 | load 5.38 (runs.log) | y | z | g | open |').length === 0, 'a figure from a cited prediction or runs.log passes'); }
  const L = t => lessonsOf(`Seed: after x (1 Oct 10:00)\n${t}`);
  ok(replaceProblems(L('## 7zz (closed 4 Oct 15:00)\n- [T:relook] x -> REPLACE "r" in a.md with: some text the file never came to hold at any time at all\n## 7zy (closed 4 Oct 16:00)\n- [T:design] y -> DROP\n## 7zx (closed 4 Oct 17:00)\n- [T:design] z -> DROP\n'), () => '').length === 0, 'EDGE: a REPLACE two closes back is not re-checked (a later rewording is allowed)');
}

console.log(`\n${n} passed`);
