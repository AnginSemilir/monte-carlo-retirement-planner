/*
 * THE 7U REDUCER: THE RESEARCH CANDIDATE AGAINST THE SHIPPING DEFAULT ON THE HELD-OUT SEED 7013, AT BOTH ESTATE WEIGHTS
 * (predictions/confirm-7u.md; PLAN.md 7u; items/7u.md; audit-7u.mjs). Reads results/diag7u/case*.txt (batch-7u.sh; 7aa's
 * line format, parsed by reduce-7aa.mjs parse, with the access and resid lines of the six stage households) and every
 * unit's trace. Built on reduce-7aw.mjs (its mutation run: results-reduce-7aj-7aw-mutations.txt), with a plant for each
 * check that run found missing (a ran, gap or run line; a forbidden field on the ran line; the guard on item 1's
 * interval).
 * THE FAIR-TEST GATE (NOT SETTLED if any part fails):
 *   - the stamps (fair-gate.mjs requireFairLogs) under predictions/confirm-7u.md;
 *   - every registered unit once and done (panel-7u.mjs: 55 households x CAND and SHIP x 0.02 and 0.01), with its solve,
 *     ran, gap, joint and run lines; at 30 points, 8,000 paths of seed 7013, lambda held, the final year exact, the unit's
 *     own estate weight, the tiers O60's blend medians in both arms; the arm's own settings, e3pcls among them (CAND on,
 *     SHIP off); no readerRef, coverage, holdTier or death tax on a ran line; no world lines; no pension death charge;
 *   - within a household and weight the two arms' ran lines the same but the arm's settings, the scale and cap the same;
 *   - the six stage households' units each with one access line and one resid line for every year 0 to the plan's end,
 *     year 0 holding every path and no later year more than the year before; no other unit with either;
 *   - every trace its log's (count, seed, arm, stamp and survival to four decimals);
 *   - the two records the gain set is named from (results-7aj.txt, results-7aw.txt) at their registered hashes.
 * THE ITEMS, at each weight (items 1-4 at 0.02, 5-8 at 0.01), by the registered rule (the whole-score rule of 29 Sep 09:08
 * UK; RULES.md section 8), each household's margin by stats.mjs marginFor from SHIP's own survival in the run (0.25 at
 * 95% or more, else 0.5):
 *   1/5 survival: per household, McNemar's exact one-sided p for harm, Holm across the 55, stats.mjs outcome() at the
 *       margin, AND the guarded unconditional interval's lower end above minus it; HELD when all 55 pass; FALSIFIED when
 *       any reads harm; else INCONCLUSIVE;
 *   2/6 the whole score (reduce-7aa.mjs wholeLeg at 0.05, the unit's weight): HELD when every lower end is above minus the
 *       margin; FALSIFIED when any upper end is below it; else INCONCLUSIVE;
 *   3/7 spending while both arms spend: HELD when every household's lower end is above -5% and the panel mean's above -1%;
 *       FALSIFIED when any household's upper end is below -5% or the mean's below -1%; else INCONCLUSIVE;
 *   4/8 the pooled floor over the households with no expected gain (panel-7u.mjs floorOf: the 55 less the gain set named
 *       from the weight's own record), stats.mjs pooledSummed: HELD when its lower end is above minus MARGINS.pooled (0.1
 *       points), FALSIFIED when its upper end is below it, else INCONCLUSIVE.
 *   Each item's realised point on a REALISED line (scorecard.mjs's interval index): the mean survival change over the 55,
 *   the least household whole-score point, the least household spending change in percent, the floor's pooled change.
 * REPORTED, deciding nothing: every unit's table, survival, table error, year-0 gap and opening, risk-above decision,
 * years below target, tier changes and estate; the households whose SHIP year-0 table error is -70 points or worse; each
 * arm's own change between the weights; the floors over the 25 alone, the broad 30 alone and all 55; the table against
 * the simulation by stage on the six (the bridge: years before access; after access; the last 15 years), each slice's
 * path-years counted.
 *   node research/solver/reduce-7u.mjs [dir] > research/solver/results-7u.txt
 *   node research/solver/reduce-7u.mjs --planted   the planted checks alone
 *   node research/solver/reduce-7u.mjs <dir> <paths> <points> --preflight   preflight-7u.sh's read: the gate and traces on
 *     the tuning seed 7002, no stamp check; its reading exercises the code, no figure is read
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import { survivalChangeU, mcnemarHarmP, holm, outcome, pooledSummed, zFor, marginFor, MARGINS } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import { spendYears, spendPaths, spendBoth, spendChange } from './reduce-7af.mjs';
import { blendReals, TIERS } from './candidate.mjs';
import { PANEL, PANEL25, BROAD, IN25, WEIGHTS, ARMS, UNITS, STAGE6, SEED, PRE_SEED, N, PTS, LATE, labelOf, gainOf, floorOf, gainSetOf, RECORDS } from './panel-7u.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/confirm-7u.md';
export const { field, LAMBDA, LEVELS } = A;
export const ALPHA = 0.05, SIM_TOL = 5e-5 + 1e-9, SPEND_H = -0.05, SPEND_M = -0.01;
export const parse = A.parse;
const ARM_FIELDS = ['tierState', 'bridgeStep', 'bridgeRead', 'switchMargin', 'switchCharge', 'e3', 'e3pcls', 'pclsInterp', 'tiersAbove'];
export const WANT_ARM = {
  CAND: { bridgeRead: 'reader', bridgeStep: 'exact', switchMargin: '0', switchCharge: '0.001', e3: 'true', e3pcls: 'true', pclsInterp: 'true' },
  SHIP: { bridgeRead: 'false', bridgeStep: null, tierState: null, switchMargin: '0.001', switchCharge: '0', e3: 'false', e3pcls: 'false', pclsInterp: 'false' } };
export const tiersOk = (s, reals) => { if (!s) return false; const m = Object.fromEntries(s.split(',').map(x => { const i = x.lastIndexOf(':'); return [x.slice(0, i).replace(/_/g, ' '), Number(x.slice(i + 1))]; }));
  return Object.keys(m).length === TIERS.length && TIERS.every(k => m[k] === reals[k]); };
const unitOf = (id, arm, label) => UNITS.find(([i, a, l]) => i === id && a === arm && l === label);
const keyOf = (id, arm, label) => `${id}|${arm}/${label}`;

/* the stage households' lines: access and resid, per unit */
const CASEL = /^(\S.*?)\s+case \| unit (\S+?)\/(\S+) \|/, ACCL = /^\s+access (\S+?)\/(\S+): year (\d+) years (\d+)$/, RESL = /^\s+resid (\S+?)\/(\S+) year (\d+): paths (\d+) table (\S+) realised (\S+)$/;
export function parseStage(text) {
  const out = {}; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), arm: m[2], label: m[3] }; continue; }
    if (!cur) continue;
    const S = () => (out[keyOf(cur.id, cur.arm, cur.label)] ||= { access: [], resid: [] });
    if ((m = ACCL.exec(line)) && m[1] === cur.arm && m[2] === cur.label) { S().access.push({ year: +m[3], years: +m[4] }); continue; }
    if ((m = RESL.exec(line)) && m[1] === cur.arm && m[2] === cur.label) S().resid.push({ t: +m[3], n: +m[4], table: Number(m[5]), realised: Number(m[6]) });
  }
  return out;
}

