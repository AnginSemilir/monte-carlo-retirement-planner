/*
 * 7AA'S REDUCER (predictions/diag-7aa.md; PLAN.md 7aa): does the joint tier state (TS+J: tierState with jointWorlds, the
 * chooser's full rule on the mixture) gain where the per-world tier state (TS, 7y's) did not, with the pot's weight off (0:
 * survival decides) and on (0.02, the solver's default: the whole score decides, within a survival limit)? The maintainer's
 * go-ahead, 28 Sep; the deep review on both reads (02:38 UK); O41, O42, O43. Reads the thirty unit logs of audit-s126.mjs
 * diag7aa (results/diag7aa/case0-29.txt) and every run's trace.
 * THE STAMP GATE: fair-gate.mjs's requireFairLogs. THE FAIR-TEST GATE (before any figure): every registered unit present once
 * (five cases, two estate weights, three arms); each solve's ran line at the registered settings (30 points, seed 7002, 8,000
 * paths, lambda held, the exact final year, 5 return points, the bridge read as registered, the estate weight as the unit
 * names it); the tier state on the TS and TS+J solves alone, one policy for every world on TS+J alone; no held tier, no Q's
 * fix, no reader reference; every solve of one case differing in nothing but the tier state and the estate weight; the
 * solved margin the product's; the plan's tier and the risk-above decision as registered; a gap line, a joint line, three
 * world lines (1,000 paths each), a run line and a done line on every unit; every trace agreeing with its log in count, seed,
 * arm, stamp and survival.
 * THE ITEMS, each read by the regimen's rule (exact tests against the case's margin, Holm over the item's legs, three
 * outcomes); at the weight 0.02 the whole score by its registered rule (below):
 *   1. W0, the gain: on S126 (reader) and S194 (off), TS+J gains against PRODUCT by survival
 *   2. W0, the per-world rule (O41): on S126 and S194, TS+J gains against TS by survival
 *   3. W0, no harm: on bridge 4 (reader), S360 (reader) and S360 (off), TS+J shows no material harm against PRODUCT
 *   4. W0.02, the gain by the whole score within the survival limit: on S126 and S194, TS+J against PRODUCT
 *   5. W0.02, O42, TS's losses: pooled over S126, S194 and bridge 4, on the paths PRODUCT survives at 0.02, TS+J survives
 *      more than TS (TS+J against TS by survival, the pooled margin 0.1: stats.mjs MARGINS.pooled). Read on the product's
 *      survivors so that the opening's saves, which fall on paths the product fails (7w's freed opening: 15 and 16 saved, 0
 *      lost, results-7w.txt), cannot carry it (the plan-auditor on the 7aa registration, 28 Sep, BLOCKING 2)
 *   6. W0.02, no harm: on bridge 4, S360 (reader) and S360 (off), TS+J shows no material harm against PRODUCT by survival
 * THE WHOLE-SCORE RULE (items 4, and printed beside every leg): the whole score per path is reduce-7t.mjs's (survival, the
 * capped estate at the run's own estate weight, the dislike of cuts, the raise credit), paired on the same paths. Its change
 * is split into the survival part (100 x (saved - lost) / N, read UNCONDITIONALLY: stats.mjs survivalChangeU with
 * reduce-7v.mjs's one-sided guard, the plan's corrected form, drafts/whole-score-rule.md row 1) and the rest (estate, cuts
 * and raises, bounded per path: the paired mean with its normal interval); each part's interval is taken at half the leg's
 * error rate and the two are added. The union bound gives the whole interval 1 - the leg's rate only as far as each part
 * holds its own: the unconditional interval is not exact (results-sim-unconditional.txt: at or below its rate from 95% to
 * 99.8% survival but 4.1% against 2.5% at 95% and 8,000 paths, a little high below 95%) and the rest's interval is normal,
 * so the planted calibration check measures the rule at the margin on S126- and S194-like legs instead of claiming it. The
 * exact (conditional) survival part, the form registered first, is printed beside, marked where the two read differently:
 * its no-material ends are the point estimate with one-sided changes (stats.mjs survivalChange's comment). The leg's rate
 * is 0.05 over the item's legs (Bonferroni: Holm's step-down needs p-values the added interval does not give, and
 * Bonferroni is at least as strict). A leg GAINS when the whole interval's lower end is above 0 and survival shows no
 * material harm by the unconditional interval (its lower end above minus the margin); shows NO MATERIAL GAIN when the whole
 * interval's upper end is below the case's margin; HARM when survival reads harm (the survival limit: harmFamily's exact
 * McNemar under Holm over the item's legs, the point loss at least the margin); else inconclusive.
 * Reported, not items: every run's survival, saved/lost against PRODUCT, switches, years below the plan's tier, estate; each
 * solve's gap and opening; each world's table against its run (the calibration by world, rule 4); the whole score by
 * long-run shift slice; the path-years the tier state holds a riskier or a safer tier than PRODUCT; S194's paths holding 1/1
 * in year 1; the whole score beside survival at W0.
 *   node research/solver/reduce-7aa.mjs [dir] > research/solver/results-7aa.txt
 *   node research/solver/reduce-7aa.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { marginFor, survivalChange, survivalChangeU, clopperPearson, zFor, mcnemarHarmP, MARGINS } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode, scorePaths, MU, Z_BINS, binOf } from './reduce-7t.mjs';
import { switching } from './read-7t-deep.mjs';
import { cells, harmFamily, gainFamily, survivedShare } from './reduce-7v.mjs';
import { pathsForSeed } from '../engine.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7aa.md';
export const N = 8000, WP = 1000, PTS = '30', SEED = '7002', LAMBDA = '0.0223606797749979', LEVELS = '1,1.1,0.95,0.9,0.8';
export const SIM_TOL = 5e-5 + 1e-9, ALPHA = 0.05;
export const DECIDED = 'off:_no_tier_above_the_plan';
export const WEIGHTS = ['0', '0.02'], TAGS = ['PRODUCT', 'TS', 'TS+J'];
export const CASE_ARMS = [['S126', 'READER'], ['S194', 'OFF'], ['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']];
export const POOL5 = [['S126', 'READER'], ['S194', 'OFF'], ['bridge 4', 'READER']];
export const label = (tag, w) => `${tag}/W${w}`;
// the registered units: [case, arm, label], in audit-s126.mjs diag7aa's order (weight, case, arm)
export const UNITS = WEIGHTS.flatMap(w => CASE_ARMS.flatMap(([id, a]) => TAGS.map(t => [id, a, label(t, w)])));

const CASEL = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \| lambda (\S+) tier (\S+) riskAbove (\S+) mix (\S+)$/;
const SOLVEL = /^\s+solve (\S+?)\/(\S+): table (\S+) secs (\S+)$/;
const RANL = /^\s+ran (\S+?)\/(\S+): (.*)$/;
const GAPL = /^\s+gap (\S+?)\/(\S+): (\S+) opening (\d+),(\d+)$/;
const JOINTL = /^\s+joint (\S+?)\/(\S+): (true|false) switchMargin (\S+) scale (\S+) cap (\S+) deathTax (\S+) tier (\S+) riskAbove (\S+)$/;
const WORLDL = /^\s+world (\S+?)\/(\S+) (\d+) z (\S+) weight (\S+): table (\S+) sim (\S+) paths (\d+)$/;
const RUNL = /^\s+run (\S+?)\/(\S+): sim (\S+) below (\S+) tier-below (\S+) changes (\S+) estate (\S+) secs (\S+)$/;
export const field = (ran, k) => { const m = new RegExp(`(?:^|\\s)${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };

export function parse(text) {
  const units = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), arm: m[2], label: m[3], lambda: m[4], tier: m[5], riskAbove: m[6], mix: m[7], worlds: [], done: false }; units.push(cur); continue; }
    if (!cur) continue;
    const mine = x => x[1] === cur.arm && x[2] === cur.label;
    if ((m = SOLVEL.exec(line)) && mine(m)) { cur.table = m[3]; cur.secs = +m[4]; continue; }
    if ((m = RANL.exec(line)) && mine(m)) { cur.ran = m[3]; continue; }
    if ((m = GAPL.exec(line)) && mine(m)) { cur.gap = { gap: m[3], open1e3: +m[4], open0: +m[5] }; continue; }
    if ((m = JOINTL.exec(line)) && mine(m)) { cur.joint = { joint: m[3] === 'true', margin: m[4], scale: +m[5], cap: +m[6], deathTax: +m[7], tier: m[8], decided: m[9] }; continue; }
    if ((m = WORLDL.exec(line)) && mine(m)) { cur.worlds[+m[3]] = { z: +m[4], w: +m[5], table: +m[6], sim: +m[7], paths: +m[8] }; continue; }
    if ((m = RUNL.exec(line)) && mine(m)) { cur.run = { sim: +m[3], below: +m[4], tier: +m[5], changes: +m[6], estate: +m[7], secs: +m[8] }; continue; }
    if (line.trim() === `done ${cur.arm}/${cur.label}`) { cur.done = true; continue; }
  }
  return units;
}
const tagOf = l => l.split('/W')[0], weightOf = l => l.split('/W')[1];
export function gate(units) {
  const bad = [];
  for (const [id, arm, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === arm && u.label === l).length; if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }
  // a solve's settings but the tier state and the estate weight, for the within-case comparison
  const strip = s => (s || '').replace(/ tierState \S+/, '').replace(/ bequestWeight \S+/, '');
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    const t = tagOf(u.label), w = weightOf(u.label);
    if (u.table === undefined) bad.push(`${tag}: no solve line`);
    if (!u.ran) bad.push(`${tag}: no ran line`);
    else {
      const want = { mix: '3', pts: PTS, seed: SEED, paths: String(N), grid: `total${PTS}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', tiersAbove: '0', quad: '5', finalIntegral: 'true', bridgeRead: u.arm === 'READER' ? 'reader' : 'false', bequestWeight: w };
      for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ${k} is ${field(u.ran, k)}, the prediction names ${v}`);
      if (!!field(u.ran, 'tierState') !== (t !== 'PRODUCT')) bad.push(`${tag}: ran tierState ${field(u.ran, 'tierState')}`);
      for (const k of ['holdTier', 'bridgeStep', 'readerRef']) if (field(u.ran, k) !== null) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}`);
    }
    if (!u.gap) bad.push(`${tag}: no year-0 gap line`);
    if (!u.joint) bad.push(`${tag}: no joint line`);
    else {
      if (u.joint.joint !== (t === 'TS+J')) bad.push(`${tag}: ran jointWorlds ${u.joint.joint}`);
      if (u.joint.margin !== '0.001') bad.push(`${tag}: solved with switch margin ${u.joint.margin}`);
      if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax}`);
      if (u.joint.tier !== 'own' || u.joint.decided !== DECIDED) bad.push(`${tag}: plan tier ${u.joint.tier}, risk above ${u.joint.decided}`);
    }
    if (u.worlds.length !== 3 || [0, 1, 2].some(k => !u.worlds[k] || u.worlds[k].paths !== WP)) bad.push(`${tag}: world lines ${u.worlds.filter(Boolean).length}, not 3 of ${WP} paths`);
    if (!u.run) bad.push(`${tag}: no run line`);
    if (!u.done) bad.push(`${tag}: no done line`);
    // every solve of the case, at both weights and in every arm, differs in nothing but the tier state and the estate weight
    const ref = units.find(v => v.id === u.id && v.arm === u.arm && v.ran);
    if (u.ran && ref && strip(u.ran) !== strip(ref.ran)) bad.push(`${tag}: differs from another solve of the case beyond the tier state and the estate weight`);
    // and the objective's scale and cap are the case's, whatever the arm or weight
    const refJ = units.find(v => v.id === u.id && v.arm === u.arm && v.joint);
    if (u.joint && refJ && (u.joint.scale !== refJ.joint.scale || u.joint.cap !== refJ.joint.cap)) bad.push(`${tag}: scale or cap differs within the case`);
  }
  return bad;
}
export const traceName = (id, arm, l) => `${id.replace(/ /g, '_')}-${arm.toLowerCase()}-${l.toLowerCase().replace(/\+/g, '_').replace(/\//g, '@')}.json.gz`;
export const traceAgrees = (j, ST, arm, l, sim) => !!(j && ST && j.stamp && j.N === N && String(j.seed) === SEED && j.arm === `${arm}/${l}` && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);

/* the whole score per path at a run's own estate weight (reduce-7t.mjs's scorePaths, its estate weight a parameter) */
export function wholePaths(T, { lambda, floor, scale, cap, spendYears, wb }) {
  const out = new Float64Array(T.N);
  for (let i = 0; i < T.N; i++) {
    let cut = 0, raise = 0;
    for (let t = 0; t < T.Y; t++) { const l = T.level[i * T.Y + t] / 100; if (l > 0 && l < 1) cut += lambda * (1 - l) ** 2; else if (l > 1) raise += MU * Math.sqrt(Math.min(0.2, l - 1)); }
    if (T.failYear[i] >= 0) for (let t = T.failYear[i]; t < T.Y; t++) if (spendYears[t]) cut += lambda * (1 - floor) ** 2;
    const alive = T.survived[i] === 1, est = alive ? Math.min(T.wealth[i * T.Y + T.Y - 1], cap) : 0;
    out[i] = 100 * ((alive ? 1 : 0) + wb * est / scale - cut + (alive ? raise : 0));
  }
  return out;
}
// reduce-7v.mjs guarded() (read-o27-unconditional.mjs's, O27), copied: the unconditional interval, its end on a one-sided
// side held at least as far out as the exact bound on that count of N
const cpMemo = new Map();
const cpUpper = (k, n, level) => { const key = `${k}|${n}|${level}`; if (!cpMemo.has(key)) cpMemo.set(key, clopperPearson(k, n, level)[1]); return cpMemo.get(key); };
export function guarded(u, lost, saved, n, level) {
  const bh = -100 * cpUpper(lost, n, level), bg = 100 * cpUpper(saved, n, level);
  return { ...u, lo: saved === 0 ? Math.min(u.lo, bh) : u.lo, hi: lost === 0 ? Math.max(u.hi, bg) : u.hi };
}
/* THE WHOLE INTERVAL from a leg's paired survival cells k and the rest's mean and standard error, at error rate a: the
   survival part unconditionally (guarded), the rest by its normal interval, each at a/2, added; the exact (conditional)
   form beside (exLo, exHi) */
