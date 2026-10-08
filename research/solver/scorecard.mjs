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
import { ITEM_KINDS, KINDS } from './item-kinds.mjs';
import { settlements, statedCauses, appendOnlyProblem } from './record-deep-review.mjs';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
// each test the scorecard covers: its prediction and the file its reducer's output is saved to when it is read
export const TESTS = [
  { name: '7e (the bridge reader)', prediction: 'predictions/bridge-reader.md', results: 'results-7e.txt' },
  { name: '7r (why the reader harms)', prediction: 'predictions/diag-7r.md', results: 'results-7r.txt' },
  { name: '7s (5 or 15 return points)', prediction: 'predictions/diag-7s.md', results: 'results-7s.txt' },
  { name: '7t (six suspected causes)', prediction: 'predictions/diag-7t.md', results: 'results-7t.txt' },
  { name: '7v (the switch margin)', prediction: 'predictions/diag-7v.md', results: 'results-7v.txt' },
  { name: '7w (5 or 15 points at the bridge\'s last year)', prediction: 'predictions/diag-7w.md', results: 'results-7w.txt' },
  { name: '7x (held-for-life tables: free switching or three worlds)', prediction: 'predictions/diag-7x.md', results: 'results-7x.txt' },
  { name: '7z (Q\'s fix alone: the reader\'s step integrated in the chooser)', prediction: 'predictions/diag-7z.md', results: 'results-7z.txt' },
  { name: '7y (the tier state: free switching in the tables)', prediction: 'predictions/diag-7y.md', results: 'results-7y.txt' },
  { name: '7aa (the joint tier state at two settings: the pot off and on)', prediction: 'predictions/diag-7aa.md', results: 'results-7aa.txt' },
  { name: '7ab (the freed opening against TS+J and the product, the pot off and on)', prediction: 'predictions/diag-7ab.md', results: 'results-7ab.txt' },
  { name: '7ac (the fourth cell: TS+J with the opening held in the plan\'s tier)', prediction: 'predictions/diag-7ac.md', results: 'results-7ac.txt' },
  { name: '7ad (the refinement check: the bad world\'s price of the opening at its node and on finer grids)', prediction: 'predictions/diag-7ad.md', results: 'results-7ad.txt' },
  { name: '7ae (the bad node at margin 0: the per-year switch margin and the bad world\'s price)', prediction: 'predictions/diag-7ae.md', results: 'results-7ae.txt' },
  { name: '7af (the candidate bundle, the reader with TS+J, against the shipping default)', prediction: 'predictions/diag-7af.md', results: 'results-7af.txt' },
  { name: '7ag (the bundle on the nine remaining panel households, and S126\'s attribution)', prediction: 'predictions/diag-7ag.md', results: 'results-7ag.txt' },
  { name: 'P (the switch charged in both passes: which explanation carries families 1 and 2)', prediction: 'predictions/diag-p.md', results: 'results-P.txt' },
  { name: '7ah (O36\'s fix: the reader\'s reference drawn in the menu\'s order, on the six longer bridges)', prediction: 'predictions/diag-7ah.md', results: 'results-7ah.txt' },
  { name: '7ai (O60\'s openings check: the tier returns as their blends\' medians, and reversed)', prediction: 'predictions/diag-7ai.md', results: 'results-7ai.txt' },
  { name: '7ak (the attribution test: which snap turns P\'s forward-against-cell disagreements, and the switching boundaries)', prediction: 'predictions/diag-7ak.md', results: 'results-7ak.txt' },
  { name: '7al (the stage-by-stage calibration: post-access optimism by household, O66)', prediction: 'predictions/diag-7al.md', results: 'results-7al.txt' },
  { name: '7am (the stored margin: P and the bundle under the tier shift, O67)', prediction: 'predictions/diag-7am.md', results: 'results-7am.txt' },
  { name: '7ap (the allowance test: the used-allowance axis snapped against interpolated, O71)', prediction: 'predictions/diag-7ap.md', results: 'results-7ap.txt' },
  { name: '7aq (P at half the step with a signed gap: is P smooth where the bundle is not, O67)', prediction: 'predictions/diag-7aq.md', results: 'results-7aq.txt' },
  { name: '7ar (O76\'s decomposition: where the bridge stage\'s rise under the interpolated allowance axis sits)', prediction: 'predictions/diag-7ar.md', results: 'results-7ar.txt' },
  { name: '7as (the charge\'s size and S194\'s bad-world slice)', prediction: 'predictions/diag-7as.md', results: 'results-7as.txt' },
  { name: '7at (the allowance axis with a bucket at the wall, and O76\'s read (b))', prediction: 'predictions/diag-7at.md', results: 'results-7at.txt' },
  { name: '7au (the learner at P\'s settings)', prediction: 'predictions/diag-7au.md', results: 'results-7au.txt' },
  { name: 'ADOPT-PI (the interpolated allowance axis in the shipping default)', prediction: 'predictions/adopt-pi.md', results: 'results-adoptpi.txt' },
  { name: 'COV-B-STEP (the reader\'s tax and the step-year edge node)', prediction: 'predictions/diag-covb.md', results: 'results-covb.txt' },
  { name: 'HYB (the forward-only hybrid: ADOPT-PI\'s gain split between the read and the tables)', prediction: 'predictions/diag-hyb.md', results: 'results-hyb.txt' },
  { name: 'XAS (the exact one-step check: representation against quadrature at the step reads)', prediction: 'predictions/diag-xas.md', results: 'results-xas.txt' },
  { name: 'EDGE (EDGE-SPLIT: which snap edge carries PCLSI\'s gain, on each table)', prediction: 'predictions/diag-edge.md', results: 'results-edge.txt' },
  { name: 'XAS-R2 (the year-before reads split three ways: the top cell, the (v-a) nodes, S126\'s blend)', prediction: 'predictions/diag-xasr2.md', results: 'results-xasr2.txt' },
  { name: 'FORCE-X (the draw forced past the read\'s first price point at a would-be hold)', prediction: 'predictions/diag-forcex.md', results: 'results-forcex.txt' },
  { name: 'DT-O97 (O97\'s loss at a pension death tax of 0.4)', prediction: 'predictions/diag-dto97.md', results: 'results-dto97.txt' },
  { name: '7aj (the research candidate against the shipping default at the estate weight 0.01, 25 households)', prediction: 'predictions/diag-7aj.md', results: 'results-7aj.txt' },
  { name: '7aw (the research candidate against the shipping default at the estate weight 0.02, 25 households)', prediction: 'predictions/diag-7aw.md', results: 'results-7aw.txt' },
  { name: 'CARRY (the carry family\'s rule held out on 7aw, and O123\'s cause by the fixed-policy re-score)', prediction: 'predictions/diag-carry.md', results: 'results-carry.txt' },
];