/* THE GATE */
export function gate(units, stage, reals, { n = N, pts = String(PTS), seed = String(SEED), records = null } = {}) {
  const bad = [];
  for (const [id, arm, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === arm && u.label === l).length; if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }
  const strip = s => ARM_FIELDS.reduce((t, k) => t.replace(new RegExp(` ${k} \\S+`), ''), s || '');
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`, reg = unitOf(u.id, u.arm, u.label);
    if (!reg) { bad.push(`${tag}: not a registered unit`); continue; }
    const w = reg[3];
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    const isC = u.arm === 'CAND';
    if (u.table === undefined) bad.push(`${tag}: no solve line`);
    if (!u.ran) bad.push(`${tag}: no ran line`);
    else {
      const want = { mix: '3', pts, seed, paths: String(n), grid: `total${pts}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', quad: '5', finalIntegral: 'true', bequestWeight: w, ...WANT_ARM[u.arm] };
      for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ${k} is ${field(u.ran, k)}, the prediction names ${v}`);
      if (isC && !field(u.ran, 'tierState')) bad.push(`${tag}: ran without the tier state`);
      for (const k of ['holdTier', 'readerRef', 'coverage', 'deathTax']) if (field(u.ran, k) !== null) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}`);
      if (!tiersOk(field(u.ran, 'tiers'), reals)) bad.push(`${tag}: its tiers ${field(u.ran, 'tiers')} are not O60's blend medians`);
    }
    if (!u.gap) bad.push(`${tag}: no year-0 gap line`);
    if (!u.joint) bad.push(`${tag}: no joint line`);
    else {
      if (u.joint.joint !== isC) bad.push(`${tag}: ran jointWorlds ${u.joint.joint}`);
      if (u.joint.margin !== (isC ? '0' : '0.001')) bad.push(`${tag}: solved with switch margin ${u.joint.margin}`);
      if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax}`);
      if (u.joint.tier !== 'own') bad.push(`${tag}: plan tier ${u.joint.tier}`);
    }
    if (u.worlds.length) bad.push(`${tag}: world lines, not registered`);
    if (!u.run) bad.push(`${tag}: no run line`);
    if (!u.done) bad.push(`${tag}: no done line`);
    // within a household and weight: the same settings but the arm's own; the same scale and cap
    const mates = units.filter(v => v.id === u.id && v !== u && (unitOf(v.id, v.arm, v.label) || [])[3] === w);
    for (const v of mates) {
      if (u.ran && v.ran && strip(u.ran) !== strip(v.ran)) bad.push(`${tag}: differs from the other arm of the household at ${w} beyond the arm's settings`);
      if (u.joint && v.joint && (u.joint.scale !== v.joint.scale || u.joint.cap !== v.joint.cap)) bad.push(`${tag}: scale or cap differs within the household at ${w}`);
    }
    // the stage lines: on the six, one access line and every year once; elsewhere none
    const S = stage[keyOf(u.id, u.arm, u.label)];
    if (STAGE6.includes(u.id)) {
      if (!S || S.access.length !== 1) { bad.push(`${tag}: ${S ? S.access.length : 0} access lines, not 1`); continue; }
      const T = S.access[0].years, ts = S.resid.map(x => x.t);
      if (S.resid.length !== T + 1 || ts.some((t, i) => t !== i)) bad.push(`${tag}: resid lines for years ${ts.length ? `${ts[0]}..${ts.at(-1)} (${ts.length})` : 'none'}, not 0..${T} once each`);
      else {
        if (S.resid[0].n !== n) bad.push(`${tag}: year 0 holds ${S.resid[0].n} paths, not ${n}`);
        for (let t = 1; t <= T; t++) if (S.resid[t].n > S.resid[t - 1].n) { bad.push(`${tag}: year ${t} holds more paths alive (${S.resid[t].n}) than year ${t - 1}`); break; }
      }
    } else if (S && (S.access.length || S.resid.length)) bad.push(`${tag}: stage lines on a household outside the six`);
  }
  if (records) for (const w of WEIGHTS) { try { gainSetOf(records[w], RECORDS[w].sha); } catch (e) { bad.push(`the record at ${w}: ${e.message}`); } }
  return bad;
}
export const traceName = A.traceName;
export const traceAgrees = (j, ST, arm, l, sim, n = N, seed = String(SEED)) => !!(j && ST && j.stamp && j.N === n && String(j.seed) === seed && j.arm === `${arm}/${l}` && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);

/* THE STAGE TABLE: a unit's resid lines grouped into the bridge (years before access), after access, and the last LATE
   years; each slice's path-years, and its table and realised survival weighted by the paths alive each year */
export function stageSlices(S) {
  const A0 = S.access[0].year, T = S.access[0].years, sl = { bridge: t => t < A0, after: t => t >= A0, late: t => t > T - LATE }, out = {};
  for (const [k, f] of Object.entries(sl)) {
    let n = 0, tb = 0, re = 0;
    for (const x of S.resid) if (f(x.t) && x.n > 0) { n += x.n; tb += x.n * x.table; re += x.n * x.realised; }
    out[k] = { n, table: n ? tb / n : NaN, realised: n ? re / n : NaN, error: n ? (tb - re) / n : NaN };
  }
  return out;
}

const tri = (yes, no) => (yes ? 'HELD' : no ? 'FALSIFIED' : 'INCONCLUSIVE');
const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);
/*
 * THE ITEMS at one weight. `K(id)` CAND's paired cells against SHIP (saved = CAND survives where SHIP fails); `WL(id)` the
 * whole-score leg; `SP(id)` CAND's spending change and its per-path relative differences; `margin(id)` the household's
 * margin (marginFor of SHIP's survival in the run); `floor` the households of the pooled floor.
 */