export function wholeFrom(k, rest, restSe, a) {
  const sv = guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, a / 2), k.lost, k.saved, k.N, a / 2), ex = survivalChange(k.lost, k.saved, k.N, a / 2), z = zFor(a / 2);
  return { d: sv.d + rest, lo: sv.lo + rest - z * restSe, hi: sv.hi + rest + z * restSe, sd: sv.d, rest, restSe, k, exLo: ex.lo + rest - z * restSe, exHi: ex.hi + rest + z * restSe };
}
/* THE WHOLE-SCORE LEG: B against A on the same paths at error rate a (wholeFrom on the paths' cells and the rest). Returns
   the change, its interval and its parts. */
export function wholeLeg(A, B, cfg, a) {
  const sa = wholePaths(A, cfg), sb = wholePaths(B, cfg), k = cells(A.survived, B.survived);
  let m = 0; const d = new Float64Array(A.N);
  for (let i = 0; i < A.N; i++) { d[i] = (sb[i] - 100 * B.survived[i]) - (sa[i] - 100 * A.survived[i]); m += d[i]; }
  m /= A.N; let v = 0; for (let i = 0; i < A.N; i++) v += (d[i] - m) ** 2;
  return wholeFrom(k, m, Math.sqrt(v / (A.N - 1) / A.N), a);
}
// THE PAIRED CELLS of B against A on the paths P survives alone (item 5: TS's losses against the product)
export function cellsWhere(P, A, B) {
  let a = 0, lost = 0, saved = 0, d = 0, n = 0;
  for (let i = 0; i < P.length; i++) { if (!P[i]) continue; n++; if (A[i] && B[i]) a++; else if (A[i]) lost++; else if (B[i]) saved++; else d++; }
  return { a, lost, saved, d, N: n };
}

