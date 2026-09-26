/*
 * THE SCORECARD (PLAN.md 8j; the outside review's regimen, section 16: "a script over predictions/*.md and the reducers'
 * verdicts records each item's stated credence and outcome, reports the Brier score per test and cumulatively, and a
 * reliability table"; built 26 Sep, the maintainer's "Go ahead and build it"). Credences were never recorded before the
 * regimen, so it starts with 7e.
 *
 * For each registered test in TESTS: the prediction's "## Credence" section gives a probability per numbered item ("1,
 * 0.70; 2, 0.80; ...") and one for the whole ("Carried forward ...: 0.60"); the reducer's saved output gives each item's
 * outcome (a line "N. ... -> held" or "-> MISSED") and the verdict ("=> NOT FALSIFIED - CARRIED FORWARD" or "=>
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
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// each test the scorecard covers: its prediction and the file its reducer's output is saved to when it is read
export const TESTS = [
  { name: '7e (the bridge reader)', prediction: 'predictions/bridge-reader.md', results: 'results-7e.txt' },
];

export function credences(predText) {
  const m = /^##\s+Credence[^\n]*\n([\s\S]*?)(?=^##\s)/m.exec(predText);
  if (!m) throw new Error('no "## Credence" section');
  const body = m[1].replace(/\([^)]*\)/g, ' ');   // drop the reasons in brackets
  const items = {};
  for (const x of body.matchAll(/(?:holds:|;)\s*(\d+),\s*(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/g)) items[x[1]] = Number(x[2]);
  const all = /Carried forward[^:]*:\s*(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/.exec(body);
  if (!Object.keys(items).length) throw new Error('no item credences in "## Credence"');
  for (const [k, p] of Object.entries(items)) if (!(p >= 0 && p <= 1)) throw new Error(`item ${k}: credence ${p} is not a probability`);
  if (all && !(Number(all[1]) >= 0 && Number(all[1]) <= 1)) throw new Error(`the whole: credence ${all[1]} is not a probability`);
  return { items, overall: all ? Number(all[1]) : null };
}

export function outcomes(resultsText) {
  if (/^INCOMPLETE|^FAIR-TEST GATE: REFUSED|^PLANTED CHECK FAILED/m.test(resultsText)) return { refused: 'the reducer stopped before a verdict' };
  const v = /^=>\s*(NOT FALSIFIED|FALSIFIED)/m.exec(resultsText);
  if (!v) return { refused: 'no verdict line' };
  const items = {};
  for (const x of resultsText.matchAll(/^\s*(\d+)\.\s.*->\s*(held|MISSED)\s*$/gm)) items[x[1]] = x[2] === 'held' ? 1 : 0;
  return { items, overall: v[1] === 'NOT FALSIFIED' ? 1 : 0 };
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
  if (c.overall !== null) pairs.push({ item: 'carried forward', p: c.overall, o: o.overall });
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
  const cases = [
    ['credences parsed, reasons in brackets ignored', JSON.stringify(credences(P)), '{"items":{"1":0.7,"2":0.8,"3":0.9},"overall":0.6}'],
    ['outcomes parsed', JSON.stringify(outcomes(R)), '{"items":{"1":1,"2":0,"3":1},"overall":1}'],
    ['Brier by hand: (0.3^2 + 0.8^2 + 0.1^2 + 0.4^2) / 4 = 0.225', String(near(scoreTest(P, R).brier, (0.09 + 0.64 + 0.01 + 0.16) / 4)), 'true'],
    ['a perfect forecaster scores 0', String(scoreTest(pred('each item holds: 1, 1.0; 2, 0.0. Carried forward: 1.0.'), res(['1. a -> held', '2. b -> MISSED'])).brier), '0'],
    ['always 50% scores 0.25', String(scoreTest(pred('each item holds: 1, 0.5; 2, 0.5.'), res(['1. a -> held', '2. b -> MISSED'])).brier), '0.25'],
    ['FALSIFIED scores the whole as not held', String(scoreTest(P, res(['1. a -> held', '2. b -> MISSED', '3. c -> held'], 'FALSIFIED - NOT CARRIED FORWARD')).pairs.at(-1).o), '0'],
    ['planted: no results file yet is PENDING, not scored', scoreTest(P, null).status, 'PENDING'],
    ['planted: an INCOMPLETE reducer is REFUSED, not scored', scoreTest(P, 'INCOMPLETE - nothing is scored:\n  x').status, 'REFUSED'],
    ['planted: a gate refusal is REFUSED', scoreTest(P, 'FAIR-TEST GATE: REFUSED\n x').status, 'REFUSED'],
    ['planted: no verdict line is REFUSED', scoreTest(P, '1. a -> held\n2. b -> held\n3. c -> held').status, 'REFUSED'],
    ['planted: an item with a credence and no outcome stops the scorecard', t(() => scoreTest(P, res(['1. a -> held', '2. b -> held']))), 'ERROR items do not match: credence '],
    ['planted: an outcome with no credence stops the scorecard', t(() => scoreTest(P, res(['1. a -> held', '2. b -> held', '3. c -> held', '4. d -> held']))), 'ERROR items do not match: credence '],
    ['planted: no Credence section stops the scorecard', t(() => credences('# Prediction: x\n\n## Power\n\nx\n')), 'ERROR no "## Credence" section'],
    ['planted: a credence above 1 stops the scorecard', t(() => credences(pred('each item holds: 1, 1.5.'))), 'ERROR item 1: credence 1.5 is not a probability'],
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