export function items(w, K, WL, SP, margin, floor) {
  const base = w === '0.02' ? 0 : 4, out = [];
  { const legs = PANEL.map(id => { const k = K(id); return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });
    const adj = holm(legs.map(l => l.p));
    legs.forEach((l, i) => { l.pHolm = adj[i]; const o = outcome({ b: l.k.lost, c: l.k.saved, N: l.k.N, margin: l.margin, pHolm: l.pHolm, level: ALPHA }); l.iv = o; l.u = guardedU(l.k); l.o = o.outcome; l.pass = o.outcome === 'no material harm' && l.u.lo > -l.margin; });
    const point = legs.reduce((t, l) => t + 100 * (l.k.saved - l.k.lost) / l.k.N, 0) / legs.length;
    out.push({ n: base + 1, kind: 'survival', w, text: `survival at the estate weight ${w}: CAND against SHIP, no material harm on every one of the ${PANEL.length} households (the exact rule with Holm across them, each at its margin, and the guarded unconditional interval's lower end above minus it; FALSIFIED: harm on any by the exact rule)`, legs, point,
      outcome: tri(legs.every(l => l.pass), legs.some(l => l.o === 'harm')) }); }
  { const legs = PANEL.map(id => ({ id, ...WL(id), margin: margin(id) })), point = Math.min(...legs.map(l => l.d));
    out.push({ n: base + 2, kind: 'whole', w, text: `the whole score at the estate weight ${w}: CAND against SHIP, no material harm on every household, each at its margin (FALSIFIED: an upper end below minus it)`, legs, point,
      outcome: tri(legs.every(l => l.lo > -l.margin), legs.some(l => l.hi < -l.margin)) }); }
  { const legs = PANEL.map(id => ({ id, ...SP(id).change })), diffs = PANEL.map(id => SP(id));
    const nP = diffs[0].rel.length, m = new Float64Array(nP);
    for (const x of diffs) for (let i = 0; i < nP; i++) m[i] += x.rel[i] / diffs.length;
    let mu = 0; for (let i = 0; i < nP; i++) mu += m[i]; mu /= nP; let v = 0; for (let i = 0; i < nP; i++) v += (m[i] - mu) ** 2;
    const se = Math.sqrt(v / (nP - 1) / nP), z = zFor(ALPHA), mean = { d: mu, lo: mu - z * se, hi: mu + z * se }, point = 100 * Math.min(...legs.map(l => l.d));
    out.push({ n: base + 3, kind: 'spending', w, text: `spending while both arms spend at ${w}: no household's spending more than 5% lower and the panel mean not more than 1% lower, each by its 95% interval (FALSIFIED: a household's upper end below -5% or the mean's below -1%)`, legs, mean, point,
      outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M, legs.some(l => l.hi < SPEND_H) || mean.hi < SPEND_M) }); }
  { const p = pooledSummed(floor.map(id => K(id)));
    out.push({ n: base + 4, kind: 'floor', w, text: `the pooled floor at ${w} over the ${floor.length} households with no expected gain (the 55 less the gain set named from the weight's own record): the pooled change's lower end above minus ${MARGINS.pooled} (FALSIFIED: its upper end below it)`, pool: p, point: p.d,
      outcome: tri(p.lo > -MARGINS.pooled, p.hi < -MARGINS.pooled) }); }
  return out;
}