const tri = (xs, yes, no) => (xs.every(yes) ? 'HELD' : xs.every(no) ? 'FALSIFIED' : 'INCONCLUSIVE');
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const legText = x => `${x.label} ${x.k.saved} saved/${x.k.lost} lost ${f3(x.iv.d)} (exact ${x.iv.lo.toFixed(3)} to ${x.iv.hi.toFixed(3)}; unconditional ${x.un.lo.toFixed(3)} to ${x.un.hi.toFixed(3)}${x.disagree ? ' <-- the readings DISAGREE' : ''}) ${x.o}`;
const wholeText = x => `${x.label}: whole ${f3(x.w.d)} (unconditional ${x.w.lo.toFixed(3)} to ${x.w.hi.toFixed(3)}; exact ${x.w.exLo.toFixed(3)} to ${x.w.exHi.toFixed(3)}; survival part ${f3(x.w.sd)}, the rest ${f3(x.w.rest)} +/- ${x.w.restSe.toFixed(3)}); survival ${x.w.k.saved}/${x.w.k.lost} ${x.surv} (exact ${x.survEx}); ${x.o}${x.o !== x.oEx ? ` <-- the exact form reads ${x.oEx}` : ''}`;

/*
 * THE ITEMS. `S(id, arm, l)` is a run's survived array; `WL(id, arm, lb, la, a)` the whole-score leg of lb against la at
 * error rate a (wholeLeg on the traces, the estate weight the runs'). The margin is the case's: marginFor() of PRODUCT's
 * survival at the leg's weight.
 */
