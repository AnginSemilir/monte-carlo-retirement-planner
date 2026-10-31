/*
 * 7W'S REDUCER (predictions/diag-7w.md; PLAN.md 7w): is T the five-point return average hiding the bridge's last year (Q)?
 * Reads the nine unit logs of audit-s126.mjs diag7w (results/diag7w/case0-8.txt) and every run's trace.
 * THE STAMP GATE: fair-gate.mjs's requireFairLogs (one code version, launched under predictions/diag-7w.md at the blob each
 * log carries). THE FAIR-TEST GATE (before any figure): every registered unit present once, its ran line at the registered
 * settings (30 points, seed 7002, 3000 paths, lambda 7t's, the exact final year, its own return points and bridge read),
 * the units of one case differing in nothing but the return points and the bridge read, one policy only where named, the
 * solved margin the product's, a year-0 gap line, its three runs and its done line; every trace agreeing with its log in
 * count, seed, arm, stamp and survival (within half the run line's last printed place, 0.00005: the run line prints four
 * decimals, and at 3,000 paths survival is a whole number of paths in 3,000 - the lesson of 7v's gate, 27 Sep).
 * THE ITEMS, each read by the regimen's rule (exact tests against the case's margin, Holm over the item's legs, three
 * outcomes), the gap items by their registered ratios:
 *   1. Q on the reader: at 15 points the reader's year-0 gap on share 0.95 rises at least tenfold over 5 points and it opens
 *      de-risked at the product's margin, with and without one policy (FALSIFIED: the gap rises less than threefold on both)
 *   2. Q's survival: on share 0.95 the reader at 15 points gains against itself at 5 points, at the product's margin, with and
 *      without one policy (FALSIFIED: no material gain on both)
 *   3. the control: S126's reader gap moves by less than a factor of two between 5 and 15 points (FALSIFIED: it rises
 *      tenfold or more - Q would explain S126 as well, against 7s)
 *   4. the freed opening: with the year-0 move freed at the product's margin, S126's reader and S194's off do no material
 *      harm against margin 0 and switch at most half as often (FALSIFIED: harm on both)
 *   5. Q on the product: off's year-0 gap on share 0.95 rises at least tenfold at 15 points and it opens de-risked at the
 *      product's margin (FALSIFIED: less than threefold)
 * Reported, not items: every run's survival, saved/lost against its unit's 5-point /1e-3 run on the same case, switches a path,
 * the year-0 gaps and openings, and each 15-point run against its 5-point twin at the SAME margin (quadPairs: at margin 0
 * both open by the chooser's best, so the pair there shows what fifteen points change beyond the opening).
 *   node research/solver/reduce-7w.mjs [dir] > research/solver/results-7w.txt
 *   node research/solver/reduce-7w.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { marginFor, survivalChange } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { switching } from './read-7t-deep.mjs';
import { cells, harmFamily, gainFamily, survivedShare } from './reduce-7v.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7w.md';
export const N = 3000, PTS = '30', SEED = '7002', LAMBDA = '0.0223606797749979', LEVELS = '1,1.1,0.95,0.9,0.8';
export const SIM_TOL = 5e-5 + 1e-9;
// the registered units: [case, label], the label naming the arm, one policy and the return points
export const UNITS = [
  ['share 0.95', 'READER@15'], ['share 0.95', 'READER+J@15'], ['share 0.95', 'OFF@15'], ['S126', 'READER@15'],
  ['share 0.95', 'READER@5'], ['share 0.95', 'READER+J@5'], ['share 0.95', 'OFF@5'], ['S126', 'READER@5'], ['S194', 'OFF@5']];
export const RUNS = ['1e-3', '0', '1e-3+open'];
export const DECIDED = 'off:_no_tier_above_the_plan';   // 7v's core cases: the plan's own tier, the risk above decided off
export const TEN = 10, THREE = 3, TWO = 2, MARGIN = 0.001;

const CASEL = /^(\S.*?)\s+case \| unit (\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+)$/;
const SOLVEL = /^\s+solve (\S+): table (\S+) secs (\S+)$/;
const GAPL = /^\s+gap (\S+): (\S+) opening (\d+),(\d+)$/;
const RANL = /^\s+ran (\S+): (.*)$/;
const JOINTL = /^\s+joint (\S+): (true|false) switchMargin (\S+) scale (\S+) cap (\S+) deathTax (\S+) tier (\S+) riskAbove (\S+)$/;
const RUNL = /^\s+run (\S+)\/(\S+): sim (\S+) below (\S+) tier-below (\S+) estate (\S+) secs (\S+)$/;
export const field = (ran, k) => { const m = new RegExp(`(?:^|\\s)${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
// a year-0 gap as logged: '0' (the chooser keeps the plan's tier at margin 0), '>1', or a number
export const gapNum = g => (g === '0' ? 0 : g === '>1' ? Infinity : Number(g));

export function parse(text) {
  const units = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), label: m[2], lambda: m[3], tier: m[4], riskAbove: m[5], mix: m[6], runs: {}, done: null }; units.push(cur); continue; }
    if (!cur) continue;
    if ((m = SOLVEL.exec(line)) && m[1] === cur.label) { cur.solve = { table: +m[2], secs: +m[3] }; continue; }
    if ((m = GAPL.exec(line)) && m[1] === cur.label) { cur.gap = { gap: m[2], open1e3: +m[3], open0: +m[4] }; continue; }
    if ((m = RANL.exec(line)) && m[1] === cur.label) { cur.ran = m[2]; continue; }
    if ((m = JOINTL.exec(line)) && m[1] === cur.label) { cur.joint = { joint: m[2] === 'true', margin: m[3], deathTax: +m[6], tier: m[7], decided: m[8] }; continue; }
    if ((m = RUNL.exec(line)) && m[1] === cur.label) { cur.runs[m[2]] = { sim: +m[3], below: +m[4], tier: +m[5], estate: +m[6], secs: +m[7] }; continue; }
    if ((m = /^\s+done (\d+) runs$/.exec(line))) { cur.done = +m[1]; continue; }
  }
  return units;
}
const quadOf = label => label.split('@')[1];
export function gate(units) {
  const bad = [];
  for (const [id, label] of UNITS) { const k = units.filter(u => u.id === id && u.label === label).length; if (k !== 1) bad.push(`${id} ${label}: ${k} unit lines, not 1`); }
  const strip = s => (s || '').replace(/ quad \S+/, '').replace(/ bridgeRead \S+/, '');
  for (const u of units) {
    if (!UNITS.some(([id, l]) => id === u.id && l === u.label)) { bad.push(`${u.id} ${u.label}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${u.id} ${u.label}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    if (!u.solve) bad.push(`${u.id} ${u.label}: no solve line`);
    if (!u.gap) bad.push(`${u.id} ${u.label}: no year-0 gap line`);
    if (!u.ran) { bad.push(`${u.id} ${u.label}: no ran line`); continue; }
    const w = { mix: '3', pts: PTS, seed: SEED, paths: String(N), grid: `total${PTS}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', tiersAbove: '0', finalIntegral: 'true', quad: quadOf(u.label) };
    for (const [k, v] of Object.entries(w)) if (field(u.ran, k) !== v) bad.push(`${u.id} ${u.label}: ${k} is ${field(u.ran, k)}, the prediction names ${v}`);
    if (field(u.ran, 'bridgeRead') !== (u.label.startsWith('READER') ? 'reader' : 'false')) bad.push(`${u.id} ${u.label}: ran bridgeRead ${field(u.ran, 'bridgeRead')}`);
    const first = units.find(x => x.id === u.id && x.ran);
    if (strip(u.ran) !== strip(first.ran)) bad.push(`${u.id} ${u.label}: differs from ${first.label} beyond the return points and the bridge read`);
    if (!u.joint) bad.push(`${u.id} ${u.label}: no joint line`);
    else {
      if (u.joint.joint !== u.label.includes('+J')) bad.push(`${u.id} ${u.label}: ran jointWorlds ${u.joint.joint}`);
      if (u.joint.margin !== '0.001') bad.push(`${u.id} ${u.label}: solved with switch margin ${u.joint.margin}`);
      if (u.joint.deathTax !== 0) bad.push(`${u.id} ${u.label}: a pension death charge ${u.joint.deathTax}`);
      if (u.joint.tier !== 'own' || u.joint.decided !== DECIDED) bad.push(`${u.id} ${u.label}: plan tier ${u.joint.tier}, risk above ${u.joint.decided}`);
    }
    if (Object.keys(u.runs).sort().join(',') !== [...RUNS].sort().join(',')) bad.push(`${u.id} ${u.label}: runs ${Object.keys(u.runs).join(',') || 'none'}, not ${RUNS.join(',')}`);
    if (u.done !== RUNS.length) bad.push(`${u.id} ${u.label}: the done line says ${u.done} runs, not ${RUNS.length}`);
  }
  return bad;
}
export const traceName = (id, label) => `${id.replace(/ /g, '_')}-${label.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
export const traceAgrees = (j, ST, label, sim) => !!(j && ST && j.stamp && j.N === N && String(j.seed) === SEED && j.arm === label && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);

const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const legText = x => `${x.label} ${x.k.saved} saved/${x.k.lost} lost ${f3(x.iv.d)} (exact ${x.iv.lo.toFixed(3)} to ${x.iv.hi.toFixed(3)}; unconditional ${x.un.lo.toFixed(3)} to ${x.un.hi.toFixed(3)}${x.disagree ? ' <-- the readings DISAGREE' : ''}) ${x.o}`;
// the gap's ratio, 15 points over 5; a 5-point gap of 0 (keeps at 0) makes any positive 15-point gap an unbounded rise
export const ratio = (g15, g5) => { const a = gapNum(g15), b = gapNum(g5); return b === 0 ? (a === 0 ? 1 : Infinity) : a / b; };

/*
 * THE ITEMS. `U(id, label)` is a unit (its gap line), `S(id, label, run)` a run's survived array, `SW(id, label, run)` its
 * pension switches a path. The margin is the case's: marginFor() of the case's 5-point /1e-3 survival.
 */