// PLANTED, before any real file (rule 6)
const EDGES = [], REACHED = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map(k => [k, new Set()]));
function planted() {
  const cases = [], reals = blendReals();
  const tiersStr = TIERS.map(k => `${k.replace(/ /g, '_')}:${reals[k]}`).join(',');
  const ranOf = (arm, w, o = {}) => {
    const c = arm === 'CAND';
    return `mix 3 pts ${o.pts || 30} seed ${o.seed || SEED} paths ${o.n || N} grid total${o.pts || 30}x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot ${o.minPot || 29000} quad 5${c ? ' bridgeStep exact tierState 0/0,2/2' : ''} bequestWeight ${o.w || w} finalIntegral true bridgeRead ${c ? 'reader' : 'false'} switchMargin ${c ? 0 : 0.001} switchCharge ${c ? 0.001 : 0} e3 ${c} e3pcls ${c} pclsInterp ${c} tiers ${o.tiers || tiersStr}${o.extra || ''}`;
  };
  const TY = 30, ACC = 3;
  const stageText = (L, o = {}) => {
    const p = ''.padEnd(16), lines = [];
    if (!o.noAccess) lines.push(`${p} access ${L}: year ${ACC} years ${TY}`);
    for (let t = 0; t <= TY; t++) { if (o.skipYear === t) continue; const n = t === 0 ? (o.year0 || N) : (o.rise && t === 5 ? N : N - 10 * t);
      lines.push(`${p} resid ${L} year ${t}: paths ${n} table ${(90 + (o.bias && t < ACC ? 5 : 0)).toFixed(4)} realised ${(88).toFixed(4)}`); }
    return lines;
  };
  const unitText = (id, arm, l, w, o = {}) => {
    const p = ''.padEnd(16), L = `${arm}/${l}`, c = arm === 'CAND';
    const lines = [`${id.padEnd(16)} case | unit ${L} | lambda ${o.lambda || LAMBDA} tier own riskAbove auto mix 3`];
    if (!o.noSolve) lines.push(`${p} solve ${L}: table ${o.table || '99.5000'} secs 1`);
    if (!o.noRan) lines.push(`${p} ran ${L}: ${o.ran || ranOf(arm, w, o)}`);
    if (!o.noGap) lines.push(`${p} gap ${L}: ${o.gap || '1.0000e-3'} opening 2,2`);
    if (!o.noJoint) lines.push(`${p} joint ${L}: ${o.joint !== undefined ? o.joint : c} switchMargin ${o.margin || (c ? '0' : '0.001')} scale ${o.scale || 950000} cap 3800000 deathTax ${o.deathTax || 0} tier own riskAbove ${o.decided || 'off:_no_tier_above_the_plan'}`);
    if (o.world) lines.push(`${p} world ${L} 0 z -1.7321 weight 0.1667: table 99.0 sim 98.0 paths 1000`);
    if (!o.noRun) lines.push(`${p} run ${L}: sim ${o.sim || '99.5000'} below 0.10 tier-below 1.00 changes 0.500 estate 100000 secs 1`);
    if ((STAGE6.includes(id) && !o.noStage) || o.stageHere) lines.push(...stageText(L, o));
    if (!o.noDone) lines.push(`${p} done ${L}`);
    return lines.join('\n');
  };
  const all = (o = {}, who = () => true) => UNITS.map(([id, a, l, w]) => unitText(id, a, l, w, who(id, a, l, w) ? o : {})).join('\n');
  const G = (t, opt = {}) => gate(parse(t), parseStage(t), reals, opt);
  const refused = (t, opt) => String(G(t, opt).length > 0);
  const one = (id, arm, w, o) => refused(all(o, (i, a, lb, ww) => i === id && a === arm && ww === w));
  const hh = (id, o) => refused(all(o, i => i === id));
  const C = 'CAND', SH = 'SHIP';
  cases.push(['a log parsed and gated: every registered unit, the gate passes', `${parse(all()).length} ${G(all()).length}`, `${UNITS.length} 0`]);
  cases.push(['the registered units: 55 households, 30 of them broad, x 2 arms x 2 weights', `${PANEL.length} ${BROAD.length} ${UNITS.filter(u => u[1] === C).length} ${UNITS.filter(u => u[1] === SH).length}`, '55 30 110 110']);
  cases.push(['the gate refuses a missing unit', refused(UNITS.slice(1).map(([id, a, l, w]) => unitText(id, a, l, w)).join('\n')), 'true']);
  cases.push(['the gate refuses a broad household missing at one weight', refused(UNITS.filter(([id, a, , w]) => !(id === BROAD[7] && a === SH && w === '0.01')).map(([id, a, l, w]) => unitText(id, a, l, w)).join('\n')), 'true']);
  cases.push(['the gate refuses a unit run twice', refused(all() + '\n' + unitText('S122', SH, labelOf(SH, '0.02'), '0.02')), 'true']);
  cases.push(['the gate refuses an unregistered unit', refused(all() + '\n' + unitText('S999', SH, labelOf(SH, '0.02'), '0.02')), 'true']);
  cases.push(['the gate refuses another lambda on the unit line', one('S120', C, '0.02', { lambda: '0.03' }), 'true']);
  cases.push(['the gate refuses a missing solve line', one('S120', C, '0.02', { noSolve: true }), 'true']);
  cases.push(['the gate refuses a missing ran line (an escape of 7aj\'s and 7aw\'s mutation run)', one('S122', SH, '0.01', { noRan: true }), 'true']); EDGES.push('a unit with no ran line');
  cases.push(['the gate refuses a missing gap line (an escape)', one('S122', C, '0.02', { noGap: true }), 'true']);
  cases.push(['the gate refuses a missing run line (an escape)', one(BROAD[0], SH, '0.02', { noRun: true }), 'true']);
  cases.push(['the gate refuses a missing joint line', one(BROAD[1], C, '0.01', { noJoint: true }), 'true']);
  cases.push(['the gate refuses a missing done line', one('share 0.50', SH, '0.02', { noDone: true }), 'true']);
  // on both arms of a household at one weight, so the within-household comparison cannot refuse it first
  const pair = (id, w, o) => refused(all(o, (i, a, l, ww) => i === id && ww === w));
  cases.push(['the gate refuses a readerRef on the ran line, both arms (an escape)', pair('S126', '0.02', { extra: ' readerRef order' }), 'true']);
  cases.push(['the gate refuses a coverage axis on the ran line, both arms', pair('S126', '0.01', { extra: ' coverage 6' }), 'true']);
  cases.push(['the gate refuses both arms\' 0.02 units solved at 0.01', pair('share 0.70', '0.02', { w: '0.01' }), 'true']);
  cases.push(['the gate refuses the tuning seed in the run', refused(all({ seed: PRE_SEED })), 'true']);
  cases.push(['the preflight\'s gate takes the tuning seed it names', refused(all({ seed: PRE_SEED }), { seed: String(PRE_SEED) }), 'false']);
  cases.push(['the gate refuses other paths (on every unit of a household)', hh('S360', { n: 4000 }), 'true']);
  cases.push(['the gate refuses other points (on every unit of a household)', hh('wealth x2', { pts: 16 }), 'true']);
  cases.push(['the gate refuses the linear tiers', hh('S130', { tiers: tiersStr.replace(`High_Risk:${reals['High Risk']}`, 'High_Risk:4.79') }), 'true']);
  cases.push(['the gate refuses a tier set with a sixth tier', hh(BROAD[3], { tiers: `${tiersStr},Very_High_Risk:5.5` }), 'true']);
  cases.push(['the gate refuses SHIP with the tier state', one('bridge 6', SH, '0.02', { ran: ranOf(SH, '0.02').replace(' bequestWeight', ' tierState 0/0,2/2 bequestWeight') }), 'true']);
  cases.push(['the gate refuses SHIP with the reader', one('bridge 1', SH, '0.01', { ran: ranOf(SH, '0.01').replace('bridgeRead false', 'bridgeRead reader') }), 'true']);
  cases.push(['the gate refuses SHIP with the interpolated allowance axis', one('S126', SH, '0.02', { ran: ranOf(SH, '0.02').replace('pclsInterp false', 'pclsInterp true') }), 'true']);
  cases.push(['the gate refuses SHIP with e3pcls', one('S126', SH, '0.02', { ran: ranOf(SH, '0.02').replace('e3pcls false', 'e3pcls true') }), 'true']);
  cases.push(['the gate refuses CAND without e3pcls (7aj and 7aw ran it off)', one('S126', C, '0.02', { ran: ranOf(C, '0.02').replace('e3pcls true', 'e3pcls false') }), 'true']);
  cases.push(['the gate refuses a ran line with no e3pcls field', one(BROAD[2], C, '0.01', { ran: ranOf(C, '0.01').replace(' e3pcls true', '') }), 'true']); EDGES.push('a ran line with no e3pcls field');
  cases.push(['the gate refuses CAND without Q\'s step', one('S126', C, '0.02', { ran: ranOf(C, '0.02').replace(' bridgeStep exact', '') }), 'true']);
  cases.push(['the gate refuses CAND without the charge', one('S126', C, '0.02', { ran: ranOf(C, '0.02').replace('switchCharge 0.001', 'switchCharge 0') }), 'true']);
  cases.push(['the gate refuses CAND without e3', one('S126', C, '0.02', { ran: ranOf(C, '0.02').replace('e3 true', 'e3 false') }), 'true']);
  cases.push(['the gate refuses CAND without the tier state', one('S126', C, '0.02', { ran: ranOf(C, '0.02').replace(' tierState 0/0,2/2', '') }), 'true']);
  cases.push(['the gate refuses CAND solved per world', one('S126', C, '0.02', { joint: false }), 'true']);
  cases.push(['the gate refuses CAND at the stored margin', one('S194', C, '0.01', { margin: '0.001' }), 'true']);
  cases.push(['the gate refuses a settings difference within a household and weight (minPot)', one('share 0.90', SH, '0.02', { minPot: 30000 }), 'true']);
  cases.push(['the gate takes a minPot that differs only between weights (each weight its own pair)', refused(all({ minPot: 30000 }, (i, a, l, w) => i === 'share 0.90' && w === '0.01')), 'false']);
  cases.push(['the gate refuses a pension death charge', hh('S122', { deathTax: 0.45 }), 'true']);
  cases.push(['the gate refuses another scale within a household and weight', one('S120', SH, '0.01', { scale: 950001 }), 'true']);
  cases.push(['the gate takes a risk-above decision that differs between the arms', one('S122', C, '0.02', { decided: 'on:_tier_above' }), 'false']);
  cases.push(['the gate takes a tier above in one arm only', one('S122', C, '0.02', { ran: ranOf(C, '0.02').replace('tiersAbove 0', 'tiersAbove 1') }), 'false']); EDGES.push('a tier above in one arm only');
  cases.push(['the gate refuses a world line', one('bridge 4', C, '0.02', { world: true }), 'true']);
  cases.push(['the gate refuses a stage household with no access line', one('S370', C, '0.02', { noAccess: true }), 'true']);
  cases.push(['the gate refuses a stage household with no stage lines at all', one('S128', SH, '0.01', { noStage: true }), 'true']);
  cases.push(['the gate refuses a stage household missing a year', one('S360', SH, '0.02', { skipYear: 12 }), 'true']);
  cases.push(['the gate refuses a year 0 that does not hold every path', one('S130', C, '0.01', { year0: N - 1 }), 'true']);
  cases.push(['the gate refuses more paths alive than the year before', one('bridge 4+cost', C, '0.02', { rise: true }), 'true']); EDGES.push('a year holding more paths alive than the year before');
  cases.push(['the gate refuses stage lines on a household outside the six', one('S120', C, '0.02', { stageHere: true }), 'true']);
  { const recs = Object.fromEntries(WEIGHTS.map(w => [w, readFileSync(join(HERE, RECORDS[w].file), 'utf8')]));
    cases.push(['the records at their hashes pass; one changed by a character is refused', `${G(all(), { records: recs }).length} ${G(all(), { records: { ...recs, '0.02': recs['0.02'] + ' ' } }).length > 0}`, '0 true']);
    cases.push(['the gain sets from the records (each weight its own): eight each, the floor 47 each', `${gainOf('0.02').length} ${gainOf('0.01').length} ${floorOf('0.02').length} ${floorOf('0.01').length}`, '8 8 47 47']);
    cases.push(['each weight its own record: bridge 1 gains at 0.01 only, share 0.90 at 0.02 only', `${gainOf('0.01').includes('bridge 1')} ${gainOf('0.02').includes('bridge 1')} ${gainOf('0.02').includes('share 0.90')} ${gainOf('0.01').includes('share 0.90')}`, 'true false true false']);
    cases.push(['the six stage households are all in the gain set at both weights', String(STAGE6.every(id => gainOf('0.02').includes(id) && gainOf('0.01').includes(id))), 'true']); }
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, L = labelOf(C, '0.02'), t = (sim, seed = SEED) => ({ stamp: ST, N, seed, arm: `CAND/${L}`, sim });
    cases.push(['a trace agrees with the log to four decimals, and not beyond, only under its own arm and seed', `${traceAgrees(t(99.30004), ST, C, L, 99.3)} ${traceAgrees(t(99.3001), ST, C, L, 99.3)} ${traceAgrees(t(99.3), ST, SH, L, 99.3)} ${traceAgrees(t(99.3, PRE_SEED), ST, C, L, 99.3)}`, 'true false false false']); }
  { const dir = mkdtempSync(join(tmpdir(), 'p7u-')), ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, L = labelOf(C, '0.01');
    const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64'), surv = Uint8Array.from({ length: N }, (_, i) => (i % 3 ? 1 : 0)), sim = 100 * surv.reduce((t, x) => t + x, 0) / N;
    const write = st => writeFileSync(join(dir, traceName('S126', C, L)), gzipSync(JSON.stringify({ id: 'S126', arm: `CAND/${L}`, stamp: st, N, Y: 1, seed: SEED, sim, survived: b64(surv), level: b64(new Uint8Array(N)), tier: b64(new Uint8Array(N)), wealth: b64(new Float32Array(N)), taxPaid: b64(new Float32Array(N)), failYear: b64(new Int16Array(N).fill(-1)) })));
    const u = [{ id: 'S126', arm: C, label: L, run: { sim } }];
    const run1 = () => { const bad = []; loadTraces(u, dir, ST, bad); return bad.length; };
    write(ST); const same = run1(); write({ ...ST, code: 'other' }); const off = run1();
    rmSync(dir, { recursive: true, force: true });
    cases.push(['a trace on file: its own stamp passes, another code refused', `${same} ${off > 0}`, '0 true']); }
  // the stage table on a planted bias in the bridge years only
  { const S0 = parseStage(unitText('S370', C, labelOf(C, '0.02'), '0.02'))[keyOf('S370', C, labelOf(C, '0.02'))], S1 = parseStage(unitText('S370', C, labelOf(C, '0.02'), '0.02', { bias: true }))[keyOf('S370', C, labelOf(C, '0.02'))];
    const a = stageSlices(S0), b = stageSlices(S1), f = x => x.toFixed(2);
    cases.push(['the stage table: a +5 bias planted in the bridge years moves the bridge slice by 5 and no other', `${f(b.bridge.error - a.bridge.error)} ${f(b.after.error - a.after.error)} ${f(b.late.error - a.late.error)}`, '5.00 0.00 0.00']);
    cases.push(['the stage table: each slice\'s path-years counted (bridge years 0-2, after 3-30, late 16-30)', `${a.bridge.n} ${a.after.n} ${a.late.n}`, `${N + (N - 10) + (N - 20)} ${Array.from({ length: 28 }, (_, i) => N - 10 * (i + 3)).reduce((s, x) => s + x, 0)} ${Array.from({ length: 15 }, (_, i) => N - 10 * (i + 16)).reduce((s, x) => s + x, 0)}`]); }
  // the items on planted stories
  const mkK = spec => id => { const [saved, lost] = spec[id] || [0, 0]; return { saved, lost, a: N - 200 - saved - lost, d: 200, N }; };
  const mkW = spec => id => spec[id] || { d: 0.05, lo: -0.1, hi: 0.2 };
  const mkSP = (spec, noise = {}) => id => { const d = spec[id] !== undefined ? spec[id] : 0, e = noise[id] || 0.002, n = 400, rel = Float64Array.from({ length: n }, (_, i) => d + (i % 2 ? e : -e)); const ch = spendChange(Float64Array.from({ length: n }, () => 1), Float64Array.from({ length: n }, (_, i) => 1 + d + (i % 2 ? e : -e))); return { change: ch, rel, kept: n }; };
  const mg = (sims = {}) => id => marginFor(sims[id] !== undefined ? sims[id] : 99);
  const run = (w, k = {}, wl = {}, sp = {}, noise = {}, sims = {}) => { const it = items(w, mkK(k), mkW(wl), mkSP(sp, noise), mg(sims), floorOf(w)); it.forEach(x => REACHED[x.n].add(x.outcome)); return it; };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  cases.push(['nothing differs at 0.02: 1-4 HELD', outs(run('0.02')), '1 HELD, 2 HELD, 3 HELD, 4 HELD']);
  cases.push(['nothing differs at 0.01: 5-8 HELD', outs(run('0.01')), '5 HELD, 6 HELD, 7 HELD, 8 HELD']);
  cases.push(['the margin is marginFor of SHIP\'s own survival: 94.99 reads 0.5, 95 reads 0.25', `${run('0.02', {}, {}, {}, {}, { S122: 94.99 })[0].legs.find(l => l.id === 'S122').margin} ${run('0.02', {}, {}, {}, {}, { S122: 95 })[0].legs.find(l => l.id === 'S122').margin}`, '0.5 0.25']); EDGES.push('SHIP\'s survival exactly at 95');
  cases.push(['a household with no discordant path reads no material harm', run('0.02', { [BROAD[4]]: [0, 0] })[0].legs.find(l => l.id === BROAD[4]).o, 'no material harm']); EDGES.push('a household with no discordant path');
  cases.push(['a clear loss on a broad household (0 saved, 60 lost) at 0.02: 1 FALSIFIED; nothing at 0.01: 5 HELD', `${run('0.02', { [BROAD[5]]: [0, 60] })[0].outcome} ${run('0.01')[0].outcome}`, 'FALSIFIED HELD']);
  cases.push(['a loss inside the margin whose interval reaches past it (5 saved, 22 lost): INCONCLUSIVE', run('0.02', { S122: [5, 22] })[0].outcome, 'INCONCLUSIVE']);
  cases.push(['every discordant path lost and none saved (0 saved, 15 lost): INCONCLUSIVE', run('0.01', { S122: [0, 15] })[0].outcome, 'INCONCLUSIVE']); EDGES.push('every discordant path lost and none saved');
  // at margin 0.25 the guard widens the lower end by about 0.011 and no whole count of lost paths falls between the two
  // ends; at 0.5 (SHIP under 95%) 28 lost does: unguarded -0.494, guarded -0.506, the exact rule no material harm
  cases.push(['the guard decides (0 saved, 28 lost, margin 0.5): the unguarded interval passes, the guarded one does not: INCONCLUSIVE (an escape of 7aj\'s and 7aw\'s run)', `${survivalChangeU(N - 228, 28, 0, 200, ALPHA).lo > -0.5} ${run('0.02', { S370: [0, 28] }, {}, {}, {}, { S370: 90 })[0].outcome}`, 'true INCONCLUSIVE']); EDGES.push('a household the guard alone decides');
  cases.push(['Holm across 55: 60 saved, 82 lost (p 0.039 alone) is not harm after Holm: INCONCLUSIVE', run('0.02', { S122: [60, 82] })[0].outcome, 'INCONCLUSIVE']);
  cases.push(['the whole score\'s upper end below minus the margin on one household: 2 FALSIFIED', run('0.02', {}, { S126: { d: -0.5, lo: -0.7, hi: -0.3 } })[1].outcome, 'FALSIFIED']);
  cases.push(['the whole score straddling minus the margin: 6 INCONCLUSIVE', run('0.01', {}, { S126: { d: -0.2, lo: -0.4, hi: 0 } })[1].outcome, 'INCONCLUSIVE']);
  cases.push(['the whole score\'s lower end exactly at minus the margin is not a pass: INCONCLUSIVE', run('0.02', {}, { S126: { d: 0, lo: -0.25, hi: 0.25 } })[1].outcome, 'INCONCLUSIVE']); EDGES.push('a whole-score lower end exactly at minus the margin');
  cases.push(['the whole score at -0.4 to -0.3: no harm where SHIP survives 90 (0.5), harm where 99 (0.25)', `${run('0.02', {}, { S370: { d: -0.35, lo: -0.4, hi: -0.3 } }, {}, {}, { S370: 90 })[1].outcome} ${run('0.02', {}, { S370: { d: -0.35, lo: -0.4, hi: -0.3 } })[1].outcome}`, 'HELD FALSIFIED']);
  cases.push(['spending 6% lower on one household: 3 FALSIFIED', run('0.02', {}, {}, { S120: -0.06 })[2].outcome, 'FALSIFIED']);
  cases.push(['spending 4% lower on one household: 7 HELD', run('0.01', {}, {}, { S120: -0.04 })[2].outcome, 'HELD']);
  cases.push(['spending 1.5% lower on every household: FALSIFIED by the mean', run('0.02', {}, {}, Object.fromEntries(PANEL.map(id => [id, -0.015])))[2].outcome, 'FALSIFIED']);
  cases.push(['spending 1% lower on every household (the mean at the line): INCONCLUSIVE', run('0.01', {}, {}, Object.fromEntries(PANEL.map(id => [id, -0.01])))[2].outcome, 'INCONCLUSIVE']); EDGES.push('the spending mean exactly at -1%');
  cases.push(['spending 4.9% lower with a wide interval: INCONCLUSIVE', run('0.02', {}, {}, { S120: -0.049 }, { S120: 0.2 })[2].outcome, 'INCONCLUSIVE']);
  { const fl = floorOf('0.02'), gain = gainOf('0.02');
    const r1 = run('0.02', Object.fromEntries(fl.map(id => [id, [0, 12]])));
    cases.push(['every floor household 0 saved, 12 lost: no household reads harm, the floor FALSIFIED', `${r1[0].legs.filter(l => l.o === 'harm').length} ${r1[0].outcome} ${r1[3].outcome}`, '0 INCONCLUSIVE FALSIFIED']);
    cases.push(['the gain households\' losses are not in the floor: 4 HELD', run('0.02', Object.fromEntries(gain.map(id => [id, [0, 12]])))[3].outcome, 'HELD']);
    cases.push(['the floor at 0.01 reads its own set: every 0.01 floor household 0 saved, 2 lost: 8 HELD', run('0.01', Object.fromEntries(floorOf('0.01').map(id => [id, [0, 2]])))[3].outcome, 'HELD']);
    cases.push(['a floor straddling minus 0.1 (0 saved, 8 lost on each): INCONCLUSIVE', run('0.02', Object.fromEntries(fl.map(id => [id, [0, 8]])))[3].outcome, 'INCONCLUSIVE']); }
  // the 0.01 leg reaches every outcome on its own stories (its items are the same functions at the other weight)
  cases.push(['at 0.01: a clear loss on one household 5 FALSIFIED; a whole upper end below the margin 6 FALSIFIED; spending 6% lower 7 FALSIFIED', `${run('0.01', { S168: [0, 60] })[0].outcome} ${run('0.01', {}, { S168: { d: -0.5, lo: -0.7, hi: -0.3 } })[1].outcome} ${run('0.01', {}, {}, { S168: -0.06 })[2].outcome}`, 'FALSIFIED FALSIFIED FALSIFIED']);
  { const fl = floorOf('0.01'); cases.push(['at 0.01: the floor households 0 saved, 12 lost: 8 FALSIFIED; 0 saved, 8 lost: 8 INCONCLUSIVE', `${run('0.01', Object.fromEntries(fl.map(id => [id, [0, 12]])))[3].outcome} ${run('0.01', Object.fromEntries(fl.map(id => [id, [0, 8]])))[3].outcome}`, 'FALSIFIED INCONCLUSIVE']); }
  { const it = run('0.02', { S122: [10, 0], S124: [0, 2] }, { S126: { d: -0.2, lo: -0.3, hi: 0.1 } }, { S120: -0.03 });
    cases.push(['the realised points: the mean survival change over 55, the least whole point, the least spending change in percent, the floor\'s change', it.map(x => x.point.toFixed(4)).join(' '), `${((100 * 10 / N - 100 * 2 / N) / 55).toFixed(4)} -0.2000 -3.0000 ${pooledSummed(floorOf('0.02').map(id => mkK({ S122: [10, 0], S124: [0, 2] })(id))).d.toFixed(4)}`]); }
  { const { spendYears: _ } = { spendYears };
    const X = { N: 3, Y: 3, level: Uint8Array.from([100, 0, 0, 100, 100, 100, 0, 0, 0]) }, Y = { N: 3, Y: 3, level: Uint8Array.from([100, 100, 100, 98, 98, 98, 100, 100, 100]) }, sy = spendYears(X, Y);
    const nb = spendBoth(X, Y, sy), ch = spendChange(nb.a, nb.b);
    cases.push(['survival is not spending: while both spend -1.0%, the path with no year both spend left out', `${(100 * ch.d).toFixed(1)} ${nb.idx.join(',')}`, '-1.0 0,1']); EDGES.push('a path with no year both arms spend'); }
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should`);
  console.log(`EDGES: ${EDGES.join(', ')}`);
  for (const k of Object.keys(REACHED)) console.log(`OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`);
  console.log('');
}

const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());

/* THE TRACES: every unit's trace, checked against the log; `bad` gains every refusal */
export function loadTraces(units, DIR, ST, bad, n = N, seed = String(SEED)) {
  const TR = {};
  for (const u of units) {
    const f = join(DIR, traceName(u.id, u.arm, u.label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const t = readTrace(f);
    if (!traceAgrees(t, ST, u.arm, u.label, u.run.sim, n, seed)) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    TR[keyOf(u.id, u.arm, u.label)] = decode(t);
  }
  return TR;
}

/* THE READING, after every gate has passed (the preflight runs it over its own tiny logs) */
export function reading(units, stage, TR, out = console.log, n = N, seed = SEED) {
  const U = (id, arm, w) => units.find(u => u.id === id && u.arm === arm && u.label === labelOf(arm, w));
  const T = (id, arm, w) => TR[keyOf(id, arm, labelOf(arm, w))];
  out(`7U: THE RESEARCH CANDIDATE AGAINST THE SHIPPING DEFAULT ON ${PANEL.length} HOUSEHOLDS AT BOTH ESTATE WEIGHTS (predictions/confirm-7u.md; ${n} paths of seed ${seed}, both arms on O60's blend-median tiers, CAND with e3pcls; the fair-test gate passed: the stamps, every unit once and done at the registered settings, the arms' settings, the stage lines, every trace the log's, the records at their hashes)\n`);
  const all = [];
  for (const w of WEIGHTS) {
    out(`EVERY UNIT AT ${w}: the table, the simulated survival, the table error (table less simulated), the year-0 gap and opening, the risk-above decision, years below target, tier changes and estate`);
    for (const id of PANEL) for (const arm of ['SHIP', 'CAND']) { const u = U(id, arm, w); out(`  ${`${id} ${arm}`.padEnd(20)} table ${u.table} sim ${u.run.sim.toFixed(2)} error ${(Number(u.table) - u.run.sim).toFixed(2)} gap ${u.gap.gap} (opening ${u.gap.open1e3},${u.gap.open0}) riskAbove ${u.joint.decided} below ${u.run.below.toFixed(2)} changes ${u.run.changes.toFixed(3)} estate ${u.run.estate}${IN25.has(id) ? '' : '  (broad)'}`); }
    const K = id => cells(T(id, 'SHIP', w).survived, T(id, 'CAND', w).survived);
    const WL = id => { const u = U(id, 'CAND', w), X = T(id, 'SHIP', w), Y = T(id, 'CAND', w); const cfg = { lambda: Number(field(u.ran, 'lambda')), floor: Math.min(...field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(w), spendYears: spendYears(X, Y) }; return A.wholeLeg(X, Y, cfg, ALPHA); };
    const memo = {};
    const SP = id => memo[id] || (memo[id] = (() => { const X = T(id, 'SHIP', w), Y = T(id, 'CAND', w), sy = spendYears(X, Y), sb = spendBoth(X, Y, sy), change = spendChange(sb.a, sb.b), N0 = X.N, rel = new Float64Array(N0), k = sb.a.length; let ma = 0; for (const x of sb.a) ma += x; ma /= k; sb.idx.forEach((pi, j) => { rel[pi] = (sb.b[j] - sb.a[j]) / ma * N0 / k; }); return { change, rel, kept: k, old: spendChange(spendPaths(X, sy), spendPaths(Y, sy)) }; })());
    const margin = id => marginFor(U(id, 'SHIP', w).run.sim);
    const it = items(w, K, WL, SP, margin, floorOf(w));
    out(`\nTHE ITEMS AT ${w} (each read by its registered rule)`);
    for (const x of it) {
      out(`${x.n}. ${x.text}: ${x.outcome}`);
      if (x.kind === 'survival') for (const l of x.legs) out(`     ${l.id.padEnd(14)} ${l.k.saved} saved/${l.k.lost} lost of ${l.k.N}  p ${l.p.toExponential(1)}  Holm ${l.pHolm.toExponential(1)}  change ${f3(l.iv.d)} (exact ${l.iv.lo.toFixed(3)} to ${l.iv.hi.toFixed(3)}; unconditional ${l.u.lo.toFixed(3)} to ${l.u.hi.toFixed(3)})  margin ${l.margin}  ${l.o}${l.pass ? '' : l.o === 'no material harm' ? ' (the unconditional interval does not pass)' : ''}`);
      if (x.kind === 'whole') for (const l of x.legs) out(`     ${l.id.padEnd(14)} whole ${f3(l.d)} (unconditional ${l.lo.toFixed(3)} to ${l.hi.toFixed(3)}; exact ${l.exLo.toFixed(3)} to ${l.exHi.toFixed(3)}; survival part ${f3(l.sd)}, the rest ${f3(l.rest)} +/- ${l.restSe.toFixed(3)})  margin ${l.margin}`);
      if (x.kind === 'spending') { for (const l of x.legs) { const o = SP(l.id); out(`     ${l.id.padEnd(14)} while both spend (${o.kept} paths) ${l.a.toFixed(4)} -> ${l.b.toFixed(4)}: ${f3(100 * l.d)}% (${(100 * l.lo).toFixed(3)} to ${(100 * l.hi).toFixed(3)}) | reported, a failed path's years 0: ${f3(100 * o.old.d)}%`); } out(`     the panel mean ${f3(100 * x.mean.d)}% (${(100 * x.mean.lo).toFixed(3)} to ${(100 * x.mean.hi).toFixed(3)})`); }
      if (x.kind === 'floor') out(`     ${x.pool.cells.saved} saved/${x.pool.cells.lost} lost of ${x.pool.N} over ${x.pool.k} households, change ${f3(x.pool.d)} (${x.pool.lo.toFixed(3)} to ${x.pool.hi.toFixed(3)}); the gain set left out: ${gainOf(w).join(', ')}`);
    }
    { const fl = (ids, nm) => { const p = pooledSummed(ids.map(K)); out(`  REPORTED, the floor over ${nm}: ${p.cells.saved} saved/${p.cells.lost} lost of ${p.N}, change ${f3(p.d)} (${p.lo.toFixed(3)} to ${p.hi.toFixed(3)})`); };
      fl(PANEL25.map(([id]) => id).filter(id => floorOf(w).includes(id)), `the 25's floor households`); fl(BROAD, 'the broad 30'); fl(PANEL, 'all 55'); }
    { const bad70 = PANEL.filter(id => Number(U(id, 'SHIP', w).table) - U(id, 'SHIP', w).run.sim <= -70);
      out(`  REPORTED, SHIP's year-0 table error -70 points or worse at ${w}: ${bad70.length ? bad70.map(id => `${id} ${(Number(U(id, 'SHIP', w).table) - U(id, 'SHIP', w).run.sim).toFixed(2)}`).join(', ') : 'none'}`); }
    for (const x of it) out(`REALISED item ${x.n}: ${x.point.toFixed(4)}`);
    all.push(...it);
    out('');
  }
  out('REPORTED: EACH ARM\'S OWN CHANGE BETWEEN THE WEIGHTS (survival at 0.02 less at 0.01; half of the nineteen\'s drift in CARRY was the shipping default\'s)');
  for (const arm of ['CAND', 'SHIP']) { const d = PANEL.map(id => U(id, arm, '0.02').run.sim - U(id, arm, '0.01').run.sim); out(`  ${arm}: mean ${f3(d.reduce((s, x) => s + x, 0) / d.length)}, least ${f3(Math.min(...d))} (${PANEL[d.indexOf(Math.min(...d))]}), most ${f3(Math.max(...d))} (${PANEL[d.indexOf(Math.max(...d))]})`); }
  out('\nREPORTED: THE TABLE AGAINST THE SIMULATION BY STAGE (the six; each slice\'s path-years, the chooser\'s expected survival for its own move and the realised survival, both weighted by the paths alive each year; error = table less realised)');
  for (const id of STAGE6) for (const w of WEIGHTS) for (const arm of ['SHIP', 'CAND']) {
    const S = stage[keyOf(id, arm, labelOf(arm, w))], s = stageSlices(S);
    out(`  ${`${id} ${arm} ${w}`.padEnd(26)} access year ${S.access[0].year}; ${['bridge', 'after', 'late'].map(k => `${k} ${s[k].n} path-years ${s[k].n ? `${s[k].table.toFixed(2)} vs ${s[k].realised.toFixed(2)} (${f3(s[k].error)})` : '-'}`).join('; ')}`);
  }
  out(`\nOUTCOME: ${all.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
  return all;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: the planted set threw (${e.message})`); process.exit(1); }
  if (process.argv.includes('--planted')) process.exit(0);
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7u'), n = Number(args[1] || N), pts = args[2] || String(PTS);
  const PRE = process.argv.includes('--preflight'), seed = String(PRE ? PRE_SEED : SEED);
  const logs = logsOf(DIR), text = Object.values(logs).join('\n'), units = parse(text), stage = parseStage(text);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  if (!PRE) requireFairLogs(logs, PRED);
  const records = Object.fromEntries(WEIGHTS.map(w => [w, readFileSync(join(HERE, RECORDS[w].file), 'utf8')]));
  const bad = gate(units, stage, blendReals(), { n, pts, seed, records }), ST = stampOf(logs);
  const TR = bad.length ? {} : loadTraces(units, DIR, ST, bad, n, seed);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  if (PRE) console.log(`PREFLIGHT: the gate passed on ${units.length} units at ${pts} points and ${n} paths of the tuning seed ${PRE_SEED} (the stamp check skipped: NOT-LAUNCHED); the reading below exercises the code, no figure is read\n`);
  reading(units, stage, TR, console.log, n, Number(seed));
}