export function items(S, WL) {
  const out = [], mar = (id, arm, w) => marginFor(survivedShare(S(id, arm, label('PRODUCT', w))));
  const leg = (id, arm, b, a, w) => ({ id, label: `${id} (${arm.toLowerCase()}): ${b} against ${a} at W${w}`, k: cells(S(id, arm, label(a, w)), S(id, arm, label(b, w))), margin: mar(id, arm, w) });
  const two = [['S126', 'READER'], ['S194', 'OFF']], harmLegs = [['bridge 4', 'READER'], ['S360', 'READER'], ['S360', 'OFF']];
  // 1. W0, the gain by survival
  const i1 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS+J', 'PRODUCT', '0')));
  out.push({ n: 1, text: 'W0, the gain: on S126 (reader) and S194 (off), TS+J gains against PRODUCT by survival (FALSIFIED: no material gain on both)', legs: i1, outcome: tri(i1, x => x.o === 'gain', x => x.o === 'no material gain') });
  // 2. W0, the per-world rule
  const i2 = gainFamily(two.map(([id, arm]) => leg(id, arm, 'TS+J', 'TS', '0')));
  out.push({ n: 2, text: 'W0, the per-world rule (O41): on S126 and S194, TS+J gains against TS by survival (FALSIFIED: no material gain on both)', legs: i2, outcome: tri(i2, x => x.o === 'gain', x => x.o === 'no material gain') });
  // 3. W0, no harm
  const i3 = harmFamily(harmLegs.map(([id, arm]) => leg(id, arm, 'TS+J', 'PRODUCT', '0')));
  out.push({ n: 3, text: 'W0, no harm: on bridge 4 (reader), S360 (reader) and S360 (off), TS+J shows no material harm against PRODUCT (FALSIFIED: harm on any)', legs: i3, outcome: i3.every(x => x.o === 'no material harm') ? 'HELD' : i3.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 4. W0.02, the gain by the whole score within the survival limit
  const a4 = ALPHA / two.length, s4 = harmFamily(two.map(([id, arm]) => leg(id, arm, 'TS+J', 'PRODUCT', '0.02')));
  const read4 = (surv, lo, hi, m) => (surv === 'harm' ? 'harm (the survival limit)' : lo > 0 && surv === 'no material harm' ? 'gain' : hi < m ? 'no material gain' : 'inconclusive');
  const i4 = two.map(([id, arm], j) => {
    const w = WL(id, arm, label('TS+J', '0.02'), label('PRODUCT', '0.02'), a4), m = s4[j].margin, survEx = s4[j].o;
    const surv = survEx === 'harm' ? 'harm' : s4[j].un.lo > -m ? 'no material harm' : 'inconclusive';
    return { label: `${id} (${arm.toLowerCase()}): TS+J against PRODUCT at W0.02`, w, surv, survEx, margin: m, o: read4(surv, w.lo, w.hi, m), oEx: read4(survEx, w.exLo, w.exHi, m) };
  });
  out.push({ n: 4, text: 'W0.02, the gain by the whole score within the survival limit: on S126 and S194, TS+J against PRODUCT (FALSIFIED: no material gain or survival harm on both)', whole: i4, outcome: tri(i4, x => x.o === 'gain', x => x.o === 'no material gain' || x.o.startsWith('harm')) });
  // 5. W0.02, O42, TS's losses: pooled TS+J against TS on the paths PRODUCT survives
  const pool = POOL5.map(([id, arm]) => cellsWhere(S(id, arm, label('PRODUCT', '0.02')), S(id, arm, label('TS', '0.02')), S(id, arm, label('TS+J', '0.02'))));
  const kp = pool.reduce((t, k) => ({ a: t.a + k.a, lost: t.lost + k.lost, saved: t.saved + k.saved, d: t.d + k.d, N: t.N + k.N }), { a: 0, lost: 0, saved: 0, d: 0, N: 0 });
  const i5 = gainFamily([{ id: 'pooled', label: 'pooled over S126, S194 and bridge 4, on the paths PRODUCT survives: TS+J against TS at W0.02', k: kp, margin: MARGINS.pooled }]);
  out.push({ n: 5, text: 'W0.02, O42, TS\'s losses: pooled over S126, S194 and bridge 4, on the paths PRODUCT survives at 0.02, TS+J survives more than TS (FALSIFIED: no material gain, the pooled margin 0.1)', legs: i5, cases: pool, outcome: i5[0].o === 'gain' ? 'HELD' : i5[0].o === 'no material gain' ? 'FALSIFIED' : 'INCONCLUSIVE' });
  // 6. W0.02, no harm on the harm legs
  const i6 = harmFamily(harmLegs.map(([id, arm]) => leg(id, arm, 'TS+J', 'PRODUCT', '0.02')));
  out.push({ n: 6, text: 'W0.02, no harm: on bridge 4 (reader), S360 (reader) and S360 (off), TS+J shows no material harm against PRODUCT by survival (FALSIFIED: harm on any)', legs: i6, outcome: i6.every(x => x.o === 'no material harm') ? 'HELD' : i6.some(x => x.o === 'harm') ? 'FALSIFIED' : 'INCONCLUSIVE' });
  return out;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (id, arm, l) => `mix 3 pts 30 seed 7002 paths ${N} grid total30x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot ${id === 'S194' ? 80000 : 29000} quad 5${tagOf(l) !== 'PRODUCT' ? ' tierState 0/0,1/1,2/2' : ''} bequestWeight ${weightOf(l)} finalIntegral true bridgeRead ${arm === 'READER' ? 'reader' : 'false'}`;
  const unitText = (id, arm, l, o = {}) => {
    const p = ''.padEnd(16), lines = [`${id.padEnd(16)} case | unit ${arm}/${l} | lambda ${LAMBDA} tier own riskAbove auto mix 3`];
    if (!o.noSolve) lines.push(`${p} solve ${arm}/${l}: table ${o.table || '90.0000'} secs 1`);
    lines.push(`${p} ran ${arm}/${l}: ${o.ran || ranOf(id, arm, l)}`);
    if (!o.noGap) lines.push(`${p} gap ${arm}/${l}: 2.0000e-4 opening 0,2`);
    lines.push(`${p} joint ${arm}/${l}: ${o.joint !== undefined ? o.joint : tagOf(l) === 'TS+J'} switchMargin ${o.margin || '0.001'} scale ${o.scale || 950000} cap 3800000 deathTax 0 tier own riskAbove ${DECIDED}`);
    for (let k = 0; k < (o.worlds !== undefined ? o.worlds : 3); k++) lines.push(`${p} world ${arm}/${l} ${k} z 0.0000 weight 0.3333: table 90.0000 sim 90.0000 paths ${o.wp || WP}`);
    if (!o.noRun) lines.push(`${p} run ${arm}/${l}: sim 90.0000 below 1.00 tier-below 1.00 changes 0.100 estate 1 secs 1`);
    if (!o.noDone) lines.push(`${p} done ${arm}/${l}`);
    return lines.join('\n');
  };
  const good = () => UNITS.map(([id, a, l]) => unitText(id, a, l)).join('\n');
  cases.push(['a log parsed and gated: thirty units, the gate passes', `${parse(good()).length} ${gate(parse(good())).length}`, '30 0']);
  const bent = (id, arm, l, o) => UNITS.map(([i, a, x]) => unitText(i, a, x, i === id && a === arm && x === l ? o : {})).join('\n');
  const refused = t => String(gate(parse(t)).length > 0);
  const allBent = f => UNITS.map(([id, a, l]) => unitText(id, a, l, { ran: f(ranOf(id, a, l)) })).join('\n');
  const TJ2 = label('TS+J', '0.02'), TJ0 = label('TS+J', '0'), TS0 = label('TS', '0'), P0 = label('PRODUCT', '0'), P2 = label('PRODUCT', '0.02');
  cases.push(['the gate refuses 16 points on one solve', refused(bent('S126', 'READER', TJ2, { ran: ranOf('S126', 'READER', TJ2).replace('pts 30', 'pts 16').replace('total30x6x6', 'total16x6x6') })), 'true']);
  cases.push(['the gate refuses the estate weight 0.02 on a W0 unit', refused(bent('S194', 'OFF', TJ0, { ran: ranOf('S194', 'OFF', TJ0).replace('bequestWeight 0 ', 'bequestWeight 0.02 ') })), 'true']);
  cases.push(['the gate refuses the estate weight missing', refused(bent('bridge 4', 'READER', P2, { ran: ranOf('bridge 4', 'READER', P2).replace(' bequestWeight 0.02', '') })), 'true']);
  cases.push(['the gate refuses the tier state missing on a TS solve', refused(bent('S126', 'READER', TS0, { ran: ranOf('S126', 'READER', P0) })), 'true']);
  cases.push(['the gate refuses the tier state on a PRODUCT solve', refused(bent('S360', 'OFF', P2, { ran: ranOf('S360', 'OFF', TJ2) })), 'true']);
  cases.push(['the gate refuses one policy missing on TS+J', refused(bent('S194', 'OFF', TJ2, { joint: false })), 'true']);
  cases.push(['the gate refuses one policy on TS', refused(bent('S126', 'READER', TS0, { joint: true })), 'true']);
  cases.push(['the gate refuses a held tier', refused(bent('S360', 'READER', TS0, { ran: ranOf('S360', 'READER', TS0).replace(' quad 5', ' quad 5 holdTier 0/0') })), 'true']);
  cases.push(['the gate refuses Q\'s fix', refused(bent('S360', 'READER', TJ0, { ran: ranOf('S360', 'READER', TJ0).replace(' finalIntegral', ' bridgeStep exact finalIntegral') })), 'true']);
  cases.push(['the gate refuses the reader\'s held reference', refused(bent('bridge 4', 'READER', TJ0, { ran: ranOf('bridge 4', 'READER', TJ0).replace(' finalIntegral', ' readerRef held finalIntegral') })), 'true']);
  cases.push(['the gate refuses the reader off on a READER unit', refused(bent('S126', 'READER', P0, { ran: ranOf('S126', 'READER', P0).replace('bridgeRead reader', 'bridgeRead false') })), 'true']);
  cases.push(['the gate refuses the reader on an OFF unit', refused(bent('S360', 'OFF', TS0, { ran: ranOf('S360', 'OFF', TS0).replace('bridgeRead false', 'bridgeRead reader') })), 'true']);
  cases.push(['the gate refuses a second setting changed within a case (the minimum pot)', refused(bent('S126', 'READER', TJ2, { ran: ranOf('S126', 'READER', TJ2).replace('minPot 29000', 'minPot 30000') })), 'true']);
  cases.push(['the gate refuses another scale within a case', refused(bent('S194', 'OFF', TS0, { scale: 950001 })), 'true']);
  cases.push(['the gate refuses the wrong seed on every solve', refused(allBent(r => r.replace('seed 7002', 'seed 7013'))), 'true']);
  cases.push(['the gate refuses a held tier on every solve', refused(allBent(r => r.replace(' quad 5', ' quad 5 holdTier 0/0'))), 'true']);
  cases.push(['the gate refuses Q\'s fix on every solve', refused(allBent(r => r.replace(' finalIntegral', ' bridgeStep exact finalIntegral'))), 'true']);
  cases.push(['the gate refuses the held reference on every solve', refused(allBent(r => r.replace(' finalIntegral', ' readerRef held finalIntegral'))), 'true']);
  cases.push(['the gate refuses another path count on every solve', refused(allBent(r => r.replace(`paths ${N}`, 'paths 3000'))), 'true']);
  cases.push(['the gate refuses 16 points on every solve (the grid unchanged)', refused(allBent(r => r.replace('pts 30', 'pts 16'))), 'true']);
  cases.push(['the gate refuses 15 return points on every solve', refused(allBent(r => r.replace('quad 5', 'quad 15'))), 'true']);
  cases.push(['the gate refuses an averaged final year on every solve', refused(allBent(r => r.replace('finalIntegral true', 'finalIntegral false'))), 'true']);
  cases.push(['the gate refuses a missing unit', refused(UNITS.slice(1).map(([id, a, l]) => unitText(id, a, l)).join('\n')), 'true']);
  cases.push(['the gate refuses a unit run twice', refused(good() + '\n' + unitText('S126', 'READER', TJ0)), 'true']);
  cases.push(['the gate refuses a solve at another margin', refused(bent('S194', 'OFF', TJ0, { margin: '0' })), 'true']);
  cases.push(['the gate refuses a missing solve line', refused(bent('bridge 4', 'READER', TS0, { noSolve: true })), 'true']);
  cases.push(['the gate refuses a missing gap line', refused(bent('S360', 'READER', P2, { noGap: true })), 'true']);
  cases.push(['the gate refuses two world lines', refused(bent('S126', 'READER', TJ2, { worlds: 2 })), 'true']);
  cases.push(['the gate refuses four world lines', refused(bent('S360', 'READER', TS0, { worlds: 4 })), 'true']);
  cases.push(['the gate refuses a world of 500 paths', refused(bent('S194', 'OFF', P0, { wp: 500 })), 'true']);
  cases.push(['the gate refuses a missing run line', refused(bent('S360', 'OFF', TJ2, { noRun: true })), 'true']);
  cases.push(['the gate refuses a missing done line', refused(bent('bridge 4', 'READER', TJ2, { noDone: true })), 'true']);
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, j = { N, seed: 7002, arm: `READER/${TJ2}`, sim: 90.03333333, stamp: { ...ST } };
    cases.push(['a trace agrees within 0.00005 of its four-decimal line, and no further', [traceAgrees(j, ST, 'READER', TJ2, 90.0333), traceAgrees({ ...j, sim: 90.03335 }, ST, 'READER', TJ2, 90.0334), traceAgrees(j, ST, 'READER', TJ2, 90.0335), traceAgrees({ ...j, seed: 7013 }, ST, 'READER', TJ2, 90.0333), traceAgrees(j, ST, 'READER', TJ0, 90.0333)].join(','), 'true,true,false,false,false']); }
  cases.push(['the trace name carries the case, the arm, the arm\'s tag and the weight', traceName('bridge 4', 'READER', TJ2), 'bridge_4-reader-ts_j@w0.02.json.gz']);
  // the whole score: wholePaths at 0.02 is reduce-7t.mjs's scorePaths to the bit; the leg's parts add up; the rule's reading
  const mkT = (surv, wealth, levels) => { const Y = levels.length; return { N: surv.length, Y, survived: Uint8Array.from(surv), level: Uint8Array.from(surv.flatMap(() => levels)), wealth: Float32Array.from(surv.flatMap((s, i) => levels.map((_, t) => (t === Y - 1 ? wealth[i] : 0)))), failYear: Int16Array.from(surv.map(s => (s ? -1 : 1))), tier: new Uint8Array(surv.length * Y) }; };
  { const T = mkT([1, 0, 1], [300000, 0, 500000], [100, 90, 100]), cfg = { lambda: 0.1, floor: 0.8, scale: 100000, cap: 400000, spendYears: [true, true, true] };
    const a = scorePaths(T, cfg), b = wholePaths(T, { ...cfg, wb: 0.02 }), c = wholePaths(T, { ...cfg, wb: 0 });
    cases.push(['wholePaths at 0.02 is scorePaths to the bit; at 0 the estate drops out', `${a.every((x, i) => Object.is(x, b[i]))} ${(b[0] - c[0]).toFixed(6)}`, 'true 6.000000']); }
  const mkPair = (n, lost, saved, gainPerPath) => {
    const sa = [], sb = [], wa = [], wb = [];
    for (let i = 0; i < n; i++) { const A = i < lost ? 1 : i < lost + saved ? 0 : 1, B = i < lost ? 0 : 1; sa.push(A); sb.push(B); wa.push(200000); wb.push(200000 + gainPerPath); }
    return [mkT(sa, wa, [100, 100, 100]), mkT(sb, wb, [100, 100, 100])];
  };
  const cfg0 = { lambda: 0.02, floor: 0.8, scale: 100000, cap: 400000, spendYears: [true, true, true], wb: 0.02 };
  { const [A, B] = mkPair(8000, 3, 1, 100000), w = wholeLeg(A, B, cfg0, 0.025);
    cases.push(['a whole-score leg adds its parts: survival -2 paths; the rest +2 points a path, less the 3 lost paths\' estate and failure charge, plus the saved one\'s: 1.9982', `${w.sd.toFixed(4)} ${w.rest.toFixed(4)} ${(w.d - w.sd - w.rest).toFixed(6)}`, '-0.0250 1.9982 0.000000']);
    cases.push(['its interval holds its point and covers both parts\' spreads', String(w.lo < w.d && w.d < w.hi && w.lo > 0), 'true']); }
  { const n = 8000, sa = Array(n).fill(1), wa = Array(n).fill(200000), wb2 = wa.map((x, i) => x + (i % 2 ? 50000 : -50000));
    const w = wholeLeg(mkT(sa, wa, [100, 100, 100]), mkT(sa, wb2, [100, 100, 100]), cfg0, 0.025);
    cases.push(['with survival identical the interval is the rest\'s 2 z se at a/2 plus the unconditional survival part\'s width at no differing path: 2 x 100 z^2/(N + z^2) = 0.1558 at 8,000 (the guard, 100 x 6.342e-4, inside it)', `${((w.hi - w.lo) - 2 * zFor(0.0125) * w.restSe).toFixed(4)} ${w.restSe > 0}`, '0.1558 true']); }
  // the one-sided guard: 3 saved, none lost, 400 failing in both, of 8,000, the rest 0: the upper end is the exact bound on 3 of
  // 8,000 at a/2 (clopperPearson here, beside the reducer's memoised copy), which the Newcombe interval alone falls short of
  { const k = { a: 7597, lost: 0, saved: 3, d: 400, N: 8000 }, w = wholeFrom(k, 0, 0, 0.025), u = survivalChangeU(7597, 0, 3, 400, 0.0125), cp = 100 * clopperPearson(3, 8000, 0.0125)[1];
    cases.push(['the guard holds a one-sided upper end at the exact bound on its count (3 saved of 8,000: Newcombe alone short of it; by hand, the Poisson bound chi2(0.99375, 8 df)/2 = 10.67 of 8,000 = 0.1334 points)', `${u.hi < cp} ${Math.abs(w.hi - cp) < 1e-12} ${cp.toFixed(4)}`, 'true true 0.1334']); }
  // THE CALIBRATION (the plan-auditor on the 7aa registration, BLOCKING 1): a leg whose true whole change sits exactly at the
  // margin 0.25 reads "no material gain" at most at its one-sided rate, a4/2 = 0.0125 (0.005 over it allowed for 2,000
  // draws: about 3 standard errors): S126-like (the rest -0.170 +/- 0.016 at 8,000) and S194-like (-0.068 +/- 0.013), a
  // background of 0.5 and 5 paths each way, the survival part's true change the rest of the margin (net saved paths). The
  // exact form on the same draws (the review measured 0.24 and 0.26 at 0.5) shows the check can fail.
  { let sd = 7002 >>> 0; const rnd = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const pois = m => { const L = Math.exp(-m); let k = 0, q = 1; do { k++; q *= rnd(); } while (q > L); return k - 1; }, gauss = () => { let u = 0; for (let k = 0; k < 12; k++) u += rnd(); return u - 6; };
    const rates = [];
    for (const [rest, se] of [[-0.170, 0.016], [-0.068, 0.013]]) for (const b of [0.5, 5]) {
      const net = (0.25 - rest) * N / 100; let un = 0, ex = 0;
      for (let t = 0; t < 2000; t++) { const sv = pois(net + b), l = pois(b), w = wholeFrom({ a: N - sv - l - 200, lost: l, saved: sv, d: 200, N }, rest + se * gauss(), se, 0.025); if (w.hi < 0.25) un++; if (w.exHi < 0.25) ex++; }
      rates.push([un / 2000, ex / 2000]);
    }
    cases.push([`the calibration at the margin: the rule reads no material gain at most 0.0175 on all four legs, the exact form over 0.1 at the background 0.5 (${rates.map(r => r.map(x => x.toFixed(4)).join('/')).join(', ')})`, `${rates.every(r => r[0] <= 0.0175)} ${rates.filter((r, i) => i % 2 === 0).every(r => r[1] > 0.1)}`, 'true true']); }
  // the items on planted stories: S from counts; WL from a table of whole legs
  const mkS = spec => (id, arm, l) => { const k = spec[`${id}|${arm}|${l}`] || [0, 0]; const a = new Uint8Array(N).fill(1); for (let i = 0; i < 100; i++) a[i] = 0; for (let i = 0; i < k[0]; i++) a[i] = 1; const o = k[2] || 100; for (let i = o; i < o + k[1]; i++) a[i] = 0; return a; };
  const mkW = spec => (id, arm, lb, la) => { const x = spec[`${id}|${lb}`] || { d: 0, lo: -0.1, hi: 0.1 }; return { exLo: x.lo, exHi: x.hi, ...x, sd: 0, rest: x.d, restSe: 0.01, k: { saved: 0, lost: 0 } }; };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  // TS+J works: gains at W0 on both, over TS too; the whole score gains at 0.02; TS+J saves against TS pooled; no harm
  const TS2 = label('TS', '0.02');
  const fsS = { [`S126|READER|${TJ0}`]: [40, 0], [`S194|OFF|${TJ0}`]: [43, 0], [`S126|READER|${TJ2}`]: [30, 0], [`S194|OFF|${TJ2}`]: [30, 0], [`bridge 4|READER|${TJ2}`]: [20, 0], [`S126|READER|${TS2}`]: [0, 9], [`S194|OFF|${TS2}`]: [0, 16], [`bridge 4|READER|${TS2}`]: [0, 7] };
  const fsW = { [`S126|${TJ2}`]: { d: 0.6, lo: 0.3, hi: 0.9 }, [`S194|${TJ2}`]: { d: 0.7, lo: 0.4, hi: 1.0 } };
  cases.push(['TS+J as the first-ranked cause predicts: 1 to 6 HELD', outs(items(mkS(fsS), mkW(fsW))), '1 HELD, 2 HELD, 3 HELD, 4 HELD, 5 HELD, 6 HELD']);
  cases.push(['TS+J doing nothing: 1, 2, 4 and 5 FALSIFIED, 3 and 6 HELD', outs(items(mkS({}), mkW({}))), '1 FALSIFIED, 2 FALSIFIED, 3 HELD, 4 FALSIFIED, 5 FALSIFIED, 6 HELD']);
  cases.push(['a gain at W0 on one case only: item 1 INCONCLUSIVE', items(mkS({ ...fsS, [`S194|OFF|${TJ0}`]: [0, 0] }), mkW(fsW))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['TS gains as much as TS+J at W0: item 2 FALSIFIED on both, item 1 HELD', (() => { const it = items(mkS({ ...fsS, [`S126|READER|${TS0}`]: [40, 0], [`S194|OFF|${TS0}`]: [43, 0] }), mkW(fsW)); return `${it[0].outcome} ${it[1].outcome}`; })(), 'HELD FALSIFIED']);
  cases.push(['harm on S360 under off at W0: item 3 FALSIFIED', items(mkS({ ...fsS, [`S360|OFF|${TJ0}`]: [0, 80] }), mkW(fsW))[2].outcome, 'FALSIFIED']);
  cases.push(['bridge 4 losing 30 paths at W0.02 (0.375 points, margin 0.25): item 6 FALSIFIED', items(mkS({ ...fsS, [`bridge 4|READER|${P2}`]: [0, 0], [`bridge 4|READER|${TJ2}`]: [0, 30] }), mkW(fsW))[5].outcome, 'FALSIFIED']);
  cases.push(['the whole score gains but survival harms on S126 at W0.02: item 4 not HELD, its leg harm', (() => { const it = items(mkS({ ...fsS, [`S126|READER|${TJ2}`]: [0, 40] }), mkW(fsW)); return `${it[3].outcome} ${it[3].whole[0].o}`; })(), 'INCONCLUSIVE harm (the survival limit)']);
  cases.push(['the whole score gains but survival is inconclusive (3 saved, 20 lost): the leg inconclusive', items(mkS({ ...fsS, [`S126|READER|${TJ2}`]: [3, 20] }), mkW(fsW))[3].whole[0].o, 'inconclusive']);
  cases.push(['the whole score gains and survival loses within the margin (3 saved, 12 lost): the leg gains', items(mkS({ ...fsS, [`S126|READER|${TJ2}`]: [3, 12] }), mkW(fsW))[3].whole[0].o, 'gain']);
  cases.push(['the survival limit read unconditionally: S126 losing 12 and saving none at W0.02 (exact: the point -0.15, no material harm; unconditional: -100 x the exact bound on 12 of 8,000, -0.262, past -0.25) leaves a whole-score gain inconclusive, where the exact form reads gain', (() => { const x = items(mkS({ ...fsS, [`S126|READER|${TJ2}`]: [0, 12] }), mkW(fsW))[3].whole[0]; return `${x.o} ${x.oEx}`; })(), 'inconclusive gain']);
  cases.push(['the whole score within the margin on both: item 4 FALSIFIED', items(mkS(fsS), mkW({ [`S126|${TJ2}`]: { d: 0.05, lo: -0.1, hi: 0.2 }, [`S194|${TJ2}`]: { d: 0, lo: -0.2, hi: 0.2 } }))[3].outcome, 'FALSIFIED']);
  cases.push(['the whole score\'s interval over 0 but its upper end past the margin: inconclusive', items(mkS(fsS), mkW({ ...fsW, [`S194|${TJ2}`]: { d: 0.1, lo: -0.1, hi: 0.3 } }))[3].whole[1].o, 'inconclusive']);
  cases.push(['the margin is the case\'s own at the leg\'s weight: bridge 4 at W0.02 losing 30 of PRODUCT at 98.75% reads harm at 0.25', harmFamily([{ label: 'x', k: cells(mkS({})('bridge 4', 'READER', P2), mkS({ [`bridge 4|READER|${TJ2}`]: [0, 30] })('bridge 4', 'READER', TJ2)), margin: marginFor(survivedShare(mkS({})('bridge 4', 'READER', P2))) }])[0].o, 'harm']);
  cases.push(['the margin is PRODUCT\'s at the leg\'s own weight: bridge 4\'s PRODUCT at W0 below 95% (margin 0.5) leaves W0.02\'s at 0.25, so 30 lost at W0.02 is harm', items(mkS({ ...fsS, [`bridge 4|READER|${P0}`]: [0, 350], [`bridge 4|READER|${TJ2}`]: [0, 30] }), mkW(fsW))[5].outcome, 'FALSIFIED']);
  cases.push(['the opening\'s saves do not carry item 5: TS+J saving 30 paths the product fails on S126, TS as the product: FALSIFIED', items(mkS({ [`S126|READER|${TJ2}`]: [30, 0] }), mkW(fsW))[4].outcome, 'FALSIFIED']);
  cases.push(['item 5 reads TS\'s losses on the product\'s survivors: TS losing 30 on S126 alone, TS+J not, is a pooled gain', items(mkS({ [`S126|READER|${TS2}`]: [0, 30] }), mkW(fsW))[4].outcome, 'HELD']);
  cases.push(['item 5: TS+J keeping TS\'s 30 losses: FALSIFIED', items(mkS({ [`S126|READER|${TS2}`]: [0, 30], [`S126|READER|${TJ2}`]: [0, 30] }), mkW(fsW))[4].outcome, 'FALSIFIED']);
  cases.push(['item 5 at the pooled margin 0.1: 200 saved and 200 lost against TS on S126 (the upper end about 0.17, below 0.25): INCONCLUSIVE', items(mkS({ [`S126|READER|${TS2}`]: [0, 400, 100], [`S126|READER|${TJ2}`]: [0, 400, 300] }), mkW(fsW))[4].outcome, 'INCONCLUSIVE']);
  cases.push(['item 5: TS+J losing 60 to TS on the product\'s survivors is no material gain: FALSIFIED', items(mkS({ [`S126|READER|${TJ2}`]: [0, 30], [`S194|OFF|${TJ2}`]: [0, 30] }), mkW(fsW))[4].outcome, 'FALSIFIED']);
  cases.push(['item 5: 600 saved and 550 lost against TS on S126 (p about 0.07, the upper end past 0.1): INCONCLUSIVE', items(mkS({ [`S126|READER|${TS2}`]: [0, 1000, 100], [`S126|READER|${TJ2}`]: [0, 950, 700] }), mkW(fsW))[4].outcome, 'INCONCLUSIVE']);
  cases.push(['item 5 pools the three cases\' product survivors: 23,700 paths (100 fail on each), 20 saved on S126 and 25 lost on S194 summed', (() => { const k = items(mkS({ [`S126|READER|${TS2}`]: [0, 20], [`S194|OFF|${TJ2}`]: [0, 25] }), mkW(fsW))[4].legs[0].k; return `${k.N} ${k.saved} ${k.lost}`; })(), '23700 20 25']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const DIR = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : join(HERE, 'results', 'diag7aa');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).sort() : [];
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  const units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  const T = {};
  if (!bad.length) for (const u of units) {
    const f = join(DIR, traceName(u.id, u.arm, u.label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(j, ST, u.arm, u.label, u.run.sim)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    const X = decode(j);
    if (Math.abs(survivedShare(X.survived) - u.run.sim) > SIM_TOL) bad.push(`${f}: its survived paths give ${survivedShare(X.survived)}, the run line ${u.run.sim}`);
    T[`${u.id}|${u.arm}|${u.label}`] = { X, u };
  }
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  const S = (id, arm, l) => T[`${id}|${arm}|${l}`].X.survived;
  const cfgOf = (id, arm, l) => {
    const x = T[`${id}|${arm}|${l}`], ref = T[`${id}|${arm}|${label('PRODUCT', weightOf(l))}`];
    const cfg = { lambda: Number(field(x.u.ran, 'lambda')), floor: Math.min(...field(x.u.ran, 'levels').split(',').map(Number)), scale: x.u.joint.scale, cap: x.u.joint.cap, wb: Number(weightOf(l)) };
    cfg.spendYears = Array.from({ length: ref.X.Y }, (_, t) => { for (let i = 0; i < ref.X.N; i++) if (ref.X.level[i * ref.X.Y + t] > 0) return true; return false; });
    return cfg;
  };
  const WL = (id, arm, lb, la, a) => wholeLeg(T[`${id}|${arm}|${la}`].X, T[`${id}|${arm}|${lb}`].X, cfgOf(id, arm, la), a);
  console.log(`7AA: DOES THE JOINT TIER STATE GAIN WHERE THE PER-WORLD ONE DID NOT, WITH THE POT'S WEIGHT OFF (0) AND ON (0.02)? (predictions/diag-7aa.md; ${N} paths of seed ${SEED}; the fair-test gate passed: the stamps, every unit's settings, worlds, run and trace)\n`);
  console.log('EVERY RUN: survival; against PRODUCT at the same weight saved/lost; the whole score against PRODUCT (95%, the rule\'s interval at 0.05); pension switches a path; years below the plan\'s tier; estate; the year-0 gap and the pension tier it opens in at 1e-3 and at 0');
  for (const w of WEIGHTS) for (const [id, arm] of CASE_ARMS) {
    console.log(`${id} (${arm.toLowerCase()}) at W${w}`);
    for (const t of TAGS) {
      const l = label(t, w), x = T[`${id}|${arm}|${l}`], k = cells(S(id, arm, label('PRODUCT', w)), x.X.survived);
      const wl = t === 'PRODUCT' ? null : WL(id, arm, l, label('PRODUCT', w), ALPHA);
      console.log(`  ${t.padEnd(8)} ${x.u.run.sim.toFixed(4).padStart(8)}  ${`${k.saved}/${k.lost}`.padStart(9)}  ${wl ? `whole ${f3(wl.d)} (${wl.lo.toFixed(3)} to ${wl.hi.toFixed(3)})` : 'whole -'.padEnd(29)}  switches ${switching(x.X).perPath.toFixed(2)}  tier-below ${x.u.run.tier.toFixed(2)}  estate ${x.u.run.estate}  gap ${x.u.gap.gap} opens ${x.u.gap.open1e3} at 1e-3, ${x.u.gap.open0} at 0`);
    }
  }
  console.log('\nEACH WORLD: the opening table against the policy\'s run in that world (1,000 paths, the shift set to the world\'s node), table less run, points; the bad world first');
  for (const w of WEIGHTS) for (const [id, arm] of CASE_ARMS) console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} ${TAGS.map(t => { const u = T[`${id}|${arm}|${label(t, w)}`].u; return `${t} ${u.worlds.map(x => f3(x.table - x.sim)).join(' / ')}`; }).join('   ')}`);
  console.log('\nBY LONG-RUN SHIFT (each case\'s own paths): TS+J against PRODUCT - saved/lost, the whole score per 100 of all paths, path-years TS+J holds a riskier/safer tier (a lower tier code is riskier)');
  for (const w of WEIGHTS) for (const [id, arm] of CASE_ARMS) {
    const P = T[`${id}|${arm}|${label('PRODUCT', w)}`].X, J = T[`${id}|${arm}|${label('TS+J', w)}`].X, cfg = cfgOf(id, arm, label('PRODUCT', w));
    const sP = wholePaths(P, cfg), sJ = wholePaths(J, cfg), shifts = pathsForSeed(Number(SEED), P.N, P.Y - 1).map(z => z[P.Y]);
    const row = Z_BINS.map(([nm], b) => { let sv = 0, ls = 0, dw = 0, rk = 0, sf = 0; for (let i = 0; i < P.N; i++) { if (binOf(shifts[i]) !== b) continue; if (J.survived[i] && !P.survived[i]) sv++; if (!J.survived[i] && P.survived[i]) ls++; dw += sJ[i] - sP[i]; for (let t = 0; t < P.Y; t++) { const a = P.tier[i * P.Y + t], c = J.tier[i * J.Y + t]; if (c < a) rk++; else if (c > a) sf++; } } return `${nm}: ${sv}/${ls} ${f3(dw / P.N)} ${rk}/${sf}`; });
    console.log(`  ${`${id} (${arm.toLowerCase()}) W${w}`.padEnd(24)} ${row.join(' | ')}`);
  }
  console.log('\nS194: PATHS HOLDING THE MIDDLE PAIR 1/1 (tier code 5) IN YEAR 1, of 8,000');
  for (const w of WEIGHTS) console.log(`  W${w}: ${TAGS.map(t => { const X = T[`S194|OFF|${label(t, w)}`].X; let n = 0; for (let i = 0; i < X.N; i++) if (X.tier[i * X.Y + 1] === 5) n++; return `${t} ${n}`; }).join('  ')}`);
  console.log('\nAT W0, THE WHOLE SCORE BESIDE SURVIVAL (reported; survival decides at W0)');
  for (const [id, arm] of CASE_ARMS) for (const a of ['PRODUCT', 'TS']) { const wl = WL(id, arm, label('TS+J', '0'), label(a, '0'), ALPHA); console.log(`  ${`${id} (${arm.toLowerCase()})`.padEnd(18)} TS+J against ${a.padEnd(7)} survival ${wl.k.saved}/${wl.k.lost}  whole ${f3(wl.d)} (${wl.lo.toFixed(3)} to ${wl.hi.toFixed(3)})`); }
  console.log('\nITEM 5 BY CASE (reported): at W0.02, on the paths PRODUCT survives, TS+J against TS saved/lost; each arm\'s losses against PRODUCT; the pension tier each opens in (at 1e-3), marked where the two open alike (there the opening cannot carry the case); the whole score of TS+J against TS (95%, the rule\'s interval)');
  for (const [id, arm] of POOL5) {
    const P = S(id, arm, label('PRODUCT', '0.02')), A = S(id, arm, label('TS', '0.02')), B = S(id, arm, label('TS+J', '0.02')), k = cellsWhere(P, A, B);
    const oA = T[`${id}|${arm}|${label('TS', '0.02')}`].u.gap.open1e3, oB = T[`${id}|${arm}|${label('TS+J', '0.02')}`].u.gap.open1e3, wl = WL(id, arm, label('TS+J', '0.02'), label('TS', '0.02'), ALPHA);
    console.log(`  ${`${id} (${arm.toLowerCase()})`.padEnd(18)} ${`${k.saved}/${k.lost}`.padStart(7)} of ${k.N}  TS loses ${cells(P, A).lost}, TS+J loses ${cells(P, B).lost}  opens TS ${oA}, TS+J ${oB}${oA === oB ? ' (alike)' : ' (apart)'}  whole ${f3(wl.d)} (${wl.lo.toFixed(3)} to ${wl.hi.toFixed(3)})`);
  }
  const it = items(S, WL);
  console.log('\nTHE ITEMS (each a Holm family of its own where it tests paths, the regimen\'s reading deciding, the unconditional one beside it; item 4 by the whole-score rule, the survival part unconditional, the exact form beside)');
  for (const x of it) {
    console.log(`${x.n}. ${x.text}: ${x.outcome}`);
    for (const l of x.legs || []) console.log(`     ${legText(l)}`);
    for (const l of x.whole || []) console.log(`     ${wholeText(l)}`);
  }
  console.log(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
}