export function items(U, S, SW) {
  const out = [], mar = id => marginFor(survivedShare(S(id, id === 'S194' ? 'OFF@5' : id === 'S126' ? 'READER@5' : 'OFF@5', '1e-3')));
  const leg = (id, la, ra, lb, rb) => ({ id, label: `${id}: ${lb}/${rb} against ${la}/${ra}`, k: cells(S(id, la, ra), S(id, lb, rb)), margin: mar(id) });
  // 1. Q on the reader
  const i1 = ['READER', 'READER+J'].map(a => { const r = ratio(U('share 0.95', `${a}@15`).gap.gap, U('share 0.95', `${a}@5`).gap.gap); return { a, r, moves: gapNum(U('share 0.95', `${a}@15`).gap.gap) > MARGIN }; });
  out.push({ n: 1, text: `Q on the reader: on share 0.95 the year-0 gap rises at least ${TEN}-fold from 5 to 15 points and passes the product's margin (the chooser at 0.001 no longer keeps the plan's tier), with and without one policy (FALSIFIED: less than ${THREE}-fold on both)`,
    extra: i1.map(x => `${x.a}: gap ${U('share 0.95', `${x.a}@5`).gap.gap} at 5 points, ${U('share 0.95', `${x.a}@15`).gap.gap} at 15 (ratio ${Number.isFinite(x.r) ? x.r.toFixed(2) : 'unbounded'}); ${x.moves ? 'above' : 'not above'} the product's margin at 15 points (opens in tier ${U('share 0.95', `${x.a}@15`).gap.open1e3} at 1e-3, ${U('share 0.95', `${x.a}@15`).gap.open0} at 0)`),
    outcome: tri(i1, x => x.r >= TEN && x.moves, x => x.r < THREE) });
  // 2. Q's survival
  const i2 = gainFamily(['READER', 'READER+J'].map(a => leg('share 0.95', `${a}@5`, '1e-3', `${a}@15`, '1e-3')));
  out.push({ n: 2, text: 'Q\'s survival: on share 0.95 the reader at 15 points gains against itself at 5 points, at the product\'s margin, with and without one policy (FALSIFIED: no material gain on both)', legs: i2, outcome: tri(i2, x => x.o === 'gain', x => x.o === 'no material gain') });
  // 3. the control
  const r3 = ratio(U('S126', 'READER@15').gap.gap, U('S126', 'READER@5').gap.gap);
  out.push({ n: 3, text: `the control: S126's reader gap moves by less than a factor of ${TWO} between 5 and 15 points (FALSIFIED: it rises ${TEN}-fold or more)`,
    extra: [`S126 READER: gap ${U('S126', 'READER@5').gap.gap} at 5 points, ${U('S126', 'READER@15').gap.gap} at 15 (ratio ${Number.isFinite(r3) ? r3.toFixed(2) : 'unbounded'})`],
    outcome: r3 < TWO && r3 > 1 / TWO ? 'HELD' : r3 >= TEN ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 4. the freed opening
  const pairs4 = [['S126', 'READER@5'], ['S194', 'OFF@5']];
  const i4 = harmFamily(pairs4.map(([id, l]) => leg(id, l, '0', l, '1e-3+open')));
  const sw4 = pairs4.map(([id, l]) => ({ id, open: SW(id, l, '1e-3+open'), zero: SW(id, l, '0') }));
  const ok4 = i4.map((x, j) => x.o === 'no material harm' && sw4[j].open <= sw4[j].zero / 2);
  out.push({ n: 4, text: 'the freed opening: with the year-0 move freed at the product\'s margin, S126\'s reader and S194\'s off do no material harm against margin 0 and switch at most half as often (FALSIFIED: harm on both)', legs: i4,
    extra: sw4.map(x => `${x.id}: switches a path ${x.open.toFixed(2)} with the opening freed, ${x.zero.toFixed(2)} at margin 0`),
    outcome: ok4.every(Boolean) ? 'HELD' : i4.every(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 5. Q on the product
  const r5 = ratio(U('share 0.95', 'OFF@15').gap.gap, U('share 0.95', 'OFF@5').gap.gap), m5 = gapNum(U('share 0.95', 'OFF@15').gap.gap) > MARGIN;
  out.push({ n: 5, text: `Q on the product: off's year-0 gap on share 0.95 rises at least ${TEN}-fold at 15 points and passes the product's margin (FALSIFIED: less than ${THREE}-fold)`,
    extra: [`share 0.95 OFF: gap ${U('share 0.95', 'OFF@5').gap.gap} at 5 points, ${U('share 0.95', 'OFF@15').gap.gap} at 15 (ratio ${Number.isFinite(r5) ? r5.toFixed(2) : 'unbounded'}); ${m5 ? 'above' : 'not above'} the product's margin at 15 points`],
    outcome: r5 >= TEN && m5 ? 'HELD' : r5 < THREE ? 'FALSIFIED' : 'INCONCLUSIVE' });
  return out;
}

// EACH 15-POINT RUN AGAINST ITS 5-POINT TWIN AT THE SAME MARGIN (reported; the Unmasking field's separating comparison:
// at margin 0 both twins open by the chooser's best, so what differs there is the return points beyond the opening)
export const TWINS = UNITS.filter(([, l]) => l.endsWith('@15')).map(([id, l]) => [id, l, l.replace('@15', '@5')]);
export const quadPairs = S => TWINS.flatMap(([id, l15, l5]) => RUNS.map(run => ({ id, run, l15, l5, k: cells(S(id, l5, run), S(id, l15, run)) })));
// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (label) => `mix 3 pts 30 seed 7002 paths 3000 grid total30x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot 29000 quad ${quadOf(label)} finalIntegral true bridgeRead ${label.startsWith('READER') ? 'reader' : 'false'}`;
  const unitText = (id, label, { gap = '2.0000e-4', open = '0,2', ran = ranOf(label), runs = RUNS, done = RUNS.length, margin = '0.001' } = {}) => [
    `${id.padEnd(16)} case | unit ${label} | lambda ${LAMBDA} tier own riskAbove auto mix 3`,
    `${''.padEnd(16)} solve ${label}: table 90.00 secs 1`, `${''.padEnd(16)} ran ${label}: ${ran}`, `${''.padEnd(16)} gap ${label}: ${gap} opening ${open}`,
    `${''.padEnd(16)} joint ${label}: ${label.includes('+J')} switchMargin ${margin} scale 1 cap 1 deathTax 0 tier own riskAbove ${DECIDED}`,
    ...runs.map(r => `${''.padEnd(16)} run ${label}/${r}: sim 90.0000 below 1.00 tier-below 1.00 estate 1 secs 1`), `${''.padEnd(16)} done ${done} runs`].join('\n');
  const good = () => UNITS.map(([id, l]) => unitText(id, l)).join('\n');
  const g0 = gate(parse(good()));
  cases.push(['a log parsed and gated: nine units, the gate passes', `${parse(good()).length} ${g0.length}`, '9 0']);
  const bent = (id, label, o) => UNITS.map(([i, l]) => unitText(i, l, i === id && l === label ? o : {})).join('\n');
  cases.push(['the gate refuses 16 points on one unit', String(gate(parse(bent('S126', 'READER@15', { ran: ranOf('READER@15').replace('pts 30', 'pts 16').replace('total30x6x6', 'total16x6x6') }))).length > 0), 'true']);
  cases.push(['the gate reads the points alone (S194, its only unit, the grid unchanged)', String(gate(parse(bent('S194', 'OFF@5', { ran: ranOf('OFF@5').replace('pts 30', 'pts 16') }))).length > 0), 'true']);
  cases.push(['the gate refuses the wrong return points for the label', String(gate(parse(bent('share 0.95', 'READER@15', { ran: ranOf('READER@15').replace('quad 15', 'quad 5') }))).length > 0), 'true']);
  cases.push(['the gate refuses the wrong seed', String(gate(parse(bent('S194', 'OFF@5', { ran: ranOf('OFF@5').replace('seed 7002', 'seed 7013') }))).length > 0), 'true']);
  cases.push(['the gate refuses a second setting changed within a case (the minimum pot, which no field check reads)', String(gate(parse(bent('share 0.95', 'OFF@5', { ran: ranOf('OFF@5').replace('minPot 29000', 'minPot 30000') }))).length > 0), 'true']);
  cases.push(['the gate refuses a missing run, the done line full', String(gate(parse(bent('share 0.95', 'OFF@15', { runs: ['1e-3', '0'] }))).length > 0), 'true']);
  cases.push(['the gate refuses a short done line, every run present', String(gate(parse(bent('share 0.95', 'OFF@15', { done: 2 }))).length > 0), 'true']);
  cases.push(['the gate refuses a missing unit', String(gate(parse(UNITS.slice(1).map(([id, l]) => unitText(id, l)).join('\n'))).length > 0), 'true']);
  cases.push(['the gate refuses a solve at another margin', String(gate(parse(bent('S126', 'READER@5', { margin: '0' }))).length > 0), 'true']);
  cases.push(['the gate refuses a unit with no gap line', String(gate(parse(good().split('\n').filter((l, i, L) => !(/^\s+gap OFF@5: /.test(l) && L.slice(0, i).reverse().find(x => / case \| /.test(x)).startsWith('S194'))).join('\n'))).length > 0), 'true']);
  // a trace: count, seed, arm, stamp and survival within half the last printed place
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, j = { N, seed: 7002, arm: 'OFF@5/0', sim: 90.03333333, stamp: { ...ST } };
    cases.push(['a trace agrees within 0.00005 of its four-decimal line, and no further', [traceAgrees(j, ST, 'OFF@5/0', 90.0333), traceAgrees({ ...j, sim: 90.03335 }, ST, 'OFF@5/0', 90.0334), traceAgrees(j, ST, 'OFF@5/0', 90.0335), traceAgrees({ ...j, seed: 7013 }, ST, 'OFF@5/0', 90.0333), traceAgrees(j, ST, 'OFF@5/1e-3', 90.0333)].join(','), 'true,true,false,false,false']); }
  cases.push(['the gap as logged: 0, >1 and a number; the ratio unbounded from 0', `${gapNum('0')} ${gapNum('>1')} ${gapNum('2.5e-4')} ${ratio('2.5e-3', '0')} ${ratio('0', '0')} ${ratio('2.3e-3', '2.3e-4').toFixed(2)}`, '0 Infinity 0.00025 Infinity 1 10.00']);
  // the items on planted stories: arrays of survived paths built from counts against a reference
  const mkS = spec => (id, label, run) => { const k = spec[`${id}|${label}|${run}`] || [0, 0]; const a = new Uint8Array(N).fill(1); for (let i = 0; i < 100; i++) a[i] = 0; for (let i = 0; i < k[0]; i++) a[i] = 1; for (let i = 100; i < 100 + k[1]; i++) a[i] = 0; return a; };
  const mkU = gaps => (id, label) => ({ gap: gaps[`${id}|${label}`] || { gap: '1.0000e-3', open1e3: 0, open0: 2 } });
  const SWf = sw => (id, l, run) => sw[`${id}|${l}|${run}`] ?? 1;
  const qGaps = { 'share 0.95|READER@5': { gap: '2.2992e-4', open1e3: 0, open0: 2 }, 'share 0.95|READER@15': { gap: '2.5000e-2', open1e3: 2, open0: 2 }, 'share 0.95|READER+J@5': { gap: '1.1926e-4', open1e3: 0, open0: 2 }, 'share 0.95|READER+J@15': { gap: '2.0000e-2', open1e3: 2, open0: 2 },
    'S126|READER@5': { gap: '8.0241e-4', open1e3: 0, open0: 2 }, 'S126|READER@15': { gap: '9.0000e-4', open1e3: 0, open0: 2 }, 'share 0.95|OFF@5': { gap: '4.3068e-5', open1e3: 0, open0: 2 }, 'share 0.95|OFF@15': { gap: '1.0000e-2', open1e3: 2, open0: 2 } };
  const qS = { 'share 0.95|READER@15|1e-3': [70, 0], 'share 0.95|READER+J@15|1e-3': [70, 0], 'S126|READER@5|1e-3+open': [0, 0], 'S194|OFF@5|1e-3+open': [0, 0] };
  const qSW = { 'S126|READER@5|1e-3+open': 0.7, 'S126|READER@5|0': 5.0, 'S194|OFF@5|1e-3+open': 0.8, 'S194|OFF@5|0': 4.0 };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  cases.push(['Q as the sixth deep review expects: 1, 2, 3, 4 and 5 HELD', outs(items(mkU(qGaps), mkS(qS), SWf(qSW))), '1 HELD, 2 HELD, 3 HELD, 4 HELD, 5 HELD']);
  const noQ = { ...qGaps, 'share 0.95|READER@15': { gap: '2.4000e-4', open1e3: 0, open0: 2 }, 'share 0.95|READER+J@15': { gap: '1.2000e-4', open1e3: 0, open0: 2 }, 'share 0.95|OFF@15': { gap: '5.0000e-5', open1e3: 0, open0: 2 } };
  cases.push(['no Q: the gaps unmoved and no gain: 1, 2 and 5 FALSIFIED', outs(items(mkU(noQ), mkS({ ...qS, 'share 0.95|READER@15|1e-3': [0, 0], 'share 0.95|READER+J@15|1e-3': [0, 0] }), SWf(qSW))), '1 FALSIFIED, 2 FALSIFIED, 3 HELD, 4 HELD, 5 FALSIFIED']);
  cases.push(['a gap rising tenfold but still under the product\'s margin is not item 1 HELD', items(mkU({ ...qGaps, 'share 0.95|READER@5': { gap: '5.0000e-5', open1e3: 0, open0: 2 }, 'share 0.95|READER@15': { gap: '6.0000e-4', open1e3: 0, open0: 2 } }), mkS(qS), SWf(qSW))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['the reader\'s gap exactly at the product\'s margin does not pass it', items(mkU({ ...qGaps, 'share 0.95|READER@5': { gap: '5.0000e-5', open1e3: 0, open0: 2 }, 'share 0.95|READER+J@5': { gap: '5.0000e-5', open1e3: 0, open0: 2 }, 'share 0.95|READER@15': { gap: '1.0000e-3', open1e3: 0, open0: 2 }, 'share 0.95|READER+J@15': { gap: '1.0000e-3', open1e3: 0, open0: 2 } }), mkS(qS), SWf(qSW))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['the gap exactly at the product\'s margin does not pass it', items(mkU({ ...qGaps, 'share 0.95|OFF@5': { gap: '1.0000e-4', open1e3: 0, open0: 2 }, 'share 0.95|OFF@15': { gap: '1.0000e-3', open1e3: 0, open0: 2 } }), mkS(qS), SWf(qSW))[4].outcome, 'INCONCLUSIVE']);
  cases.push(['the control rising tenfold is item 3 FALSIFIED; fourfold INCONCLUSIVE', `${items(mkU({ ...qGaps, 'S126|READER@15': { gap: '9.0000e-3', open1e3: 2, open0: 2 } }), mkS(qS), SWf(qSW))[2].outcome} ${items(mkU({ ...qGaps, 'S126|READER@15': { gap: '3.2000e-3', open1e3: 2, open0: 2 } }), mkS(qS), SWf(qSW))[2].outcome}`, 'FALSIFIED INCONCLUSIVE']);
  cases.push(['the freed opening harming on both is item 4 FALSIFIED; churning as much as 0 is not HELD', `${items(mkU(qGaps), mkS({ ...qS, 'S126|READER@5|1e-3+open': [0, 60], 'S194|OFF@5|1e-3+open': [0, 60] }), SWf(qSW))[3].outcome} ${items(mkU(qGaps), mkS(qS), SWf({ ...qSW, 'S126|READER@5|1e-3+open': 4.0 }))[3].outcome}`, 'FALSIFIED INCONCLUSIVE']);
  cases.push(['the freed opening is read against margin 0: level with 0 while both lose to 1e-3 is item 4 HELD', items(mkU(qGaps), mkS({ ...qS, 'S126|READER@5|0': [0, 60], 'S126|READER@5|1e-3+open': [0, 60], 'S194|OFF@5|0': [0, 60], 'S194|OFF@5|1e-3+open': [0, 60] }), SWf(qSW))[3].outcome, 'HELD']);
  cases.push(['the freed opening harming on one case only is item 4 INCONCLUSIVE', items(mkU(qGaps), mkS({ ...qS, 'S126|READER@5|1e-3+open': [0, 60] }), SWf(qSW))[3].outcome, 'INCONCLUSIVE']);
  cases.push(['Q\'s survival: a gain on one leg only is INCONCLUSIVE', items(mkU(qGaps), mkS({ ...qS, 'share 0.95|READER+J@15|1e-3': [0, 0] }), SWf(qSW))[1].outcome, 'INCONCLUSIVE']);
  { const tw = quadPairs(mkS({ 'share 0.95|READER@15|0': [5, 0], 'share 0.95|READER@5|0': [0, 3], 'S126|READER@15|1e-3+open': [0, 2] }));
    const f = (id, l, run) => { const x = tw.find(t => t.id === id && t.l15 === l && t.run === run); return x ? `${x.k.saved}/${x.k.lost}` : 'missing'; };
    cases.push(['the twins: each 15-point run against its 5-point twin at the same margin, and only there', `${tw.length} ${f('share 0.95', 'READER@15', '0')} ${f('share 0.95', 'READER@15', '1e-3')} ${f('S126', 'READER@15', '1e-3+open')} ${f('share 0.95', 'OFF@15', '0')}`, '12 8/0 0/0 0/2 0/0']); }
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const DIR = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : join(HERE, 'results', 'diag7w');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  const units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, l]) => !units.some(u => u.id === id && u.label === l && u.done !== null))) { console.log(`INCOMPLETE - ${units.filter(u => u.done !== null).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  const T = {};
  if (!bad.length) for (const u of units) for (const run of RUNS) {
    const l = `${u.label}/${run}`, f = join(DIR, traceName(u.id, l));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(j, ST, l, u.runs[run].sim)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    const X = decode(j);
    if (Math.abs(survivedShare(X.survived) - u.runs[run].sim) > SIM_TOL) bad.push(`${f}: its survived paths give ${survivedShare(X.survived)}, the run line ${u.runs[run].sim}`);
    T[`${u.id}|${l}`] = X;
  }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const U = (id, label) => units.find(u => u.id === id && u.label === label);
  const S = (id, label, run) => T[`${id}|${label}/${run}`].survived;
  const SW = (id, label, run) => switching(T[`${id}|${label}/${run}`]).perPath;
  console.log(`7W: IS T THE FIVE-POINT RETURN AVERAGE HIDING THE BRIDGE'S LAST YEAR? (predictions/diag-7w.md; ${N} paths of seed ${SEED}; the fair-test gate passed: the stamps, every unit's settings, every run and trace)\n`);
  console.log('EVERY RUN: survival; against the unit\'s own 5-point run at 1e-3 on the same case (the product where the unit is off) saved/lost; pension switches a path; the year-0 gap and the pension tier it opens in at 1e-3 and at 0');
  for (const id of ['share 0.95', 'S126', 'S194']) {
    console.log(`${id}`);
    for (const u of units.filter(x => x.id === id)) {
      const ref = `${u.label.split('@')[0]}@5`;
      console.log(`  ${u.label.padEnd(12)} gap ${u.gap.gap.padEnd(11)} opens ${u.gap.open1e3} at 1e-3, ${u.gap.open0} at 0  (solve ${u.solve.secs} s)`);
      for (const run of RUNS) { const k = cells(S(id, ref, '1e-3'), S(id, u.label, run)); console.log(`    ${`${u.label}/${run}`.padEnd(22)} ${u.runs[run].sim.toFixed(4).padStart(8)}  ${`${k.saved}/${k.lost}`.padStart(9)}  switches ${SW(id, u.label, run).toFixed(2)}`); }
    }
  }
  console.log('\nEACH 15-POINT RUN AGAINST ITS 5-POINT TWIN AT THE SAME MARGIN (reported: saved/lost at 15 points, the exact interval beside)');
  for (const x of quadPairs(S)) { const iv = survivalChange(x.k.lost, x.k.saved, x.k.N, 0.05); console.log(`  ${x.id.padEnd(11)} ${`${x.l15}/${x.run} against ${x.l5}/${x.run}`.padEnd(44)} ${`${x.k.saved}/${x.k.lost}`.padStart(9)}  ${f3(iv.d)} (exact ${iv.lo.toFixed(3)} to ${iv.hi.toFixed(3)})`); }
  const it = items(U, S, SW);
  console.log('\nTHE ITEMS (each a Holm family of its own where it tests paths, the regimen\'s reading deciding, the unconditional one beside it; the gap items by their registered ratios)');
  for (const x of it) {
    console.log(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs || []) console.log(`     ${legText(l)}`);
    for (const e of x.extra || []) console.log(`     ${e}`);
  }
  console.log(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
}