export function credences(predText) {
  const m = /^##\s+Credence[^\n]*\n([\s\S]*?)(?=^##\s)/m.exec(predText);
  if (!m) throw new Error('no "## Credence" section');
  // a test whose items each predict one of three outcomes (7v, added 27 Sep): "reads as predicted: 1 (INCONCLUSIVE), 0.45;
  // 2 (HELD), 0.85; ..." - the credence is that the item reads as the bracketed outcome, scored 1 when it does
  const predicted = {}, withLabels = {};
  // one outcome named once for every item (7ad, added 28 Sep): "reads as predicted (HELD): 1, 0.65; 2, 0.40; ..." - each
  // item's credence is that it reads as that outcome
  const once = /reads as predicted \((HELD|FALSIFIED|INCONCLUSIVE)\):/.exec(m[1]);
  if (once) for (const x of m[1].slice(once.index).matchAll(/(?:\):|;)\s*(\d+)\s*,\s*(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/g)) { predicted[x[1]] = once[1]; withLabels[x[1]] = Number(x[2]); }
  // one item named alone (7al, added 30 Sep): "that item 1 reads as predicted (HELD): 0.55"
  for (const x of m[1].matchAll(/item (\d+) reads as predicted \((HELD|FALSIFIED|INCONCLUSIVE)\):\s*(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/g)) { predicted[x[1]] = x[2]; withLabels[x[1]] = Number(x[3]); }
  // every outcome given a probability, item by item (7au, added 4 Oct): "- **Item 1:** FALSIFIED 0.55, INCONCLUSIVE 0.35,
  // HELD 0.10." - the first outcome named is the one predicted, scored 1 when the item reads as it
  for (const x of m[1].matchAll(/\*\*Item (\d+):\*\*\s*(HELD|FALSIFIED|INCONCLUSIVE)\s+(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/g)) { predicted[x[1]] = x[2]; withLabels[x[1]] = Number(x[3]); }
  if (/reads as predicted:/.test(m[1])) for (const x of m[1].matchAll(/(?:predicted:|;|\):)\s*(\d+)\s*\((HELD|FALSIFIED|INCONCLUSIVE)\),\s*(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/g)) { predicted[x[1]] = x[2]; withLabels[x[1]] = Number(x[3]); }
  const body = m[1].replace(/\([^)]*\)/g, ' ');   // drop the reasons in brackets
  const items = Object.keys(withLabels).length ? withLabels : {};
  if (!Object.keys(withLabels).length) for (const x of body.matchAll(/(?:holds:|;)\s*(\d+)\s*,\s*(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/g)) items[x[1]] = Number(x[2]);   // a space before the comma: a bracketed label dropped (7t's "2 (J HELD), 0.25")
  // the whole: 7e's "Carried forward: p", or a three-outcome test's "The outcome: HELD p, FALSIFIED q, INCONCLUSIVE r",
  // whose HELD share is scored as the whole (7r, added 26 Sep: one whole-test pair per test, as 7e has)
  const all = /Carried forward[^:]*:\s*(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/.exec(body) || /The outcome:\s*HELD\s+(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/.exec(body)
    || /At\s+least\s+one\s+cause\s+HELD:\s*(?:about\s+)?(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/.exec(body);   // a several-cause test's whole (7t, added 27 Sep)
  if (!Object.keys(items).length) throw new Error('no item credences in "## Credence"');
  for (const [k, p] of Object.entries(items)) if (!(p >= 0 && p <= 1)) throw new Error(`item ${k}: credence ${p} is not a probability`);
  if (all && !(Number(all[1]) >= 0 && Number(all[1]) <= 1)) throw new Error(`the whole: credence ${all[1]} is not a probability`);
  // 7v's two whole-level credences (the hundred-and-tenth review, MINOR 6): "P named (alone or with C): about p" and
  // "At least one READER+J candidate by the whole score: about q", each scored against its own printed line (outcomes)
  const wholes = [];
  const pn = /P named[^:]*:\s*(?:about\s+)?(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/.exec(m[1]); if (pn) wholes.push({ item: 'P named', p: Number(pn[1]) });
  const rj = /At\s+least\s+one\s+READER\+J\s+candidate\s+by\s+the\s+whole\s+score:\s*(?:about\s+)?(\d+(?:\.\d+)?|\.\d+)(?!\d)(?!\.\d)/.exec(m[1]); if (rj) wholes.push({ item: 'a READER+J candidate by the whole score', p: Number(rj[1]) });
  // THE MAINTAINER'S 'GO AHEAD' OF 5 OCT (the deep review of the prediction record, deep-review-log.md 5 Oct 10:16 UK): a
  // full three-outcome distribution per item (for the ranked probability score), the author's judged credence registered
  // beside the derived one ("**Judged, item N:** HELD p, ..."), a credence per leg of an item that needs every household
  // ("**Item N, leg S370:** HELD p, ..."), and the items' kinds ("**Kinds:** 1 ATTRIB; 2 SIZE")
  const DIST = String.raw`((?:HELD|FALSIFIED|INCONCLUSIVE)\s+(?:\d+(?:\.\d+)?|\.\d+)(?:,\s*(?:HELD|FALSIFIED|INCONCLUSIVE)\s+(?:\d+(?:\.\d+)?|\.\d+))*)`;
  const distOf = s => { const d = {}; for (const y of s.matchAll(/(HELD|FALSIFIED|INCONCLUSIVE)\s+(\d+(?:\.\d+)?|\.\d+)/g)) d[y[1]] = Number(y[2]); return d; };
  const firstOf = s => { const y = /(HELD|FALSIFIED|INCONCLUSIVE)\s+(\d+(?:\.\d+)?|\.\d+)/.exec(s); return { pred: y[1], p: Number(y[2]) }; };
  const dists = {}, judged = {}, legs = {}, kinds = {};
  for (const x of m[1].matchAll(new RegExp(String.raw`\*\*Item (\d+):\*\*\s*` + DIST, 'g'))) dists[x[1]] = distOf(x[2]);
  for (const x of m[1].matchAll(new RegExp(String.raw`\*\*Judged, item (\d+):\*\*\s*` + DIST, 'g'))) judged[x[1]] = { ...firstOf(x[2]), dist: distOf(x[2]) };
  for (const x of m[1].matchAll(new RegExp(String.raw`\*\*Item (\d+), leg ([\w.+-]+):\*\*\s*` + DIST, 'g'))) legs[`${x[1]}/${x[2]}`] = { ...firstOf(x[3]), dist: distOf(x[3]) };
  const kl = /\*\*Kinds:\*\*\s*([^\n]*)/.exec(m[1]); if (kl) for (const y of kl[1].matchAll(/(\d+)\s+([A-Z]+)/g)) kinds[y[1]] = y[2];
  for (const [k, d] of [...Object.entries(dists), ...Object.values(judged).map(j => [null, j.dist]), ...Object.values(legs).map(j => [null, j.dist])]) { const s = Object.values(d).reduce((a, b) => a + b, 0); if (Object.keys(d).length === 3 && Math.abs(s - 1) > 0.011) throw new Error(`${k ? `item ${k}` : 'a judged or leg line'}: its three outcomes sum to ${s.toFixed(3)}, not 1`); }
  const extra = { ...(Object.keys(dists).length ? { dists } : {}), ...(Object.keys(judged).length ? { judged } : {}), ...(Object.keys(legs).length ? { legs } : {}), ...(Object.keys(kinds).length ? { kinds } : {}) };
  return { items, ...extra, ...(Object.keys(predicted).length ? { predicted } : {}), ...(wholes.length ? { wholes } : {}), overall: all ? Number(all[1]) : null, overallLabel: all && /^The outcome/.test(all[0]) ? 'outcome HELD' : all && /^At\s+least/.test(all[0]) ? 'a cause HELD' : 'carried forward' };
}

export function outcomes(resultsText) {
  // the stops the reducers print: reduce-7e's INCOMPLETE and "FAIR-TEST GATE: FAILED", fair-gate.mjs's "FAIR-TEST GATE:
  // FAILED (stamps)" and "REFUSED: not a fair test", any reducer's "PLANTED CHECK FAILED"
  if (/^INCOMPLETE|^FAIR-TEST GATE: FAILED|^\s*REFUSED: not a fair test|^PLANTED CHECK FAILED/m.test(resultsText)) return { refused: 'the reducer stopped before a verdict' };
  // the verdict: 7e's "=> NOT FALSIFIED" or "=> FALSIFIED", or a three-outcome reducer's "OUTCOME: HELD|FALSIFIED|INCONCLUSIVE"
  const v = /^=>\s*(NOT FALSIFIED|FALSIFIED)/m.exec(resultsText) || /^OUTCOME:\s*(HELD|FALSIFIED|INCONCLUSIVE|NOT SETTLED)\b/m.exec(resultsText);   // NOT SETTLED (7s): the whole scored 0, the items as printed, so a missed reproduction is scored (the seventy-fourth review, MINOR 2)
  // a several-cause reducer's "OUTCOME: J INCONCLUSIVE, L HELD, ..." (reduce-7t.mjs): the whole holds when any cause HELD
  const numbered0 = v ? null : /^OUTCOME:\s*(\d+\s+[A-Z][A-Z ]*[A-Z](?:[,;]\s*\d+\s+[A-Z][A-Z ]*[A-Z](?=\s*(?:[,;]|$)))*)\s*(?:;[^\n]*)?$/m.exec(resultsText);   // a trailing '; note' (7ah's '; 6 (the split): no opening flips', an item with no credence) is not scored; items may be separated by ';' too (reduce-7ap.mjs prints 'OUTCOME: 1 HELD; 2 HELD; 3 HELD'), a '; N OUTCOME' segment read as an item and anything else after ';' as the note   // read before the several-cause form, which also matches digit labels (the hundred-and-tenth review, MINOR 6; 7t's labels include 5L)
  const many = v || numbered0 ? null : /^OUTCOME:\s*((?:[\w/+]+\s+(?:HELD|FALSIFIED|INCONCLUSIVE)(?:,\s*|\s*$))+)$/m.exec(resultsText);
  // a numbered-items reducer's "OUTCOME: 1 INCONCLUSIVE, 2 HELD, ..., 7 NOT REPRODUCED" (reduce-7v.mjs): each item's outcome
  // as printed, scored against the outcome its credence names (scoreTest)
  const numbered = numbered0;
  const legLine = /^LEGS:\s*(.+)$/m.exec(resultsText), legLabels = legLine ? Object.fromEntries(legLine[1].split(/;\s*/).map(x => { const [, k, o] = /^(\d+\/[\w.+-]+)\s+(HELD|FALSIFIED|INCONCLUSIVE)$/.exec(x.trim()) || []; return [k, o]; }).filter(([k]) => k)) : null;
  if (numbered) return { ...(legLabels ? { legLabels } : {}), labels: Object.fromEntries(numbered[1].split(/[,;]\s*/).map(x => { const [, k, o] = /^(\d+)\s+(.+)$/.exec(x); return [k, o]; })), overall: null,
    wholes: { 'P named': /^ATTRIBUTION[^\n]*HELD:[^\n]*\bP\b/m.test(resultsText) ? 1 : 0, 'a READER+J candidate by the whole score': /^\s*READER\+J\/\S+\s+survival\s+\S+\s+whole score CANDIDATE/m.test(resultsText) ? 1 : 0 } };
  if (!v && !many) return { refused: 'no verdict line' };
  const h = resultsText.indexOf("THE PREDICTION'S ITEMS:");
  const sec = h < 0 ? resultsText : resultsText.slice(h).split(/\n\s*\n/)[0];
  const items = {};
  for (const x of sec.matchAll(/^\s*(\d+)\.\s(.*)$/gm)) {
    const o = /(?:->|:)\s*(held|MISSED)\b/.exec(x[2]);
    if (!o) throw new Error(`item ${x[1]}: no outcome on its line`);
    items[x[1]] = o[1] === 'held' ? 1 : 0;
  }
  return { items, overall: many ? (/\bHELD\b/.test(many[1]) ? 1 : 0) : v[1] === 'NOT FALSIFIED' || v[1] === 'HELD' ? 1 : 0 };
}

export function scoreTest(predText, resultsText) {
  const c = credences(predText);
  if (resultsText === null) return { status: 'PENDING', pairs: [] };
  const o = outcomes(resultsText);
  if (o.refused) return { status: 'REFUSED', why: o.refused, pairs: [] };
  if (o.labels) {
    if (!c.predicted) throw new Error('numbered outcomes need a credence that names each item\'s predicted outcome');
    o.items = Object.fromEntries(Object.entries(o.labels).map(([k, lab]) => [k, lab === c.predicted[k] ? 1 : 0]));
  }
  const ck = Object.keys(c.items).sort(), ok = Object.keys(o.items).sort();
  const missing = ck.filter(k => !(k in o.items)), extra = ok.filter(k => !(k in c.items));
  if (missing.length || extra.length) throw new Error(`items do not match: credence without outcome [${missing.join(', ')}], outcome without credence [${extra.join(', ')}]`);
  const pairs = ck.map(k => ({ item: k, p: c.items[k], o: o.items[k] }));
  if (c.overall !== null) pairs.push({ item: c.overallLabel, p: c.overall, o: o.overall });
  for (const w of c.wholes || []) { if (!o.wholes || !(w.item in o.wholes)) throw new Error(`the whole "${w.item}": no outcome`); pairs.push({ item: w.item, p: w.p, o: o.wholes[w.item] }); }
  // the extras: each three-outcome item's ranked probability score, the judged credence paired with the derived, each leg
  const extras = {};
  if (o.labels && c.dists) extras.rps = Object.entries(c.dists).filter(([k, d]) => Object.keys(d).length === 3 && o.labels[k] in d).map(([k, d]) => ({ item: k, rps: rps(d, o.labels[k]), uniform: rps({ HELD: 1 / 3, INCONCLUSIVE: 1 / 3, FALSIFIED: 1 / 3 }, o.labels[k]) }));
  // the judged credence scored on the derived line's own event (its named outcome), and both by the ranked probability
  // score over their full distributions (the plan-auditor's MINOR 2 of 5 Oct 10:38 UK: never on two different events)
  if (o.labels && c.judged) extras.judged = Object.entries(c.judged).filter(([k]) => k in o.labels).map(([k, j]) => { const ev = (c.predicted && c.predicted[k]) || 'HELD', dd = c.dists && c.dists[k]; return { item: k, judged: ev in j.dist ? j.dist[ev] : j.p, derived: c.items[k], o: o.items[k], rpsJ: Object.keys(j.dist).length === 3 ? rps(j.dist, o.labels[k]) : null, rpsD: dd && Object.keys(dd).length === 3 ? rps(dd, o.labels[k]) : null }; });
  if (c.legs) { if (!o.legLabels) throw new Error('leg credences but no LEGS line in the results'); extras.legs = Object.entries(c.legs).map(([k, j]) => { if (!(k in o.legLabels)) throw new Error(`leg ${k}: no outcome on the LEGS line`); return { item: k, p: j.p, o: o.legLabels[k] === j.pred ? 1 : 0 }; }); }
  if (c.kinds) extras.kinds = c.kinds;
  return { status: 'SCORED', pairs, brier: brier(pairs), ...extras };
}

export const brier = pairs => pairs.reduce((a, x) => a + (x.p - x.o) ** 2, 0) / pairs.length;
export const BINS = [[0, 0.6, 'under 60%'], [0.6, 0.75, '60-75%'], [0.75, 0.9, '75-90%'], [0.9, 1.0001, '90% and over']];
export function reliability(pairs) {
  return BINS.map(([lo, hi, label]) => { const b = pairs.filter(x => x.p >= lo && x.p < hi); return { label, n: b.length, meanP: b.length ? b.reduce((a, x) => a + x.p, 0) / b.length : null, held: b.length ? b.reduce((a, x) => a + x.o, 0) / b.length : null }; });
}

// the ranked probability score of a three-outcome distribution, the outcomes ordered FALSIFIED < INCONCLUSIVE < HELD: the
// mean over the two cut points of (forecast's cumulative - outcome's cumulative)^2; 0 is perfect, a uniform forecast scores
// 5/18 on an end outcome and 1/9 on the middle one
export const ORDER = ['FALSIFIED', 'INCONCLUSIVE', 'HELD'];
export function rps(dist, label) { let cf = 0, co = 0, s = 0; for (const k of ORDER.slice(0, 2)) { cf += dist[k] || 0; co += label === k ? 1 : 0; s += (cf - co) ** 2; } return s / 2; }
// how much the credences say beyond the base rate: the base rate's own Brier, and the decomposition over the distinct
// credence values (Brier = reliability - resolution + uncertainty), and the area under the ROC curve (0.5 is no
// discrimination)
export function information(pairs) {
  const n = pairs.length, base = pairs.reduce((a, x) => a + x.o, 0) / n, unc = base * (1 - base);
  const groups = new Map(); for (const x of pairs) { const g = groups.get(x.p) || { n: 0, h: 0 }; g.n++; g.h += x.o; groups.set(x.p, g); }
  let rel = 0, res = 0; for (const [p, g] of groups) { const f = g.h / g.n; rel += g.n * (p - f) ** 2; res += g.n * (f - base) ** 2; }
  const pos = pairs.filter(x => x.o === 1), neg = pairs.filter(x => x.o === 0);
  let auc = 0; for (const a of pos) for (const b of neg) auc += a.p > b.p ? 1 : a.p === b.p ? 0.5 : 0;
  return { base, baseBrier: unc, rel: rel / n, res: res / n, unc, auc: pos.length && neg.length ? auc / (pos.length * neg.length) : NaN };
}
// by kind: the author's Brier, and that of the kind's base rate from earlier tests only ((held + 1) / (items + 2), so a kind
// with no history starts at a half) - the forecast the author's credence has to beat
// THE KIND'S BASE RATE (the maintainer's 'Yes' of 5 Oct to the unlocked improvements: a new item's credence starts from how
// often items of its kind have held, and the derivation says why it moves from there): per kind over every scored item,
// Laplace (held + 1) / (n + 2), the line new-prediction.mjs copies into a new prediction's Credence scaffold
export function kindRates(tagged) {
  const out = {};
  for (const x of tagged) { const r = out[x.kind] ||= { n: 0, h: 0 }; r.n++; r.h += x.o; }
  return Object.fromEntries(Object.entries(out).map(([k, r]) => [k, { n: r.n, held: r.h, rate: (r.h + 1) / (r.n + 2) }]));
}
// DISCRIMINATION, JUDGED AGAINST DERIVED (the same 'Yes'): the RPS check (O29) can reward a flat forecast; the AUC and the
// resolution of each set on the same items and events say which separates what holds from what does not
export function discrimination(pairs) {
  const J = information(pairs.map(x => ({ p: x.judged, o: x.o }))), D = information(pairs.map(x => ({ p: x.derived, o: x.o })));
  return { n: pairs.length, both: pairs.some(x => x.o === 1) && pairs.some(x => x.o === 0), aucJ: J.auc, aucD: D.auc, resJ: J.res, resD: D.res };
}
export function byKind(tagged) {
  const seen = {}, out = {};
  let cur = null, pending = [];
  const flush = () => { for (const x of pending) { const s = seen[x.kind] ||= { n: 0, h: 0 }; s.n++; s.h += x.o; } pending = []; };
  for (const x of tagged) {
    if (x.test !== cur) { flush(); cur = x.test; }
    const s = seen[x.kind] || { n: 0, h: 0 }, kr = (s.h + 1) / (s.n + 2), r = out[x.kind] ||= { n: 0, p: 0, h: 0, b: 0, bk: 0 };
    r.n++; r.p += x.p; r.h += x.o; r.b += (x.p - x.o) ** 2; r.bk += (kr - x.o) ** 2; pending.push(x);
  }
  return Object.fromEntries(Object.entries(out).map(([k, r]) => [k, { n: r.n, meanP: r.p / r.n, held: r.h / r.n, brier: r.b / r.n, kindRate: r.bk / r.n }]));
}

// THE DEEP REVIEWS' LEAD RATE (the deep review after XAS-R2, deep-review-log.md 6 Oct 03:10 UK, FLAG 2; retirement pass 4,
// 8 Oct 09:15 UK: the rate was a frozen figure in one receipt's prose): the rate an item leaning on a deep review's cause or
// story starts from. The hand record (the first receipt reading 'read as the review said h of n') plus every cause
// review-causes.md settles that LED its question in a receipt after that one: the highest stated credence among the
// receipt's causes sharing its prefix (the question: the id before its first '-'), ties all leading. Laplace (h + 1) /
// (n + 2). Read only after settlements() has passed every settled line
export function leadRate(log, settled) {
  const lines = String(log).split('\n'), recAt = lines.findIndex(l => /read as the review said \d+ of \d+/.test(l));
  const rec = recAt >= 0 ? /read as the review said (\d+) of (\d+)/.exec(lines[recAt]) : null, at = new Map(), stated = statedCauses(log);
  lines.forEach((l, i) => { const m = /^- (\d{1,2} \w{3} \d{2}:\d{2}) UK \| covered /.exec(l); if (m && !at.has(m[1])) at.set(m[1], i); });
  let h = 0, n = 0;
  for (const raw of String(settled).split('\n')) {
    const m = /^- ([^|\n]+?) \| ([\w+-]+) \| (held|not) \| /.exec(raw);
    if (!m) continue;
    const t = m[1].replace(/ UK$/, ''), q = m[2].split('-')[0];
    if (!(at.get(t) > recAt)) continue;   // the hand record covers the receipts up to its own
    let top = -Infinity;
    for (const [k, p] of stated) { const [kt, id] = k.split('|'); if (kt === t && id.split('-')[0] === q) top = Math.max(top, p); }
    if (stated.get(`${t}|${m[2]}`) >= top) { n++; h += m[3] === 'held' ? 1 : 0; }
  }
  const H = (rec ? +rec[1] : 0) + h, N = (rec ? +rec[2] : 0) + n, rate = (H + 1) / (N + 2);
  return { h, n, H, N, rate, text: `an item leaning on a deep review's cause or story ${rate.toFixed(2)} (${H} of ${N}: ${rec ? `the hand record's ${rec[1]} of ${rec[2]}, deep-review-log.md, and ` : 'no hand record; '}the leading causes settled since, ${h} of ${n}, review-causes.md)` };
}

// THE DECISIVE CHECK (O29; the 5 Oct 10:29 row; its rule written before the first pair is read, the plan-auditor's
// BLOCKING 1 of 5 Oct 10:38 UK, and its looks fixed before the first read, its MINORs 1 and 2 of 5 Oct 10:45 UK): over
// items carrying both a judged and a derived full distribution, d = RPS(judged) - RPS(derived) per item, averaged within
// each test (a test's items, legs left out, share one run); Fisher's sign-flip randomization over tests (exact up to 16
// tests, else 20,000 flips from an exact 32-bit generator seeded 7002), one-sided above 0 (DERIVED better) and below
// (JUDGED better), Holm over the 2. LOOK 1 reads the first whole tests, in the scorecard's order, whose items first reach
// 30 - the same tests at every later run, so the read is frozen once taken; if it reads NEITHER, LOOK 2 reads only the
// tests after them, once their items reach 30. Each look at 0.025, so the two together keep a false call under 0.05.
// DERIVED (HELD), JUDGED (FALSIFIED) or NEITHER (INCONCLUSIVE); before a look's 30, ACCRUING
export const LOOK_ALPHA = 0.025;
export function signFlip(d, alpha = LOOK_ALPHA) {
  const obs = d.reduce((s, v) => s + v, 0), flips = [];
  if (d.length <= 16) for (let b = 0; b < 1 << d.length; b++) flips.push(d.reduce((s, v, i) => s + ((b >> i) & 1 ? -v : v), 0));
  else { let x = 7002; const r = () => ((x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296); for (let i = 0; i < 20000; i++) flips.push(d.reduce((s, v) => s + (r() < 0.5 ? -v : v), 0)); }
  const pUp = flips.filter(s => s >= obs - 1e-12).length / flips.length, pDn = flips.filter(s => s <= obs + 1e-12).length / flips.length;
  const holmU = pUp <= pDn ? Math.min(1, 2 * pUp) : Math.max(Math.min(1, 2 * pDn), pUp), holmD = pDn < pUp ? Math.min(1, 2 * pDn) : Math.max(Math.min(1, 2 * pUp), pDn);
  return { pUp: holmU, pDn: holmD, read: holmU < alpha ? 'DERIVED' : holmD < alpha ? 'JUDGED' : 'NEITHER' };
}
export function judgedCheck(pairs, need = 30) {
  const ok = pairs.filter(x => x.rpsJ !== null && x.rpsD !== null && x.test !== undefined), order = [], byTest = new Map();
  for (const x of ok) { if (!byTest.has(x.test)) { byTest.set(x.test, []); order.push(x.test); } byTest.get(x.test).push(x.rpsJ - x.rpsD); }
  // the looks: consecutive whole tests, each look closing at the first test that brings its items to `need`
  const looks = []; let cur = [], cnt = 0;
  for (const tst of order) { cur.push(tst); cnt += byTest.get(tst).length; if (cnt >= need) { looks.push({ tests: cur, n: cnt }); cur = []; cnt = 0; } }
  const mean = ts => { const d = ts.map(tst => { const a = byTest.get(tst); return a.reduce((s, v) => s + v, 0) / a.length; }); return { d, m: d.reduce((s, v) => s + v, 0) / d.length }; };
  const fmt = (k, L, r, dd) => `LOOK ${k}: ${r.read} - ${L.n} items over ${L.tests.length} tests (${L.tests.join(', ')}), mean RPS(judged) - RPS(derived) a test ${dd.m.toFixed(4)}, Holm p (derived better, judged better) ${r.pUp.toFixed(4)}, ${r.pDn.toFixed(4)} at ${LOOK_ALPHA}`;
  if (!looks.length) { const n = ok.length; return { read: 'ACCRUING', n, line: `ACCRUING - ${n} of ${need} items over ${order.length} tests` }; }
  const d1 = mean(looks[0].tests), r1 = signFlip(d1.d);
  if (r1.read !== 'NEITHER') return { read: r1.read, look: 1, line: fmt(1, looks[0], r1, d1) };
  if (looks.length < 2) return { read: 'NEITHER', look: 1, line: `${fmt(1, looks[0], r1, d1)}; LOOK 2 accruing: ${cnt} of ${need} new items` };
  const d2 = mean(looks[1].tests), r2 = signFlip(d2.d);
  return { read: r2.read, look: 2, line: `${fmt(1, looks[0], r1, d1)}; ${fmt(2, looks[1], r2, d2)}` };
}

// THE DEEP REVIEWS' CAUSE CREDENCES (the maintainer's 'unlock enforcement' of 5 Oct): each receipt in deep-review-log.md
// carrying "CAUSE CREDENCES: <id>=<p>; ..." (record-deep-review.mjs requires it), scored against review-causes.md, whose
// lines record a settled cause with the results file's own deciding line quoted (the second unlock: settled by a registered
// result, not by the author; record-deep-review.mjs --settle writes them and settlements() checks them, here as there).
// `read(file)` gives a results file's text, or null when it does not exist
export function causeScores(log, settled, read = () => null) {
  const { stated, pairs, errs } = settlements(log, settled, read);
  return { stated: stated.size, pairs, errs, line: `DEEP-REVIEW CAUSES: ${stated.size} stated, ${pairs.length} settled${pairs.length ? `, Brier ${brier(pairs).toFixed(3)}` : ''}` };
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
  // and report(), which prints the FALSIFIER and verdict lines copied above (the plan-auditor, 8 Oct, MINOR 3: the hash
  // covered items() alone); reduce-7e.mjs last changed in b4fcda4, before these lines were copied (d8c7b81)
  const r7 = src7.indexOf('function report('), reportSrc = src7.slice(r7, src7.indexOf("if (process.argv.includes('--look1'))", r7));
  const cases = [
    ['credences parsed, reasons in brackets ignored', JSON.stringify(credences(P)), '{"items":{"1":0.7,"2":0.8,"3":0.9},"overall":0.6,"overallLabel":"carried forward"}'],
    ['outcomes parsed', JSON.stringify(outcomes(R)), '{"items":{"1":1,"2":0,"3":1},"overall":1}'],
    ['Brier by hand: (0.3^2 + 0.8^2 + 0.1^2 + 0.4^2) / 4 = 0.225', String(near(scoreTest(P, R).brier, (0.09 + 0.64 + 0.01 + 0.16) / 4)), 'true'],
    ['a perfect forecaster scores 0', String(scoreTest(pred('each item holds: 1, 1.0; 2, 0.0. Carried forward: 1.0.'), res(['1. a -> held', '2. b -> MISSED'])).brier), '0'],
    ['always 50% scores 0.25', String(scoreTest(pred('each item holds: 1, 0.5; 2, 0.5.'), res(['1. a -> held', '2. b -> MISSED'])).brier), '0.25'],
    ['FALSIFIED scores the whole as not held', String(scoreTest(P, res(['1. a -> held', '2. b -> MISSED', '3. c -> held'], 'FALSIFIED - NOT CARRIED FORWARD')).pairs.at(-1).o), '0'],
    ['planted: no results file yet is PENDING, not scored', scoreTest(P, null).status, 'PENDING'],
    // a several-cause test (7t's forms): bracketed labels before the commas, "At least one cause HELD: about p", and an
    // OUTCOME line listing each cause - the whole held when any cause HELD, not when none does
    ['planted: a several-cause test scored, the whole held when a cause HELD', t(() => { const r = scoreTest(pred('The author\'s probability that each item holds: 1, 0.9; 2 (J HELD), 0.25; 3 (L), 0.5. At least\none cause HELD: about 0.6; none, about 0.4.'), 'THE PREDICTION\'S ITEMS:\n1. a -> held\n2. b -> MISSED\n3. c -> held\n\nOUTCOME: J INCONCLUSIVE, L HELD, 5 FALSIFIED\n'); return `${r.pairs.map(x => `${x.item}:${x.p}:${x.o}`).join(' ')}`; }), '1:0.9:1 2:0.25:0 3:0.5:1 a cause HELD:0.6:1'],
    ['planted: a several-cause test with no cause HELD scores the whole 0', t(() => { const r = scoreTest(pred('The author\'s probability that each item holds: 1, 0.9. At least one cause HELD: about 0.6.'), 'THE PREDICTION\'S ITEMS:\n1. a -> held\n\nOUTCOME: J INCONCLUSIVE, M0 FALSIFIED\n'); return String(r.pairs.at(-1).o); }), '0'],
    ['planted: an INCOMPLETE reducer is REFUSED, not scored', scoreTest(P, 'INCOMPLETE - nothing is scored:\n  x').status, 'REFUSED'],
    ['planted: reduce-7e\'s gate failure is REFUSED', scoreTest(P, 'FAIR-TEST GATE: FAILED\n  x').status, 'REFUSED'],
    ['planted: fair-gate\'s stamp failure is REFUSED', scoreTest(P, 'FAIR-TEST GATE: FAILED (stamps)\n  x').status, 'REFUSED'],
    ['planted: fair-gate\'s refusal is REFUSED', scoreTest(P, 'x\n\nREFUSED: not a fair test, so no figure is printed.').status, 'REFUSED'],
    ['planted: a numbered item line with no outcome stops the scorecard', t(() => outcomes(res(['1. a -> held', '2. b: 4.1']))), 'ERROR item 2: no outcome on its line'],
    ['7e, the reducer\'s own lines, every item held', t(() => JSON.stringify(outcomes(R7(true)))), '{"items":{"1":1,"2":1,"3":1,"4":1,"5":1,"6":1,"7":1,"8":1,"9":1},"overall":1}'],
    ['7e, the reducer\'s own lines, every item missed', t(() => JSON.stringify(outcomes(R7(false)))), '{"items":{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0},"overall":0}'],
    ['7e, its real prediction against the reducer\'s own lines, scored', t(() => scoreTest(readFileSync(join(HERE, 'predictions/bridge-reader.md'), 'utf8'), R7(true)).status), 'SCORED'],
    ['7e: reduce-7e\'s items() and report() unchanged since these lines were copied (else re-copy them)', createHash('sha256').update(itemsSrc).update(reportSrc).digest('hex').slice(0, 16), '00dec53125c7ae9d'],
    ['planted: report() changed by one character moves that hash', createHash('sha256').update(itemsSrc).update(reportSrc + ' ').digest('hex').slice(0, 16) !== '00dec53125c7ae9d', true],
    ['planted: no verdict line is REFUSED', scoreTest(P, '1. a -> held\n2. b -> held\n3. c -> held').status, 'REFUSED'],
    ['planted: an item with a credence and no outcome stops the scorecard', t(() => scoreTest(P, res(['1. a -> held', '2. b -> held']))), 'ERROR items do not match: credence '],
    ['planted: an outcome with no credence stops the scorecard', t(() => scoreTest(P, res(['1. a -> held', '2. b -> held', '3. c -> held', '4. d -> held']))), 'ERROR items do not match: credence '],
    ['planted: no Credence section stops the scorecard', t(() => credences('# Prediction: x\n\n## Power\n\nx\n')), 'ERROR no "## Credence" section'],
    ['planted: a credence above 1 stops the scorecard', t(() => credences(pred('each item holds: 1, 1.5.'))), 'ERROR item 1: credence 1.5 is not a probability'],
    ['planted: every outcome given a probability scores the first-named (7au\'s form)', t(() => { const c = credences(pred('- **Item 1:** FALSIFIED 0.55, INCONCLUSIVE 0.35, HELD 0.10.\n- **Item 2:** HELD 0.85, INCONCLUSIVE 0.12, FALSIFIED 0.03.')); return `${c.items[1]}:${c.predicted[1]} ${c.items[2]}:${c.predicted[2]}`; }), '0.55:FALSIFIED 0.85:HELD'],
    ['a three-outcome prediction: the HELD share is the whole', JSON.stringify(credences(pred('each item holds: 1, 0.60; 2, 0.90. The outcome: HELD 0.55, FALSIFIED 0.15, INCONCLUSIVE 0.30.')).overall), '0.55'],
    ['a three-outcome verdict: HELD scores 1, INCONCLUSIVE and FALSIFIED 0', ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(v => outcomes(`THE PREDICTION'S ITEMS:\n1. a: x -> held\n\nOUTCOME: ${v} - why`).overall).join(','), '1,0,0'],
    ['7r, its real prediction against its saved results-7r.txt, scored', t(() => { const r = scoreTest(readFileSync(join(HERE, 'predictions/diag-7r.md'), 'utf8'), readFileSync(join(HERE, 'results-7r.txt'), 'utf8')); return `${r.status} ${r.pairs.length} ${r.pairs.map(x => x.o).join('')}`; }), 'SCORED 6 101111'],
    ['7r: reduce-7r\'s items() unchanged since 7r was read (else re-check the scorecard reads its lines)', (() => { const s7 = readFileSync(join(HERE, 'reduce-7r.mjs'), 'utf8'), i = s7.indexOf('export function items('); return createHash('sha256').update(s7.slice(i, s7.indexOf('\n}\n', i) + 3)).digest('hex').slice(0, 16); })(), 'd78aa77ac22e161f'],
    ['7s, its real prediction against its saved results-7s.txt, scored', t(() => { const r = scoreTest(readFileSync(join(HERE, 'predictions/diag-7s.md'), 'utf8'), readFileSync(join(HERE, 'results-7s.txt'), 'utf8')); return `${r.status} ${r.pairs.length} ${r.pairs.map(x => x.o).join('')}`; }), 'SCORED 6 111110'],
    ['a NOT SETTLED outcome is scored: the whole 0, a missed item 1 counted', t(() => { const r = scoreTest(readFileSync(join(HERE, 'predictions/diag-7s.md'), 'utf8'), 'THE PREDICTION\'S ITEMS:\n1. a: x -> MISSED\n2. b: NOT SETTLED -> MISSED\n3. c: x -> held\n4. d: x -> held\n5. e: x -> held\n\nOUTCOME: NOT SETTLED (x)'); return `${r.status} ${r.pairs.map(x => x.o).join('')}`; }), 'SCORED 001110'],
    ['7r, its real prediction and saved result, scored', t(() => { const r = scoreTest(readFileSync(join(HERE, 'predictions/diag-7r.md'), 'utf8'), 'THE PREDICTION\'S ITEMS:\n1. a: x -> held\n2. b: x -> MISSED\n3. c: x -> held\n4. d: x -> held\n5. e: x -> held\n\nOUTCOME: HELD - x'); return `${r.status} ${r.pairs.length}`; }), 'SCORED 6'],
    ['reliability bins: 0.7 in 60-75%, 0.8 in 75-90%, 0.9 and 0.6... ', JSON.stringify(reliability(scoreTest(P, R).pairs).map(b => b.n)), '[0,2,1,1]'],
  ];
  // a three-outcome test with numbered items (7v): each item scored against the outcome its credence names
  cases.push(['7ad: one outcome named for every item, each numbered item scored against it', t(() => { const r = scoreTest(pred('The author\'s probability that each item reads as predicted (HELD): 1, 0.65; 2, 0.40; 3, 0.45. The reasons follow.'), 'OUTCOME: 1 INCONCLUSIVE, 2 FALSIFIED, 3 HELD'); return `${r.status} ${r.pairs.map(x => `${x.item} ${x.p} ${x.o}`).join(', ')}`; }), 'SCORED 1 0.65 0, 2 0.4 0, 3 0.45 1']);
  cases.push(['7ad\'s form with another outcome named: every item against INCONCLUSIVE', t(() => { const r = scoreTest(pred('The author\'s probability that each item reads as predicted (INCONCLUSIVE): 1, 0.7; 2, 0.2.'), 'OUTCOME: 1 INCONCLUSIVE, 2 HELD'); return `${r.status} ${r.pairs.map(x => `${x.item} ${x.p} ${x.o}`).join(', ')}`; }), 'SCORED 1 0.7 1, 2 0.2 0']);
  cases.push(['7ad: its real prediction\'s credences read, every item against HELD', t(() => { const c = credences(readFileSync(join(HERE, 'predictions/diag-7ad.md'), 'utf8')); return JSON.stringify([c.items, c.predicted]); }), '[{"1":0.65,"2":0.4,"3":0.45,"4":0.65},{"1":"HELD","2":"HELD","3":"HELD","4":"HELD"}]']);
  cases.push(['7v: items read as their bracketed outcome, NOT REPRODUCED against HELD a miss', t(() => { const r = scoreTest(pred('The author\'s probability that each item reads as predicted: 1 (INCONCLUSIVE), 0.40; 2 (HELD), 0.80; 3 (FALSIFIED), 0.70 (a reason). P named: about 0.35.'), 'x\nOUTCOME: 1 INCONCLUSIVE, 2 NOT REPRODUCED, 3 HELD\n'); return `${r.status} ${r.pairs.map(x => `${x.item}:${x.p}:${x.o}`).join(' ')} ${r.brier.toFixed(4)}`; }), 'SCORED 1:0.4:1 2:0.8:0 3:0.7:0 P named:0.35:0 0.4031']);
  cases.push(['7v: the two wholes scored from the attribution and the candidate list, and a numbered line with no NOT REPRODUCED still read as numbered', t(() => { const P7 = pred('The author\'s probability that each item reads as predicted: 1 (HELD), 0.60; 2 (FALSIFIED), 0.70. P named (alone or with C): about 0.35. At least one READER+J candidate by the whole score:\nabout 0.55.'); const r = scoreTest(P7, 'OUTCOME: 1 HELD, 2 FALSIFIED\n3. item 3 does not name P\nATTRIBUTION (x): HELD: N, table noise (item 4)\n  READER+J/0   survival CANDIDATE whole score CANDIDATE | x\n'); return `${r.status} ${r.pairs.map(x => `${x.p}:${x.o}`).join(' ')}`; }), 'SCORED 0.6:1 0.7:1 0.35:0 0.55:1']);
  cases.push(['7al: one item named alone, "item 1 reads as predicted (HELD): 0.55"', t(() => { const r = scoreTest(pred('The author\'s probability that item 1 reads as predicted (HELD): 0.55. For: x.'), 'x\nOUTCOME: 1 HELD\n'); return `${r.status} ${r.pairs.map(x => `${x.item}:${x.p}:${x.o}`).join(' ')}`; }), 'SCORED 1:0.55:1']);
  cases.push(['7ap: items separated by semicolons are each scored', t(() => { const r = scoreTest(pred('The author\'s probability that each item reads as predicted: 1 (HELD), 0.45; 2 (INCONCLUSIVE), 0.45; 3 (HELD), 0.65.'), 'x\nOUTCOME: 1 HELD; 2 HELD; 3 HELD\n'); return `${r.status} ${r.pairs.map(x => `${x.item}:${x.p}:${x.o}`).join(' ')}`; }), 'SCORED 1:0.45:1 2:0.45:0 3:0.65:1']);
  cases.push(['7ah: a numbered line with a trailing "; note" reads its items and leaves the note unscored', t(() => { const r = scoreTest(pred('The author\'s probability that each item reads as predicted: 1 (HELD), 0.60; 2 (HELD), 0.30.'), 'x\nOUTCOME: 1 HELD, 2 FALSIFIED; 6 (the split): no opening flips\n'); return `${r.status} ${r.pairs.map(x => `${x.item}:${x.p}:${x.o}`).join(' ')}`; }), 'SCORED 1:0.6:1 2:0.3:0']);
  cases.push(['7ah: a revised list after a bracket and colon ("...0.026): 1 (HELD), 0.35; ...") overrides the first list, item 1 included', t(() => { const c = credences(readFileSync(join(HERE, 'predictions/diag-7ah.md'), 'utf8')); return JSON.stringify(c.items); }), '{"1":0.35,"2":0.45,"3":0.3,"4":0.4,"5":0.5,"7":0.75,"8":0.7}']);
  // the 5 Oct extras (the maintainer's 'Go ahead' on the deep review's proposals)
  cases.push(['rps: a sure HELD on HELD scores 0, a sure FALSIFIED on HELD 1, a uniform on HELD 5/18 and on INCONCLUSIVE 1/9', [rps({ HELD: 1, INCONCLUSIVE: 0, FALSIFIED: 0 }, 'HELD'), rps({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 1 }, 'HELD'), rps({ HELD: 1 / 3, INCONCLUSIVE: 1 / 3, FALSIFIED: 1 / 3 }, 'HELD'), rps({ HELD: 1 / 3, INCONCLUSIVE: 1 / 3, FALSIFIED: 1 / 3 }, 'INCONCLUSIVE')].map(x => x.toFixed(4)).join(','), '0.0000,1.0000,0.2778,0.1111']);
  cases.push(['information: always the base rate has resolution 0 and Brier = uncertainty; a perfect split has AUC 1', t(() => { const a = information([{ p: 0.5, o: 1 }, { p: 0.5, o: 0 }]), b = information([{ p: 0.9, o: 1 }, { p: 0.1, o: 0 }]); return [a.res, a.unc, a.auc, b.auc].map(x => x.toFixed(3)).join(','); }), '0.000,0.250,0.500,1.000']);
  cases.push(['information: Brier = reliability - resolution + uncertainty over distinct credences', t(() => { const ps = [{ p: 0.7, o: 1 }, { p: 0.7, o: 0 }, { p: 0.7, o: 1 }, { p: 0.2, o: 0 }, { p: 0.2, o: 1 }], i = information(ps); return String(Math.abs(brier(ps) - (i.rel - i.res + i.unc)) < 1e-12); }), 'true']);
  cases.push(['byKind: the kind rate uses earlier tests only (a first test scores the kind at a half)', t(() => { const k = byKind([{ test: 'a', kind: 'X', p: 0.9, o: 1 }, { test: 'a', kind: 'X', p: 0.9, o: 1 }, { test: 'b', kind: 'X', p: 0.9, o: 0 }]).X; return [k.n, k.kindRate.toFixed(4)].join(','); }), '3,0.3542']);
  cases.push(['a full distribution, a judged line, two legs and the kinds are read', t(() => { const c = credences(pred('- **Item 1:** HELD 0.34, INCONCLUSIVE 0.32, FALSIFIED 0.34.\n- **Judged, item 1:** HELD 0.45, INCONCLUSIVE 0.20, FALSIFIED 0.35.\n- **Item 1, leg S370:** HELD 0.7, INCONCLUSIVE 0.2, FALSIFIED 0.1.\n- **Item 1, leg S130:** HELD 0.73, INCONCLUSIVE 0.16, FALSIFIED 0.11.\n- **Kinds:** 1 ATTRIB.')); return JSON.stringify([c.items, c.dists['1'].FALSIFIED, c.judged['1'].p, Object.keys(c.legs), c.kinds]); }), '[{"1":0.34},0.34,0.45,["1/S370","1/S130"],{"1":"ATTRIB"}]']);
  cases.push(['planted: a distribution not summing to 1 stops the scorecard', t(() => credences(pred('- **Item 1:** HELD 0.5, INCONCLUSIVE 0.3, FALSIFIED 0.3.'))), 'ERROR item 1: its three outcomes sum to 1.100, not 1']);
  cases.push(['the judged credence is scored beside the derived, each leg against the LEGS line', t(() => { const r = scoreTest(pred('- **Item 1:** HELD 0.34, INCONCLUSIVE 0.32, FALSIFIED 0.34.\n- **Judged, item 1:** FALSIFIED 0.5, HELD 0.3, INCONCLUSIVE 0.2.\n- **Item 1, leg S370:** HELD 0.7, INCONCLUSIVE 0.2, FALSIFIED 0.1.'), 'x\nOUTCOME: 1 HELD\nLEGS: 1/S370 INCONCLUSIVE\n'); return JSON.stringify([r.pairs[0].o, r.judged[0].judged, r.judged[0].o, r.legs[0].o, r.rps[0].rps.toFixed(4), r.judged[0].rpsJ.toFixed(4)]); }), '[1,0.3,1,0,"0.2756","0.3700"]']);
  cases.push(['planted: leg credences with no LEGS line stop the scorecard', t(() => scoreTest(pred('- **Item 1:** HELD 0.34, INCONCLUSIVE 0.32, FALSIFIED 0.34.\n- **Item 1, leg S370:** HELD 0.7, INCONCLUSIVE 0.2, FALSIFIED 0.1.'), 'x\nOUTCOME: 1 HELD\n')), 'ERROR leg credences but no LEGS line in the results']);
  const many = (k, f, n = 30) => Array.from({ length: n }, (_, i) => ({ test: `t${i % k}`, ...f(i % k) }));
  cases.push(['the decisive check: under 30 items it is ACCRUING', judgedCheck([{ test: 'a', rpsJ: 0.3, rpsD: 0.1 }]).read, 'ACCRUING']);
  cases.push(['the decisive check: derived better on all 8 tests (4 items each) reads DERIVED (exact 1/256, Holm 1/128, under 0.025)', judgedCheck(many(8, () => ({ rpsJ: 0.3, rpsD: 0.1 }), 32)).read, 'DERIVED']);
  cases.push(['the decisive check: judged better on all 8 tests reads JUDGED', judgedCheck(many(8, () => ({ rpsJ: 0.1, rpsD: 0.3 }), 32)).read, 'JUDGED']);
  cases.push(['the decisive check: 6 tests all one way read NEITHER - 1/64 alone is under 0.025, Holm 1/32 is not (the Holm step pinned)', judgedCheck(many(6, () => ({ rpsJ: 0.3, rpsD: 0.1 }))).read, 'NEITHER']);
  cases.push(['the decisive check: mixed signs read NEITHER (a test is one cluster, however many items)', judgedCheck(many(6, k => ({ rpsJ: k < 3 ? 0.3 : 0.1, rpsD: 0.2 }))).read, 'NEITHER']);
  cases.push(['the decisive check: 30 tests of one item each, all one way, read DERIVED by the random branch', judgedCheck(many(32, () => ({ rpsJ: 0.3, rpsD: 0.1 }), 32)).read, 'DERIVED']);
  cases.push(['the decisive check: 30 tests of mixed signs read NEITHER by the random branch', judgedCheck(many(32, k => ({ rpsJ: k % 2 ? 0.3 : 0.1, rpsD: 0.2 }), 32)).read, 'NEITHER']);
  cases.push(['the 32-bit generator: 100,000 draws from 7002 all distinct', (() => { let x = 7002; const s = new Set(); for (let i = 0; i < 100000; i++) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; s.add(x); } return String(s.size); })(), '100000']);
  cases.push(['the first look is frozen: tests after it do not change its read', (() => { const first = many(8, () => ({ rpsJ: 0.3, rpsD: 0.1 }), 32), later = Array.from({ length: 20 }, (_, i) => ({ test: `u${i}`, rpsJ: 0.1, rpsD: 0.3 })); return `${judgedCheck(first).read} ${judgedCheck([...first, ...later]).read} ${judgedCheck([...first, ...later]).look}`; })(), 'DERIVED DERIVED 1']);
  cases.push(['a NEITHER first look is followed by a second on the new tests only', (() => { const first = many(6, k => ({ rpsJ: k < 3 ? 0.3 : 0.1, rpsD: 0.2 })), second = Array.from({ length: 32 }, (_, i) => ({ test: `v${i % 8}`, rpsJ: 0.3, rpsD: 0.1 })); const r = judgedCheck([...first, ...second]); return `${r.read} ${r.look}`; })(), 'DERIVED 2']);
  const LOG = '- 5 Oct 12:00 UK | covered X | level HIGH | ranked (1) a (2) b. CAUSE CREDENCES: rep=0.6; quad=0.3. next\n- 5 Oct 09:00 UK | covered X | level HIGH | no credences\n';
  { const RX = f => (f === 'results-x.txt' ? 'x\nOUTCOME: 1 HELD\n' : null);
    cases.push(['the deep reviews\' cause credences: read from the receipts, scored as settled', (() => { const r = causeScores(LOG, '- 5 Oct 12:00 | rep | held | results-x.txt | OUTCOME: 1 HELD\n', RX); return `${r.stated} ${r.pairs.length} ${r.errs.length} ${brier(r.pairs).toFixed(2)}`; })(), '2 1 0 0.16']);
    cases.push(['planted: a settlement naming no stated cause is an error', String(causeScores(LOG, '- 5 Oct 12:00 | draw | held | results-x.txt | OUTCOME: 1 HELD\n', RX).errs.length), '1']);
    cases.push(['planted: a cause settled twice is an error', String(causeScores(LOG, '- 5 Oct 12:00 | rep | held | results-x.txt | OUTCOME: 1 HELD\n- 5 Oct 12:00 | quad | not | results-x.txt | OUTCOME: 1 HELD\n- 5 Oct 12:00 | rep | not | results-x.txt | OUTCOME: 1 HELD\n', RX).errs.length), '1']);
    cases.push(['planted: a settlement citing a missing results file is an error', String(causeScores(LOG, '- 5 Oct 12:00 | rep | held | results-none.txt | OUTCOME: 1 HELD\n', RX).errs.length), '1']);
    cases.push(['planted: a settlement whose quote is not in its results file is an error (settled by judgement)', String(causeScores(LOG, '- 5 Oct 12:00 | rep | held | results-x.txt | OUTCOME: 1 FALSIFIED\n', RX).errs.length), '1']); }
  cases.push(['EDGE: no settlements reads 0 settled, no Brier', causeScores(LOG, '').line, 'DEEP-REVIEW CAUSES: 2 stated, 0 settled']);
  { const LL = '- 5 Oct 09:00 UK | covered A | level HIGH | CAUSE CREDENCES: a-x=0.6; a-y=0.3\n- 5 Oct 10:00 UK | covered B | level HIGH | read as the review said 1 of 19. CAUSE CREDENCES: b-x=0.5\n- 6 Oct 01:00 UK | covered C | level HIGH | CAUSE CREDENCES: c-x=0.5; c-y=0.4; d-x=0.2; d-y=0.2\n';
    const lr = s => { const r = leadRate(LL, s); return `${r.H}/${r.N} ${r.rate.toFixed(4)}`; };
    cases.push(['the lead rate: no settlements reads the hand record alone, (1 + 1) / (19 + 2)', lr(''), '1/19 0.0952']);
    cases.push(['the lead rate: a settled lead held after the record counts, and a settled cause that did not lead does not', lr('- 6 Oct 01:00 | c-x | held | r.txt | OUTCOME: 1 HELD\n- 6 Oct 01:00 | c-y | not | r.txt | OUTCOME: 1 HELD\n'), '2/20 0.1364']);
    cases.push(['planted: a lead settled from a receipt the hand record already covers is not counted twice', lr('- 5 Oct 09:00 | a-x | held | r.txt | OUTCOME: 1 HELD\n'), '1/19 0.0952']);
    cases.push(['EDGE: tied leads both lead, each question its own (c- and d- in one receipt), a lead not held counts in n only', lr('- 6 Oct 01:00 | d-x | held | r.txt | OUTCOME: 1 HELD\n- 6 Oct 01:00 | d-y | not | r.txt | OUTCOME: 1 HELD\n- 6 Oct 01:00 | c-x | not | r.txt | OUTCOME: 1 HELD\n'), '2/22 0.1250']);
    cases.push(['EDGE: no hand record reads the settled leads alone', (() => { const r = leadRate(LL.replace('read as the review said 1 of 19. ', ''), '- 6 Oct 01:00 | c-x | held | r.txt | OUTCOME: 1 HELD\n'); return `${r.H}/${r.N} ${r.rate.toFixed(4)}`; })(), '1/1 0.6667']); }
  cases.push(['the kind\'s base rate: 3 held of 4 ATTRIB items reads (3 + 1) / (4 + 2), and an unseen kind is absent', (() => { const r = kindRates([1, 1, 1, 0].map(o => ({ kind: 'ATTRIB', o }))); return `${r.ATTRIB.rate.toFixed(4)} ${r.ATTRIB.n} ${'NOHARM' in r}`; })(), '0.6667 4 false']);
  cases.push(['discrimination: a judged set that ranks perfectly and a derived set that ranks backwards', (() => { const d = discrimination([{ judged: 0.9, derived: 0.2, o: 1 }, { judged: 0.1, derived: 0.8, o: 0 }]); return `${d.aucJ} ${d.aucD} ${d.both}`; })(), '1 0 true']);
  cases.push(['EDGE: discrimination over items all of one outcome says so (no AUC)', (() => { const d = discrimination([{ judged: 0.9, derived: 0.2, o: 1 }]); return `${d.both} ${Number.isNaN(d.aucJ)}`; })(), 'false true']);
  const wrong = cases.filter(([, got, want]) => got !== want && !(want.startsWith('ERROR') && got.startsWith(want.trimEnd())));
  if (wrong.length) { console.log(`PLANTED CHECK FAILED: ${wrong.map(([n, got, w]) => `${n} read ${got}, should read ${w}`).join('; ')}`); process.exit(1); }
  if (process.argv.includes('--planted')) { console.log(`planted (${cases.length}): all read as they should`); process.exit(0); }
}

// the real tests
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const read = f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : null);
  console.log('THE SCORECARD: the author\'s stated credence against each item\'s outcome (PLAN.md 8j). Brier target below 0.20; always 50% scores 0.25.\n');
  const all = [], tagged = [], rpsAll = [], legAll = [], judgedAll = [];
  for (const T of TESTS) {
    const p = read(T.prediction);
    if (p === null) { console.log(`${T.name}: ERROR - no prediction file ${T.prediction}`); process.exit(1); }
    const s = scoreTest(p, read(T.results));
    if (s.status !== 'SCORED') { console.log(`${T.name}: ${s.status}${s.why ? ` (${s.why})` : ` (no ${T.results} yet)`}`); continue; }
    console.log(`${T.name}: Brier ${s.brier.toFixed(3)} over ${s.pairs.length} (${s.pairs.map(x => `${x.item} ${x.p} -> ${x.o ? 'held' : 'not'}`).join('; ')})`);
    all.push(...s.pairs);
    const short = T.name.split(' ')[0];
    for (const x of s.pairs) tagged.push({ test: short, kind: (s.kinds && s.kinds[x.item]) || (ITEM_KINDS[short] && ITEM_KINDS[short][x.item]) || (/^\d+$/.test(x.item) ? 'UNTAGGED' : 'WHOLE'), p: x.p, o: x.o });
    rpsAll.push(...(s.rps || [])); legAll.push(...(s.legs || [])); judgedAll.push(...(s.judged || []).map(x => ({ ...x, test: short })));
  }
  if (!all.length) { console.log('\nNo scored tests yet: no cumulative score.'); process.exit(0); }
  console.log(`\nCUMULATIVE: Brier ${brier(all).toFixed(3)} over ${all.length} items`);
  console.log('RELIABILITY (credence bin: items, mean credence, share held):');
  for (const b of reliability(all)) console.log(`  ${b.label.padEnd(13)} ${String(b.n).padStart(3)}   ${b.meanP === null ? '  -  ' : b.meanP.toFixed(2)}   ${b.held === null ? '  -  ' : b.held.toFixed(2)}`);
  // the 5 Oct measures (the deep review of the prediction record; the maintainer's 'Go ahead')
  const I = information(all);
  console.log(`\nINFORMATION: base rate ${I.base.toFixed(3)} held; always the base rate scores ${I.baseBrier.toFixed(3)}; over the distinct credences reliability ${I.rel.toFixed(3)}, resolution ${I.res.toFixed(3)}, uncertainty ${I.unc.toFixed(3)}; AUC ${I.auc.toFixed(2)} (0.5 is no discrimination)`);
  const K = byKind(tagged);
  console.log('BY KIND (items, mean credence, share held, the author\'s Brier, the Brier of the kind\'s base rate from earlier tests):');
  for (const k of KINDS.filter(x => K[x]).concat(Object.keys(K).filter(x => !KINDS.includes(x)))) console.log(`  ${k.padEnd(9)} ${String(K[k].n).padStart(3)}   ${K[k].meanP.toFixed(2)}   ${K[k].held.toFixed(2)}   ${K[k].brier.toFixed(3)}   ${K[k].kindRate.toFixed(3)}`);
  if (rpsAll.length) console.log(`THREE-OUTCOME ITEMS: ranked probability score ${(rpsAll.reduce((a, x) => a + x.rps, 0) / rpsAll.length).toFixed(3)} over ${rpsAll.length}, a uniform forecast ${(rpsAll.reduce((a, x) => a + x.uniform, 0) / rpsAll.length).toFixed(3)}`);
  if (legAll.length) {
  // worded so no line but a test's reads '<name> (<what>): Brier' (check-plan.mjs's retro reads any such line as a scored test)
  console.log(`LEGS, an item needing every household scored household by household: Brier ${brier(legAll).toFixed(3)} over ${legAll.length}`);
  }
  { let committed = null; try { committed = execFileSync('git', ['show', 'HEAD:research/solver/review-causes.md'], { cwd: join(HERE, '..', '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { /* not committed yet */ }
    const ao = appendOnlyProblem(committed, read('review-causes.md') || '');
    if (ao) { console.log(`ERROR - ${ao}`); process.exit(1); }
    const C = causeScores(read('deep-review-log.md') || '', read('review-causes.md') || '', f => (existsSync(join(HERE, f)) ? readFileSync(join(HERE, f), 'utf8') : null)); if (C.errs.length) { console.log(`ERROR - review-causes.md: ${C.errs.join('; ')}`); process.exit(1); } console.log(C.line); }
  { const R = kindRates(tagged), LR = leadRate(read('deep-review-log.md') || '', read('review-causes.md') || '');
    console.log(`KIND BASE RATES (a new item's starting credence: Laplace over every scored item of its kind): ${KINDS.filter(k => R[k]).concat(Object.keys(R).filter(k => !KINDS.includes(k))).map(k => `${k} ${R[k].rate.toFixed(2)} (${R[k].held} of ${R[k].n})`).join(', ')}; ${LR.text}`); }
  if (judgedAll.length) { const D = discrimination(judgedAll); console.log(`DISCRIMINATION, judged against derived (the same items and events): ${D.both ? `AUC judged ${D.aucJ.toFixed(2)}, derived ${D.aucD.toFixed(2)}; resolution judged ${D.resJ.toFixed(3)}, derived ${D.resD.toFixed(3)}` : 'accruing - the items so far all of one outcome'} over ${D.n}`); }
  if (judgedAll.length) { const J = judgedCheck(judgedAll); console.log(`JUDGED AGAINST DERIVED (paired, the same items and events): Brier judged ${(judgedAll.reduce((a, x) => a + (x.judged - x.o) ** 2, 0) / judgedAll.length).toFixed(3)}, derived ${(judgedAll.reduce((a, x) => a + (x.derived - x.o) ** 2, 0) / judgedAll.length).toFixed(3)} over ${judgedAll.length}; the decisive check (O29): ${J.line}`); }
}
