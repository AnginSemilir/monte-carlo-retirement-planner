/*
 * THE SCORECARD (PLAN.md 8j; the outside review's regimen, section 16: "a script over predictions/*.md and the reducers'
 * verdicts records each item's stated credence and outcome, reports the Brier score per test and cumulatively, and a
 * reliability table"; built 26 Sep, the maintainer's "Go ahead and build it"). Credences were never recorded before the
 * regimen, so it starts with 7e.
 *
 * For each registered test in TESTS: the prediction's "## Credence" section gives a probability per numbered item ("1,
 * 0.70; 2, 0.80; ...") and one for the whole ("Carried forward ...: 0.60"); the reducer's saved output gives each item's
 * outcome (under "THE PREDICTION'S ITEMS:", a line "N. ..." whose first "-> held", "-> MISSED" or ": held" is the
 * outcome - reduce-7e prints item 1 and 5 as ": held" and item 2 as "-> held; S370 reported: ...") and the verdict ("=> NOT FALSIFIED - CARRIED FORWARD" or "=>
 * FALSIFIED"). A test whose results file does not exist yet is PENDING; one whose reducer stopped (INCOMPLETE, a gate
 * refusal, no verdict) is REFUSED and never scored. An item with a credence but no outcome, or an outcome with no
 * credence, is an error: the scorecard stops rather than score part of a test.
 *   Brier score: the mean of (credence - outcome)^2, outcome 1 if it held and 0 if not. Always answering 50% scores 0.25;
 *   the regimen's target is below 0.20. Reliability: items binned by credence (under 60%, 60-75%, 75-90%, 90% and over),
 *   the mean credence against the share that held.
 *   node research/solver/scorecard.mjs              the scorecard (save it as results-scorecard.txt)
 *   node research/solver/scorecard.mjs --planted    the planted checks alone
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// each test the scorecard covers: its prediction and the file its reducer's output is saved to when it is read
export const TESTS = [
  { name: '7e (the bridge reader)', prediction: 'predictions/bridge-reader.md', results: 'results-7e.txt' },
  { name: '7r (why the reader harms)', prediction: 'predictions/diag-7r.md', results: 'results-7r.txt' },
];

export function credences(predText) {
  const m = /^##\s+Credence[^\n]*\n([\s\S]*?)(?=^##\s)/m.exec(predText);
  if (!m) throw new Error('no "## Credence" section');
  const body = m[1].replace(/\([^)]*\)/g, ' ');   // drop the reasons in brackets
  const items = {};
  for (const x of body.matchAll(/(?:holds:|;)\s*(\d+),\s*(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/g)) items[x[1]] = Number(x[2]);
  // the whole: 7e's "Carried forward: p", or a three-outcome test's "The outcome: HELD p, FALSIFIED q, INCONCLUSIVE r",
  // whose HELD share is scored as the whole (7r, added 26 Sep: one whole-test pair per test, as 7e has)
  const all = /Carried forward[^:]*:\s*(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/.exec(body) || /The outcome:\s*HELD\s+(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/.exec(body);
  if (!Object.keys(items).length) throw new Error('no item credences in "## Credence"');
  for (const [k, p] of Object.entries(items)) if (!(p >= 0 && p <= 1)) throw new Error(`item ${k}: credence ${p} is not a probability`);
  if (all && !(Number(all[1]) >= 0 && Number(all[1]) <= 1)) throw new Error(`the whole: credence ${all[1]} is not a probability`);
  return { items, overall: all ? Number(all[1]) : null, overallLabel: all && /^The outcome/.test(all[0]) ? 'outcome HELD' : 'carried forward' };
}

export function outcomes(resultsText) {
  // the stops the reducers print: reduce-7e's INCOMPLETE and "FAIR-TEST GATE: FAILED", fair-gate.mjs's "FAIR-TEST GATE:
  // FAILED (stamps)" and "REFUSED: not a fair test", any reducer's "PLANTED CHECK FAILED"
  if (/^INCOMPLETE|^FAIR-TEST GATE: FAILED|^\s*REFUSED: not a fair test|^PLANTED CHECK FAILED/m.test(resultsText)) return { refused: 'the reducer stopped before a verdict' };
  // the verdict: 7e's "=> NOT FALSIFIED" or "=> FALSIFIED", or a three-outcome reducer's "OUTCOME: HELD|FALSIFIED|INCONCLUSIVE"
  const v = /^=>\s*(NOT FALSIFIED|FALSIFIED)/m.exec(resultsText) || /^OUTCOME:\s*(HELD|FALSIFIED|INCONCLUSIVE)\b/m.exec(resultsText);
  if (!v) return { refused: 'no verdict line' };
  const h = resultsText.indexOf("THE PREDICTION'S ITEMS:");
  const sec = h < 0 ? resultsText : resultsText.slice(h).split(/\n\s*\n/)[0];
  const items = {};
  for (const x of sec.matchAll(/^\s*(\d+)\.\s(.*)$/gm)) {
    const o = /(?:->|:)\s*(held|MISSED)\b/.exec(x[2]);
    if (!o) throw new Error(`item ${x[1]}: no outcome on its line`);
    items[x[1]] = o[1] === 'held' ? 1 : 0;
  }
  return { items, overall: v[1] === 'NOT FALSIFIED' || v[1] === 'HELD' ? 1 : 0 };
}

export function scoreTest(predText, resultsText) {
  const c = credences(predText);
  if (resultsText === null) return { status: 'PENDING', pairs: [] };
  const o = outcomes(resultsText);
  if (o.refused) return { status: 'REFUSED', why: o.refused, pairs: [] };
  const ck = Object.keys(c.items).sort(), ok = Object.keys(o.items).sort();
  const missing = ck.filter(k => !(k in o.items)), extra = ok.filter(k => !(k in c.items));
  if (missing.length || extra.length) throw new Error(`items do not match: credence without outcome [${missing.join(', ')}], outcome without credence [${extra.join(', ')}]`);
  const pairs = ck.map(k => ({ item: k, p: c.items[k], o: o.items[k] }));
  if (c.overall !== null) pairs.push({ item: c.overallLabel, p: c.overall, o: o.overall });
  return { status: 'SCORED', pairs, brier: brier(pairs) };
}

export const brier = pairs => pairs.reduce((a, x) => a + (x.p - x.o) ** 2, 0) / pairs.length;
export const BINS = [[0, 0.6, 'under 60%'], [0.6, 0.75, '60-75%'], [0.75, 0.9, '75-90%'], [0.9, 1.0001, '90% and over']];
export function reliability(pairs) {
  return BINS.map(([lo, hi, label]) => { const b = pairs.filter(x => x.p >= lo && x.p < hi); return { label, n: b.length, meanP: b.length ? b.reduce((a, x) => a + x.p, 0) / b.length : null, held: b.length ? b.reduce((a, x) => a + x.o, 0) / b.length : null }; });
}

// PLANTED, before any real file is read (rule 6: a check is trusted only after it has failed on a planted fault)
{
  const pred = c => `# Prediction: x\n\n## Credence\n\n${c}\n\n## Power\n\nx\n`;
  const res = (lines, v = 'NOT FALSIFIED - CARRIED FORWARD') => `THE PREDICTION'S ITEMS:\n${lines.join('\n')}\n\nFALSIFIER: not fired\n=> ${v}\n`;
  const P = pred('The author\'s probability that each item holds: 1, 0.70 (a reason; with a semicolon); 2, 0.80; 3, 0.90. Carried forward (why): 0.60.');
  const R = res(['1. a -> held', '2. b -> MISSED', '3. c: x, y -> held']);
  const near = (a, b) => Math.abs(a - b) < 1e-12;
  const t = f => { try { return f(); } catch (e) { return `ERROR ${e.message}`; } };
  // 7e's item and verdict lines as reduce-7e.mjs items() and report() print them (l.188-203, held and missed; the
  // figures invented, the POOLED line shortened), with the section that follows them; the hash below fails if items() changes
  const R7 = ok => `POOLED over the 16 cases expected unchanged (fixed effect, the floor): +0.010 points (-0.050 to 0.070)

THE PREDICTION'S ITEMS:
1. in class (9 cases) the reader's gap within +/-5, the thin S128 and S130 within +/-8: ${ok ? 'held' : 'outside: S126 6.2, S128 9.1 -> MISSED'}
2. bridge 6 and S366 within +/-5: bridge 6 1.2, S366 ${ok ? '-2.0' : '-6.0'} -> ${ok ? 'held' : 'MISSED'}; S370 reported: S370 3.1
3. share 0.95 and S360 within +/-10: share 0.95 4.0, S360 ${ok ? '7.5' : '12.5'} -> ${ok ? 'held' : 'MISSED'}
4. bridge 4+cost within +/-8: bridge 4+cost ${ok ? '3.0' : '9.0'} -> ${ok ? 'held' : 'MISSED'}
5. no case shows harm by the exact rule: ${ok ? 'held' : 'harm on S124, S128 -> MISSED'}
6. the reader gains survival on share 0.95 and S360 (the exact one-sided p for a gain below 0.05): share 0.95 +12 (15 saved, 3 lost; p 3.8e-3), S360 +8 (10 saved, 2 lost; p 1.9e-2) -> ${ok ? 'held' : 'MISSED'}
7. bridge 0 identical: yes; share 0.50 and 0.70 within 0.5: yes; the no-bridge controls identical: ${ok ? 3 : 2} of 3 -> ${ok ? 'held' : 'MISSED'}
8. at 30 points the reader's gap within +/-5: S124@30 1.0, S126@30 ${ok ? '2.0' : '5.5'}, S130@30 -1.0 -> ${ok ? 'held' : 'MISSED'}
9. the reader's added solve time at 30 points at most 20% on each case: S124@30 1.050, S126@30 ${ok ? '1.100' : '1.300'}, S130@30 1.020 -> ${ok ? 'held' : 'MISSED'}

FALSIFIER: ${ok ? 'not fired' : 'fired - harm on S124'}
=> ${ok ? 'NOT FALSIFIED - CARRIED FORWARD to the maintainer as the bridge read' : 'FALSIFIED - NOT CARRIED FORWARD (F2 is built and tested the same way)'}

SECONDARY, REPORTED - the reader against v1 and against v2 (look 1, Holm across the 24, at 0.05):
   S126 3 lost 1 saved of 1000 -> no harm
`;
  const src7 = readFileSync(join(HERE, 'reduce-7e.mjs'), 'utf8'), i7 = src7.indexOf('function items(');
  const itemsSrc = src7.slice(i7, src7.indexOf('  // reported, not predicted', i7));
  const cases = [
    ['credences parsed, reasons in brackets ignored', JSON.stringify(credences(P)), '{"items":{"1":0.7,"2":0.8,"3":0.9},"overall":0.6,"overallLabel":"carried forward"}'],
    ['outcomes parsed', JSON.stringify(outcomes(R)), '{"items":{"1":1,"2":0,"3":1},"overall":1}'],
    ['Brier by hand: (0.3^2 + 0.8^2 + 0.1^2 + 0.4^2) / 4 = 0.225', String(near(scoreTest(P, R).brier, (0.09 + 0.64 + 0.01 + 0.16) / 4)), 'true'],
    ['a perfect forecaster scores 0', String(scoreTest(pred('each item holds: 1, 1.0; 2, 0.0. Carried forward: 1.0.'), res(['1. a -> held', '2. b -> MISSED'])).brier), '0'],
    ['always 50% scores 0.25', String(scoreTest(pred('each item holds: 1, 0.5; 2, 0.5.'), res(['1. a -> held', '2. b -> MISSED'])).brier), '0.25'],
    ['FALSIFIED scores the whole as not held', String(scoreTest(P, res(['1. a -> held', '2. b -> MISSED', '3. c -> held'], 'FALSIFIED - NOT CARRIED FORWARD')).pairs.at(-1).o), '0'],
    ['planted: no results file yet is PENDING, not scored', scoreTest(P, null).status, 'PENDING'],
    ['planted: an INCOMPLETE reducer is REFUSED, not scored', scoreTest(P, 'INCOMPLETE - nothing is scored:\n  x').status, 'REFUSED'],
    ['planted: reduce-7e\'s gate failure is REFUSED', scoreTest(P, 'FAIR-TEST GATE: FAILED\n  x').status, 'REFUSED'],
    ['planted: fair-gate\'s stamp failure is REFUSED', scoreTest(P, 'FAIR-TEST GATE: FAILED (stamps)\n  x').status, 'REFUSED'],
    ['planted: fair-gate\'s refusal is REFUSED', scoreTest(P, 'x\n\nREFUSED: not a fair test, so no figure is printed.').status, 'REFUSED'],
    ['planted: a numbered item line with no outcome stops the scorecard', t(() => outcomes(res(['1. a -> held', '2. b: 4.1']))), 'ERROR item 2: no outcome on its line'],
    ['7e, the reducer\'s own lines, every item held', t(() => JSON.stringify(outcomes(R7(true)))), '{"items":{"1":1,"2":1,"3":1,"4":1,"5":1,"6":1,"7":1,"8":1,"9":1},"overall":1}'],
    ['7e, the reducer\'s own lines, every item missed', t(() => JSON.stringify(outcomes(R7(false)))), '{"items":{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0},"overall":0}'],
    ['7e, its real prediction against the reducer\'s own lines, scored', t(() => scoreTest(readFileSync(join(HERE, 'predictions/bridge-reader.md'), 'utf8'), R7(true)).status), 'SCORED'],
    ['7e: reduce-7e\'s items() unchanged since these lines were copied (else re-copy them)', createHash('sha256').update(itemsSrc).digest('hex').slice(0, 16), '21aadfd5e769be63'],
    ['planted: no verdict line is REFUSED', scoreTest(P, '1. a -> held\n2. b -> held\n3. c -> held').status, 'REFUSED'],
    ['planted: an item with a credence and no outcome stops the scorecard', t(() => scoreTest(P, res(['1. a -> held', '2. b -> held']))), 'ERROR items do not match: credence '],
    ['planted: an outcome with no credence stops the scorecard', t(() => scoreTest(P, res(['1. a -> held', '2. b -> held', '3. c -> held', '4. d -> held']))), 'ERROR items do not match: credence '],
    ['planted: no Credence section stops the scorecard', t(() => credences('# Prediction: x\n\n## Power\n\nx\n')), 'ERROR no "## Credence" section'],
    ['planted: a credence above 1 stops the scorecard', t(() => credences(pred('each item holds: 1, 1.5.'))), 'ERROR item 1: credence 1.5 is not a probability'],
    ['a three-outcome prediction: the HELD share is the whole', JSON.stringify(credences(pred('each item holds: 1, 0.60; 2, 0.90. The outcome: HELD 0.55, FALSIFIED 0.15, INCONCLUSIVE 0.30.')).overall), '0.55'],
    ['a three-outcome verdict: HELD scores 1, INCONCLUSIVE and FALSIFIED 0', ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(v => outcomes(`THE PREDICTION'S ITEMS:\n1. a: x -> held\n\nOUTCOME: ${v} - why`).overall).join(','), '1,0,0'],
    ['7r, its real prediction and saved result, scored', t(() => { const r = scoreTest(readFileSync(join(HERE, 'predictions/diag-7r.md'), 'utf8'), 'THE PREDICTION\'S ITEMS:\n1. a: x -> held\n2. b: x -> MISSED\n3. c: x -> held\n4. d: x -> held\n5. e: x -> held\n\nOUTCOME: HELD - x'); return `${r.status} ${r.pairs.length}`; }), 'SCORED 6'],
    ['reliability bins: 0.7 in 60-75%, 0.8 in 75-90%, 0.9 and 0.6... ', JSON.stringify(reliability(scoreTest(P, R).pairs).map(b => b.n)), '[0,2,1,1]'],
  ];
  const wrong = cases.filter(([, got, want]) => got !== want && !(want.startsWith('ERROR') && got.startsWith(want.trimEnd())));
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  if (process.argv.includes('--planted')) { console.log(`planted (${cases.length}): all read as they should`); process.exit(0); }
}

// the real tests
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const read = f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : null);
  console.log('THE SCORECARD: the author\'s stated credence against each item\'s outcome (PLAN.md 8j). Brier target below 0.20; always 50% scores 0.25.\n');
  const all = [];
  for (const T of TESTS) {
    const p = read(T.prediction);
    if (p === null) { console.log(`${T.name}: ERROR - no prediction file ${T.prediction}`); process.exit(1); }
    const s = scoreTest(p, read(T.results));
    if (s.status !== 'SCORED') { console.log(`${T.name}: ${s.status}${s.why ? ` (${s.why})` : ` (no ${T.results} yet)`}`); continue; }
    console.log(`${T.name}: Brier ${s.brier.toFixed(3)} over ${s.pairs.length} (${s.pairs.map(x => `${x.item} ${x.p} -> ${x.o ? 'held' : 'not'}`).join('; ')})`);
    all.push(...s.pairs);
  }
  if (!all.length) { console.log('\nNo scored tests yet: no cumulative score.'); process.exit(0); }
  console.log(`\nCUMULATIVE: Brier ${brier(all).toFixed(3)} over ${all.length} items`);
  console.log('RELIABILITY (credence bin: items, mean credence, share held):');
  for (const b of reliability(all)) console.log(`  ${b.label.padEnd(13)} ${String(b.n).padStart(3)}   ${b.meanP === null ? '  -  ' : b.meanP.toFixed(2)}   ${b.held === null ? '  -  ' : b.held.toFixed(2)}`);
}
