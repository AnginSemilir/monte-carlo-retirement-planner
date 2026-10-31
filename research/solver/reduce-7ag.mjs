/*
 * THE 7AG REDUCER: THE CANDIDATE BUNDLE AGAINST THE SHIPPING DEFAULT ON THE NINE REMAINING PANEL HOUSEHOLDS
 * (predictions/diag-7ag.md; PLAN.md 7ag; the deep review after 7af, deep-review-log.md 29 Sep 03:07 UK). Reads
 * results/diag7ag/case*.txt (batch-7ag.sh: audit-s126.mjs diag7ag, one process a unit; 7aa's line format, parsed by
 * reduce-7aa.mjs parse) and every unit's trace. 7af's design on the nine households of 7e's panel 7af did not run; none
 * was run by 7aa or 7af, so there is no identity gate against earlier runs.
 * THE GATE, before any figure:
 *   - the stamps (fair-gate.mjs requireFairLogs) under predictions/diag-7ag.md;
 *   - every registered unit once and done: CAND (READER/TS+J/W0.02), SHIP (OFF/PRODUCT/W0.02) and PRODR
 *     (READER/PRODUCT/W0.02) on each of the nine (every one has a bridge); nothing unregistered;
 *   - each unit's settings the registered ones (the product's settings, the estate weight 0.02, 30 points, 16,000 paths of
 *     seed 7002, lambda held, 5 return points, the final year exact, margin 0.001); the tier state and one move for every
 *     world on CAND alone; the bridge read the arm's; within a household every solve's ran line equal once the tier state
 *     and the bridge read are taken out, the scale, the cap and the risk-above decision equal;
 *   - every trace: its count, seed, arm, stamp and survival are the log's.
 * THE ITEMS, by the registered rule (7af's two, Holm across the nine):
 *   1. No material harm: CAND against SHIP on each household, paired on the same 16,000 paths - the exact one-sided McNemar
 *      p, Holm across the 9, the exact 95% interval against the household's margin FIXED AT REGISTRATION (MARGIN below:
 *      from 7e's off survival over 1,000 paths of seed 7002, results-7e-readgap.txt, 0.25 at 95% or more and 0.5 below;
 *      S124, at 95.1 on the line, fixed at the stricter 0.25): stats.mjs outcome(). HELD when every household reads no
 *      material harm; FALSIFIED when any reads harm; else INCONCLUSIVE. The unconditional interval beside, and S124's
 *      reading at 0.5 reported beside (not the item).
 *   2. Spending while both spend (reduce-7af.mjs spendBoth, spendChange): HELD when every household's lower end is above
 *      -5% AND the nine's mean's lower end above -1%; FALSIFIED when any household's upper end is below -5% OR the mean's
 *      upper end below -1%; else INCONCLUSIVE. The old measure (a failed path's years 0) reported beside.
 *   3. S126's attribution (the plan-auditor's BLOCKING 1 of 29 Sep, O51): TSOFF, TS+J under off on S126 (OFF/TS+J/W0.02),
 *      run alone at 7af's 8,000 paths of seed 7002 so it pairs path by path with 7af's S126 units (read through 7af's own
 *      gates: the stamps, 7aa's gate, 7af's gate, 7af's traces; TSOFF's code id gated equal to 7af's). The item reads CAND
 *      against TSOFF - the reader on top of the tier state, the two candidates on S126 - at the margin 0.25 (the
 *      plan-auditor's FAIL of the first registration, 29 Sep: the question is whether the reader's harm survives under the
 *      tier state, and the conditional interval reads too kindly when the change is one-sided, RULES.md 8.1). HELD (the
 *      repair: the reader does no material harm under the tier state) when the guarded unconditional interval's lower end
 *      is above -0.25; FALSIFIED (the reader's harm stands, masked by a gain of the tier state's own) when the exact
 *      one-sided p is below 0.05 and the point loss is at least 0.25 (stats.mjs outcome's harm); else INCONCLUSIVE. TSOFF
 *      against SHIP (the tier state's own gain) reported beside with both intervals, and TSOFF's ran line gated equal to
 *      7af's S126 solves once the tier state and the bridge read are taken out.
 * Reported, not items: every unit's table, survival, gap and opening (O44), estate, years below target, tier changes;
 * the reader's part (PRODR against SHIP) and the tier state's part (CAND against PRODR) on each household, exact
 * intervals; the whole score (reduce-7aa.mjs wholeLeg at 0.05) of CAND against SHIP; and, where a household reads harm,
 * the registered split (reduce-7af.mjs's rule).
 *   node research/solver/reduce-7ag.mjs [dir7ag] > research/solver/results-7ag.txt
 *   node research/solver/reduce-7ag.mjs --planted   the planted checks alone
 */
import { readFileSync, existsSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import { survivalChange, survivalChangeU, mcnemarHarmP, holm, outcome, zFor } from './stats.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './reduce-7v.mjs';
import * as A from './reduce-7aa.mjs';
import { spendYears, spendPaths, spendBoth, spendChange, sameBits } from './reduce-7af.mjs';
import * as F from './reduce-7af.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-7ag.md';
export const { field, LAMBDA, LEVELS } = A;
export const N = 16000, SEED = '7002', PTS = '30', W = '0.02', ALPHA = 0.05, SIM_TOL = 5e-5 + 1e-9, SPEND_H = -0.05, SPEND_M = -0.01;
// the panel: the nine households of 7e's panel 7af did not run, in 7e's order, each with its bridge years
export const PANEL = [['S124', 2], ['S128', 2], ['S130', 2], ['S366', 8], ['S370', 8], ['bridge 4+cost', 4], ['S162', 2], ['S172', 2], ['S168', 2]];
// the no-harm margins, fixed at registration (7e's off survival, results-7e-readgap.txt and the bridge7e logs: S124 95.1,
// S128 69.9, S130 84.3, S366 99.2, S370 73.1, bridge 4+cost 96.0, S162 99.2, S172 99.0, S168 100.0); S124 at the stricter
export const MARGIN = { S124: 0.25, S128: 0.5, S130: 0.5, S366: 0.25, S370: 0.5, 'bridge 4+cost': 0.25, S162: 0.25, S172: 0.25, S168: 0.25 };
export const CAND = ['READER', `TS+J/W${W}`], SHIP = ['OFF', `PRODUCT/W${W}`], PRODR = ['READER', `PRODUCT/W${W}`];
export const TSOFF = ['OFF', `TS+J/W${W}`], N_S126 = 8000;
export const UNITS = [...PANEL.map(([id]) => [id, ...CAND]), ...PANEL.map(([id]) => [id, ...SHIP]), ...PANEL.filter(([, b]) => b > 0).map(([id]) => [id, ...PRODR]), ['S126', ...TSOFF]];
export const isTsoff = u => u.id === 'S126' && u.arm === TSOFF[0] && u.label === TSOFF[1];
const nOf = (u, n) => (isTsoff(u) ? (n === N ? N_S126 : n) : n);
export const parse = A.parse;

/* 7ag's gate. `ref126` 7af's parsed S126 units (SHIP, PRODR, CAND), for TSOFF's settings; `n` the nine's path count (TSOFF
   runs at 8,000 when the nine run at 16,000; a preflight passes one count for all) */
export function gate(units, n = N, pts = PTS, ref126 = null) {
  const bad = [];
  for (const [id, arm, l] of UNITS) { const k = units.filter(u => u.id === id && u.arm === arm && u.label === l).length; if (k !== 1) bad.push(`${id} ${arm}/${l}: ${k} unit lines, not 1`); }
  const strip = s => (s || '').replace(/ tierState \S+/, '').replace(/ bridgeRead \S+/, '');
  for (const u of units) {
    const tag = `${u.id} ${u.arm}/${u.label}`;
    if (!UNITS.some(([id, a, l]) => id === u.id && a === u.arm && l === u.label)) { bad.push(`${tag}: not a registered unit`); continue; }
    if (u.lambda !== LAMBDA || u.tier !== 'own' || u.riskAbove !== 'auto' || u.mix !== '3') bad.push(`${tag}: unit line settings ${u.lambda} ${u.tier} ${u.riskAbove} ${u.mix}`);
    const ts = u.label.startsWith('TS+J');
    if (u.table === undefined) bad.push(`${tag}: no solve line`);
    if (!u.ran) bad.push(`${tag}: no ran line`);
    else {
      const want = { mix: '3', pts, seed: SEED, paths: String(nOf(u, n)), grid: `total${pts}x6x6`, lambda: LAMBDA, levels: LEVELS, raiseSurv: 'true', failShort: 'floor', quad: '5', finalIntegral: 'true', bequestWeight: W, bridgeRead: u.arm === 'READER' ? 'reader' : 'false' };
      for (const [k, v] of Object.entries(want)) if (field(u.ran, k) !== v) bad.push(`${tag}: ${k} is ${field(u.ran, k)}, the prediction names ${v}`);
      if (!!field(u.ran, 'tierState') !== ts) bad.push(`${tag}: ran tierState ${field(u.ran, 'tierState')}`);
      for (const k of ['holdTier', 'bridgeStep', 'readerRef', 'switchMargin']) if (field(u.ran, k) !== null) bad.push(`${tag}: ran ${k} ${field(u.ran, k)}`);
    }
    if (!u.gap) bad.push(`${tag}: no year-0 gap line`);
    if (!u.joint) bad.push(`${tag}: no joint line`);
    else {
      if (u.joint.joint !== ts) bad.push(`${tag}: ran jointWorlds ${u.joint.joint}`);
      if (u.joint.margin !== '0.001') bad.push(`${tag}: solved with switch margin ${u.joint.margin}`);
      // the whole score reads the pot as the estate: a pension death charge would make it gross, not net (reduce-7aa.mjs's guard; the deep review of 29 Sep 08:56 UK)
      if (u.joint.deathTax !== 0) bad.push(`${tag}: a pension death charge ${u.joint.deathTax}`);
      if (u.joint.tier !== 'own') bad.push(`${tag}: plan tier ${u.joint.tier}`);
    }
    if (u.worlds.length) bad.push(`${tag}: world lines, not registered`);
    if (!u.run) bad.push(`${tag}: no run line`);
    if (!u.done) bad.push(`${tag}: no done line`);
    if (isTsoff(u)) {
      // TSOFF against 7af's S126 solves: the same settings once the tier state and the bridge read are taken out
      if (!ref126 || ref126.length !== 3) bad.push(`${tag}: 7af's three S126 units not given`);
      else for (const v of ref126) {
        if (u.ran && strip(u.ran) !== strip(v.ran)) bad.push(`${tag}: differs from 7af's S126 ${v.arm}/${v.label} beyond the tier state and the bridge read`);
        if (u.joint && (u.joint.scale !== v.joint.scale || u.joint.cap !== v.joint.cap || u.joint.decided !== v.joint.decided)) bad.push(`${tag}: scale, cap or risk-above decision differs from 7af's S126 ${v.arm}/${v.label}`);
      }
      continue;
    }
    const ref = units.find(v => v.id === u.id && v.ran), refJ = units.find(v => v.id === u.id && v.joint);
    if (u.ran && ref && strip(u.ran) !== strip(ref.ran)) bad.push(`${tag}: differs from another solve of the household beyond the tier state and the bridge read`);
    if (u.joint && refJ && (u.joint.scale !== refJ.joint.scale || u.joint.cap !== refJ.joint.cap || u.joint.decided !== refJ.joint.decided)) bad.push(`${tag}: scale, cap or risk-above decision differs within the household`);
  }
  return bad;
}
export const traceName = A.traceName;
export const traceAgrees = (j, ST, arm, l, sim, n = N) => !!(j && ST && j.stamp && j.N === n && String(j.seed) === SEED && j.arm === `${arm}/${l}` && ['code', 'audit', 'prediction', 'sha'].every(k => j.stamp[k] === ST[k]) && Math.abs(j.sim - sim) <= SIM_TOL);

const tri = (yes, no) => (yes ? 'HELD' : no ? 'FALSIFIED' : 'INCONCLUSIVE');
/* THE ITEMS. `K(id, b, a)` the paired cells of arm b against arm a; `SP(id)` CAND's spending change against SHIP and its
   per-path relative differences; `margin(id)` the household's registered margin (MARGIN; a planted check may pass another) */
export function items(K, SP, margin = id => MARGIN[id]) {
  const out = [];
  { const legs = PANEL.map(([id]) => { const k = K(id, 'CAND', 'SHIP'); return { id, k, p: mcnemarHarmP(k.lost, k.saved), margin: margin(id) }; });
    const adj = holm(legs.map(l => l.p));
    legs.forEach((l, i) => { l.pHolm = adj[i]; const o = outcome({ b: l.k.lost, c: l.k.saved, N: l.k.N, margin: l.margin, pHolm: l.pHolm, level: ALPHA }); l.iv = o; l.o = o.outcome; });
    out.push({ n: 1, text: `no material harm: the candidate (READER/TS+J) against the shipping default (OFF/PRODUCT) on every household, the exact rule with Holm across the ${PANEL.length}, each at its registered margin (FALSIFIED: harm on any)`, legs,
      outcome: tri(legs.every(l => l.o === 'no material harm'), legs.some(l => l.o === 'harm')) }); }
  { const legs = PANEL.map(([id]) => ({ id, ...SP(id).change })), diffs = PANEL.map(([id]) => SP(id));
    const nP = diffs[0].rel.length; const m = new Float64Array(nP);
    for (const x of diffs) for (let i = 0; i < nP; i++) m[i] += x.rel[i] / diffs.length;
    let mu = 0; for (let i = 0; i < nP; i++) mu += m[i]; mu /= nP; let v = 0; for (let i = 0; i < nP; i++) v += (m[i] - mu) ** 2;
    const se = Math.sqrt(v / (nP - 1) / nP), z = zFor(ALPHA), mean = { d: mu, lo: mu - z * se, hi: mu + z * se };
    out.push({ n: 2, text: `spending while both arms spend: no household's spending more than 5% lower and the mean of the ${PANEL.length} not more than 1% lower, each by its 95% interval (FALSIFIED: a household's upper end below -5% or the mean's below -1%)`, legs, mean,
      outcome: tri(legs.every(l => l.lo > SPEND_H) && mean.lo > SPEND_M, legs.some(l => l.hi < SPEND_H) || mean.hi < SPEND_M) }); }
  return out;
}
/* ITEM 3: S126's attribution. `r` the cells of CAND against TSOFF (the item), `t` of TSOFF against SHIP (beside); 7af's paths */
export const M3 = 0.25;
export function item3(t, r) {
  const it = survivalChange(t.lost, t.saved, t.N, ALPHA), ut = guardedU(t), ir = survivalChange(r.lost, r.saved, r.N, ALPHA), ur = guardedU(r);
  const p = mcnemarHarmP(r.lost, r.saved), o = outcome({ b: r.lost, c: r.saved, N: r.N, margin: M3, pHolm: p, level: ALPHA });
  return { n: 3, text: 'S126\'s attribution: the reader on top of the tier state (CAND against TSOFF, TS+J under off) - HELD (the repair) when the guarded unconditional interval\'s lower end is above -0.25; FALSIFIED (the reader\'s harm stands, masked by a gain of the tier state\'s own) on harm at 0.25 (exact p below 0.05, point loss 0.25 or more)', t, r, it, ut, ir, ur, p,
    outcome: tri(ur.lo > -M3, o.outcome === 'harm') };
}
export const sameCode = (ST, STF) => !!ST && !!STF && ST.code === STF.code;
/* the registered split of a household's harm (reduce-7af.mjs's rule; every household here has a bridge) */
export function split(id, K, margin) {
  const r = K(id, 'PRODR', 'SHIP'), t = K(id, 'CAND', 'PRODR'), lr = 100 * (r.lost - r.saved) / r.N, lt = 100 * (t.lost - t.saved) / t.N;
  const who = [lr >= margin ? 'the reader' : null, lt >= margin ? 'the tier state' : null].filter(Boolean);
  return who.length ? who.join(' and ') : 'neither alone (each part below the margin)';
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  const ranOf = (id, arm, l, o = {}) => `mix 3 pts ${o.pts || 30} seed ${SEED} paths ${o.n || (id === 'S126' ? N_S126 : N)} grid total${o.pts || 30}x6x6 lambda ${LAMBDA} levels ${LEVELS} raiseSurv true failShort floor tiersAbove 0 minPot 29000 quad 5${l.startsWith('TS+J') ? ' tierState 0/0,1/1,2/2' : ''} bequestWeight ${o.w || W} finalIntegral true bridgeRead ${arm === 'READER' ? 'reader' : 'false'}`;
  const unitText = (id, arm, l, o = {}) => {
    const p = ''.padEnd(16), L = `${arm}/${l}`, ts = l.startsWith('TS+J');
    const lines = [`${id.padEnd(16)} case | unit ${L} | lambda ${o.lambda || LAMBDA} tier own riskAbove auto mix 3`,
      `${p} solve ${L}: table ${o.table || '99.5000'} secs 1`, `${p} ran ${L}: ${o.ran || ranOf(id, arm, l, o)}`, `${p} gap ${L}: ${o.gap || '1.0000e-3'} opening 2,2`,
      `${p} joint ${L}: ${o.joint !== undefined ? o.joint : ts} switchMargin ${o.margin || '0.001'} scale ${o.scale || 950000} cap 3800000 deathTax ${o.deathTax || 0} tier own riskAbove ${o.decided || 'off:_no_tier_above_the_plan'}`,
      ...(o.world ? [`${p} world ${L} 0 z -1.7321 weight 0.1667: table 99.0 sim 98.0 paths 1000`] : []),
      `${p} run ${L}: sim ${o.sim || '99.5000'} below 0.10 tier-below 1.00 changes 0.500 estate 100000 secs 1`];
    if (!o.noDone) lines.push(`${p} done ${L}`);
    return lines.join('\n');
  };
  const all = (o = {}, who = () => true) => UNITS.map(([id, a, l]) => unitText(id, a, l, who(id, a, l) ? o : {})).join('\n');
  const R126 = parse([['OFF', `PRODUCT/W${W}`], ['READER', `PRODUCT/W${W}`], ['READER', `TS+J/W${W}`]].map(([a, l]) => unitText('S126', a, l)).join('\n'));
  const refused = (t, r = R126) => String(gate(parse(t), N, PTS, r).length > 0);
  const bent = (id, arm, l, o) => refused(all(o, (i, a, lb) => i === id && a === arm && lb === l));
  const hh = (id, o) => refused(all(o, i => i === id));
  cases.push(['a log parsed and gated: every registered unit, the gate passes', `${parse(all()).length} ${gate(parse(all()), N, PTS, R126).length}`, `${UNITS.length} 0`]);
  cases.push(['the registered units: 9 candidates, 9 shipping defaults, 9 products with the reader, TSOFF on S126', `${UNITS.filter(u => u[1] === 'READER' && u[2].startsWith('TS+J')).length} ${UNITS.filter(u => u[1] === 'OFF' && u[2].startsWith('PRODUCT')).length} ${UNITS.filter(u => u[1] === 'READER' && u[2].startsWith('PRODUCT')).length} ${UNITS.filter(u => u[0] === 'S126' && u[1] === 'OFF' && u[2].startsWith('TS+J')).length}`, '9 9 9 1']);
  // TSOFF: 7af's paths and 7af's S126 settings
  cases.push(['the gate refuses TSOFF at 16,000 paths (it pairs with 7af\'s 8,000)', bent('S126', ...TSOFF, { n: 16000 }), 'true']);
  cases.push(['the gate refuses TSOFF without 7af\'s S126 units', refused(all(), null), 'true']);
  cases.push(['the gate refuses TSOFF whose settings differ from 7af\'s S126 solves (minPot)', bent('S126', ...TSOFF, { ran: ranOf('S126', 'OFF', `TS+J/W${W}`).replace('minPot 29000', 'minPot 30000') }), 'true']);
  cases.push(['the gate refuses TSOFF at another scale than 7af\'s S126', bent('S126', ...TSOFF, { scale: 950001 }), 'true']);
  cases.push(['the gate refuses TSOFF solved per world', bent('S126', ...TSOFF, { joint: false }), 'true']);
  cases.push(['the gate refuses TSOFF with the reader on', bent('S126', ...TSOFF, { ran: ranOf('S126', 'READER', `TS+J/W${W}`) }), 'true']);
  cases.push(['every household has a registered margin of 0.25 or 0.5, S124 at 0.25', `${PANEL.every(([id]) => MARGIN[id] === 0.25 || MARGIN[id] === 0.5)} ${MARGIN.S124}`, 'true 0.25']);
  cases.push(['the gate refuses a missing unit', refused(UNITS.slice(1).map(([id, a, l]) => unitText(id, a, l)).join('\n')), 'true']);
  cases.push(['the gate refuses a unit run twice', refused(all() + '\n' + unitText('S130', ...SHIP)), 'true']);
  cases.push(['the gate refuses an unregistered unit (a household 7af ran)', refused(all() + '\n' + unitText('S126', ...CAND)), 'true']);
  cases.push(['the gate refuses another lambda on the unit line', bent('S168', ...CAND, { lambda: '0.03' }), 'true']);
  cases.push(['the gate refuses another estate weight (on every unit of a household)', hh('S128', { w: '0' }), 'true']);
  cases.push(['the gate refuses 7af\'s 8,000 paths (on every unit of a household)', hh('S366', { n: 8000 }), 'true']);
  cases.push(['the gate refuses other points (on every unit of a household)', hh('S162', { pts: 16 }), 'true']);
  cases.push(['the gate refuses a points field alone off the registered one (the grid name unchanged)', refused(UNITS.map(([id, a, l]) => unitText(id, a, l, id === 'S172' ? { ran: ranOf(id, a, l).replace('pts 30 ', 'pts 16 ') } : {})).join('\n')), 'true']);
  cases.push(['the gate refuses a switchMargin on every unit of a household', refused(UNITS.map(([id, a, l]) => unitText(id, a, l, id === 'S370' ? { ran: `${ranOf(id, a, l)} switchMargin 0.001` } : {})).join('\n')), 'true']);
  cases.push(['the gate refuses a missing solve line', refused(all().replace(`solve READER/TS+J/W0.02: table 99.5000 secs 1`, `slve READER/TS+J/W0.02: table 99.5000 secs 1`)), 'true']);
  cases.push(['the gate refuses the tier state on SHIP', bent('S124', ...SHIP, { ran: ranOf('S124', 'OFF', 'TS+J/W0.02') }), 'true']);
  cases.push(['the gate refuses the reader on SHIP', bent('S130', ...SHIP, { ran: ranOf('S130', 'READER', 'PRODUCT/W0.02') }), 'true']);
  cases.push(['the gate refuses CAND solved per world', bent('S124', ...CAND, { joint: false }), 'true']);
  cases.push(['the gate refuses a solve at margin 0', bent('bridge 4+cost', ...CAND, { margin: '0' }), 'true']);
  cases.push(['the gate refuses a switchMargin on the ran line', bent('S162', ...SHIP, { ran: `${ranOf('S162', 'OFF', 'PRODUCT/W0.02')} switchMargin 0` }), 'true']);
  cases.push(['the gate refuses a settings difference within a household (minPot)', bent('S128', ...PRODR, { ran: ranOf('S128', 'READER', 'PRODUCT/W0.02').replace('minPot 29000', 'minPot 30000') }), 'true']);
  cases.push(['the gate refuses a pension death charge (on every unit of a household)', refused(all({ deathTax: 0.45 }, i => i === 'S128')), 'true']);
  cases.push(['the gate refuses another scale within a household', bent('S168', ...SHIP, { scale: 950001 }), 'true']);
  cases.push(['the gate refuses another risk-above decision within a household', bent('S366', ...CAND, { decided: 'on:_tier_above' }), 'true']);
  cases.push(['the gate takes a risk-above decision that differs between households', refused(all({ decided: 'on:_tier_above' }, i => i === 'S366')), 'false']);
  cases.push(['the gate refuses a world line (not registered)', bent('S172', ...CAND, { world: true }), 'true']);
  cases.push(['the gate refuses a missing done line', bent('S370', ...PRODR, { noDone: true }), 'true']);
  { const ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' }, t = (sim, n = N) => ({ stamp: ST, N: n, seed: 7002, arm: 'READER/TS+J/W0.02', sim });
    cases.push(['a trace agrees with the log to four decimals, and not beyond; not at 8,000 paths; not on another arm', `${traceAgrees(t(99.30004), ST, 'READER', 'TS+J/W0.02', 99.3)} ${traceAgrees(t(99.3001), ST, 'READER', 'TS+J/W0.02', 99.3)} ${traceAgrees(t(99.3, 8000), ST, 'READER', 'TS+J/W0.02', 99.3)} ${traceAgrees(t(99.3), ST, 'OFF', 'TS+J/W0.02', 99.3)}`, 'true false false false']); }
  // the traces on files: one unit's trace written to a scratch folder, agreeing, then with its survival off the log's
  { const dir = mkdtempSync(join(tmpdir(), 'p7ag-')), ST = { code: 'c', audit: 'a', prediction: 'p', sha: 's' };
    const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64'), surv = Uint8Array.from({ length: N }, (_, i) => (i % 3 ? 1 : 0)), sim = 100 * surv.reduce((t, x) => t + x, 0) / N;
    const write = s => writeFileSync(join(dir, traceName('S124', 'READER', 'TS+J/W0.02')), gzipSync(JSON.stringify({ id: 'S124', arm: 'READER/TS+J/W0.02', stamp: ST, N, Y: 1, seed: 7002, sim: s, survived: b64(surv), level: b64(new Uint8Array(N)), tier: b64(new Uint8Array(N)), wealth: b64(new Float32Array(N)), taxPaid: b64(new Float32Array(N)), failYear: b64(new Int16Array(N).fill(-1)) })));
    const u = [{ id: 'S124', arm: 'READER', label: 'TS+J/W0.02', run: { sim } }], run1 = () => { const bad = []; loadTraces(u, dir, ST, bad); return bad.length; };
    write(sim); const same = run1(); write(sim + 0.01); const off = run1(); rmSync(dir, { recursive: true, force: true });
    const d2 = mkdtempSync(join(tmpdir(), 'p7ag-')), bad2 = []; loadTraces(u, d2, ST, bad2); rmSync(d2, { recursive: true, force: true });
    cases.push(['the traces on files: an agreeing trace passes, one off the log\'s survival is refused, a missing one is refused', `${same} ${off > 0} ${bad2.length > 0}`, '0 true true']); }
  cases.push(['bits compared path by path (reduce-7af.mjs sameBits)', `${sameBits(Uint8Array.from([1, 0, 1]), Uint8Array.from([1, 0, 1]))} ${sameBits(Uint8Array.from([1, 0, 1]), Uint8Array.from([1, 1, 1]))}`, 'true false']);
  { const X = { N: 3, Y: 3, level: Uint8Array.from([100, 0, 0, 100, 100, 100, 0, 0, 0]) }, Y = { N: 3, Y: 3, level: Uint8Array.from([100, 100, 100, 98, 98, 98, 100, 100, 100]) }, sy3 = spendYears(X, Y);
    const old = spendChange(spendPaths(X, sy3), spendPaths(Y, sy3)), nb = spendBoth(X, Y, sy3), neu = spendChange(nb.a, nb.b);
    cases.push(['survival is not spending (7af\'s measure, reused): +123.5% on the old measure, -1.0% while both spend', `${(100 * old.d).toFixed(1)} ${(100 * neu.d).toFixed(1)} ${nb.idx.join(',')}`, '123.5 -1.0 0,1']); }
  // the items on planted stories
  const mkK = spec => (id, b, a) => { const [saved, lost] = spec[`${id}|${b}|${a}`] || [0, 0]; return { saved, lost, a: N - saved - lost, d: 0, N }; };
  const mkSP = (spec, noise = {}) => id => { const d = spec[id] !== undefined ? spec[id] : 0, e = noise[id] || 0.002, n = 400, rel = Float64Array.from({ length: n }, (_, i) => d + (i % 2 ? e : -e)); const ch = spendChange(Float64Array.from({ length: n }, () => 1), Float64Array.from({ length: n }, (_, i) => 1 + rel[i])); return { change: ch, rel }; };
  const outs = it => it.map(x => `${x.n} ${x.outcome}`).join(', ');
  const leg = (spec, id, m) => items(mkK(spec), mkSP({}), m)[0].legs.find(l => l.id === id);
  cases.push(['nothing differs: 1 HELD, 2 HELD', outs(items(mkK({}), mkSP({}))), '1 HELD, 2 HELD']);
  cases.push(['a clear loss on one household (0 saved, 120 lost of 16,000 at 0.25): 1 FALSIFIED', items(mkK({ 'S162|CAND|SHIP': [0, 120] }), mkSP({}))[0].outcome, 'FALSIFIED']);
  cases.push(['S124 at 7e\'s reader rate (-0.57: 16 saved, 107 lost of 16,000) reads harm at its registered 0.25', leg({ 'S124|CAND|SHIP': [16, 107] }, 'S124').o, 'harm']);
  cases.push(['the margin is the registered one, not the run\'s survival: 0 saved, 60 lost (-0.375) reads harm on S124 (0.25) and no material harm on S128 (0.5)', `${leg({ 'S124|CAND|SHIP': [0, 60] }, 'S124').o} ${leg({ 'S128|CAND|SHIP': [0, 60] }, 'S128').o}`, 'harm no material harm']);
  cases.push(['a margin passed in is read: the same S124 loss at 0.5 reads no material harm (the reported beside)', leg({ 'S124|CAND|SHIP': [0, 60] }, 'S124', id => (id === 'S124' ? 0.5 : MARGIN[id])).o, 'no material harm']);
  cases.push(['a loss inside the margin whose interval reaches past it (10 saved, 44 lost of 16,000 at 0.25: -0.21, to -0.29): 1 INCONCLUSIVE', items(mkK({ 'S162|CAND|SHIP': [10, 44] }), mkSP({}))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['a gain everywhere is no harm: 1 HELD', items(mkK(Object.fromEntries(PANEL.map(([id]) => [`${id}|CAND|SHIP`, [80, 0]]))), mkSP({}))[0].outcome, 'HELD']);
  cases.push(['Holm across 9: 0 saved, 5 lost (p 0.031 alone) is not harm', leg({ 'S172|CAND|SHIP': [0, 5] }, 'S172').o === 'harm' ? 'harm' : 'not harm', 'not harm']);
  cases.push(['Holm matters: 280 saved, 330 lost of 16,000 (-0.313, p 0.024 alone) is harm alone but not after Holm across 9: 1 INCONCLUSIVE', items(mkK({ 'S162|CAND|SHIP': [280, 330] }), mkSP({}))[0].outcome, 'INCONCLUSIVE']);
  cases.push(['item 1 reads CAND against SHIP, not PRODR: a loss against PRODR alone is HELD', items(mkK({ 'S124|CAND|PRODR': [0, 160] }), mkSP({}))[0].outcome, 'HELD']);
  cases.push(['spending 6% lower on one household: 2 FALSIFIED', items(mkK({}), mkSP({ S168: -0.06 }))[1].outcome, 'FALSIFIED']);
  cases.push(['spending 4% lower on one household (the mean -0.44%): 2 HELD', items(mkK({}), mkSP({ S168: -0.04 }))[1].outcome, 'HELD']);
  cases.push(['spending 1.5% lower on every household: 2 FALSIFIED by the mean', items(mkK({}), mkSP(Object.fromEntries(PANEL.map(([id]) => [id, -0.015]))))[1].outcome, 'FALSIFIED']);
  cases.push(['spending 1% lower on every household (the mean at the line): 2 INCONCLUSIVE', items(mkK({}), mkSP(Object.fromEntries(PANEL.map(([id]) => [id, -0.01]))))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['item 2 reads the interval: 4.9% lower with a wide interval is INCONCLUSIVE', items(mkK({}), mkSP({ S168: -0.049 }, { S168: 0.2 }))[1].outcome, 'INCONCLUSIVE']);
  cases.push(['spending higher is never a fault: +6% on one household: 2 HELD', items(mkK({}), mkSP({ S168: 0.06 }))[1].outcome, 'HELD']);
  // item 3 at 7af's 8,000 paths: CAND against TSOFF is the item
  const c8 = (saved, lost) => ({ saved, lost, a: N_S126 - saved - lost, d: 0, N: N_S126 });
  cases.push(['item 3: the repair - TSOFF as SHIP (3 saved), CAND as TSOFF (0 differ): HELD', item3(c8(3, 0), c8(0, 0)).outcome, 'HELD']);
  cases.push(['item 3: the harm masked - TSOFF gains 47 on SHIP, CAND loses 47 against TSOFF (3 saved): FALSIFIED', item3(c8(47, 0), c8(3, 47)).outcome, 'FALSIFIED']);
  cases.push(['item 3: one-sided 19 lost of 8,000 against TSOFF (-0.24; the conditional interval ends at -0.237, the unconditional past -0.25): INCONCLUSIVE, not HELD', item3(c8(19, 0), c8(0, 19)).outcome, 'INCONCLUSIVE']);
  cases.push(['item 3: TSOFF clearly below SHIP (30 lost), so CAND gains on TSOFF: HELD (no gain of the tier state\'s own)', item3(c8(0, 30), c8(30, 0)).outcome, 'HELD']);
  cases.push(['item 3 reads CAND against TSOFF, not TSOFF against SHIP', item3(c8(47, 0), c8(0, 0)).outcome, 'HELD']);
  cases.push(['item 3: a loss of 0.3 against TSOFF with churn (10 saved, 34 lost): not HELD', item3(c8(0, 0), c8(10, 34)).outcome === 'HELD' ? 'HELD' : 'not HELD', 'not HELD']);
  cases.push(['item 3: the unconditional interval printed beside TSOFF against SHIP too', String(Number.isFinite(item3(c8(19, 0), c8(0, 0)).ut.lo)), 'true']);
  cases.push(['TSOFF\'s code id must be 7af\'s', `${sameCode({ code: 'x' }, { code: 'x' })} ${sameCode({ code: 'x' }, { code: 'y' })} ${sameCode(null, { code: 'x' })}`, 'true false false']);
  cases.push(['the split: a loss of the margin in PRODR against SHIP is the reader\'s', split('S124', mkK({ 'S124|PRODR|SHIP': [0, 60], 'S124|CAND|PRODR': [0, 0] }), 0.25), 'the reader']);
  cases.push(['the split: a loss of the margin in CAND against PRODR is the tier state\'s', split('S124', mkK({ 'S124|PRODR|SHIP': [0, 0], 'S124|CAND|PRODR': [0, 60] }), 0.25), 'the tier state']);
  cases.push(['the split: both', split('S370', mkK({ 'S370|PRODR|SHIP': [0, 100], 'S370|CAND|PRODR': [0, 100] }), 0.5), 'the reader and the tier state']);
  cases.push(['the split: neither alone', split('S370', mkK({ 'S370|PRODR|SHIP': [0, 50], 'S370|CAND|PRODR': [0, 50] }), 0.5), 'neither alone (each part below the margin)']);
  let nbad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) nbad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (nbad) { console.log(`PLANTED CHECK FAILED: ${nbad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export const stampOf = logs => { const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0] || ''); return st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null; };
const f3 = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const readTrace = f => JSON.parse(gunzipSync(readFileSync(f)).toString());

/* THE TRACES: every unit's trace, checked against the log; `bad` gains every refusal */
export function loadTraces(units, DIR, ST, bad, n = N) {
  const TR = {};
  for (const u of units) {
    const f = join(DIR, traceName(u.id, u.arm, u.label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); continue; }
    const t = readTrace(f);
    if (!traceAgrees(t, ST, u.arm, u.label, u.run.sim, nOf(u, n))) { bad.push(`${f}: count, seed, arm, stamp or survival is not the log's`); continue; }
    TR[`${u.id}|${u.arm}|${u.label}`] = decode(t);
  }
  return TR;
}
const ARMS = { CAND, SHIP, PRODR };
/* THE READING, after every gate has passed (the preflight runs it over its own tiny logs) */
export function reading(units, TR, out = console.log, n = N, T126 = null) {
  const U = (id, k) => units.find(u => u.id === id && u.arm === ARMS[k][0] && u.label === ARMS[k][1]);
  const T = (id, k) => TR[`${id}|${ARMS[k][0]}|${ARMS[k][1]}`];
  const K = (id, b, a) => cells(T(id, a).survived, T(id, b).survived);
  const SP = id => { const X = T(id, 'SHIP'), Y = T(id, 'CAND'), sy = spendYears(X, Y), sb = spendBoth(X, Y, sy), change = spendChange(sb.a, sb.b), N0 = X.N, rel = new Float64Array(N0), k = sb.a.length; let ma = 0; for (const x of sb.a) ma += x; ma /= k; sb.idx.forEach((pi, j) => { rel[pi] = (sb.b[j] - sb.a[j]) / ma * N0 / k; }); return { change, rel, kept: k, old: spendChange(spendPaths(X, sy), spendPaths(Y, sy)) }; };
  out(`7AG: THE CANDIDATE BUNDLE (THE BRIDGE READER WITH THE JOINT TIER STATE) AGAINST THE SHIPPING DEFAULT (NO BRIDGE READ, THE PRODUCT'S TABLES) ON THE NINE REMAINING PANEL HOUSEHOLDS (predictions/diag-7ag.md; ${n} paths of seed ${SEED}, the estate weight ${W}; the fair-test gates passed: the stamps, 7ag's gate and every trace)\n`);
  out('EVERY UNIT: the table, the simulated survival, the year-0 gap and opening (O44), years below target, tier changes and estate');
  const uT = units.find(isTsoff);
  for (const [id] of [...PANEL, ['S126']]) for (const k of ['SHIP', 'PRODR', 'CAND', 'TSOFF']) { const u = k === 'TSOFF' ? (id === 'S126' ? uT : null) : (id === 'S126' ? null : U(id, k)); if (!u) continue; out(`  ${`${id} ${k}`.padEnd(20)} table ${u.table} sim ${u.run.sim.toFixed(2)} gap ${u.gap.gap} (opening ${u.gap.open1e3},${u.gap.open0}) below ${u.run.below.toFixed(2)} changes ${u.run.changes.toFixed(3)} estate ${u.run.estate} | risk above ${u.joint.decided}`); }
  out('\nTHE PARTS on each household (exact 95% intervals, paired): the reader (PRODR against SHIP) and the tier state (CAND against PRODR)');
  for (const [id] of PANEL) { const r = K(id, 'PRODR', 'SHIP'), t = K(id, 'CAND', 'PRODR'), ir = survivalChange(r.lost, r.saved, r.N, ALPHA), it = survivalChange(t.lost, t.saved, t.N, ALPHA); out(`  ${id.padEnd(14)} reader ${r.saved}/${r.lost} ${f3(ir.d)} (${ir.lo.toFixed(3)} to ${ir.hi.toFixed(3)}) | tier state ${t.saved}/${t.lost} ${f3(it.d)} (${it.lo.toFixed(3)} to ${it.hi.toFixed(3)})`); }
  out('\nTHE WHOLE SCORE, CAND against SHIP (reduce-7aa.mjs wholeLeg at 0.05; the estate weight the runs\')');
  for (const [id] of PANEL) { const u = U(id, 'CAND'), X = T(id, 'SHIP'), Y = T(id, 'CAND'); const cfg = { lambda: Number(field(u.ran, 'lambda')), floor: Math.min(...field(u.ran, 'levels').split(',').map(Number)), scale: u.joint.scale, cap: u.joint.cap, wb: Number(W), spendYears: spendYears(X, Y) }; const w = A.wholeLeg(X, Y, cfg, ALPHA); out(`  ${id.padEnd(14)} ${f3(w.d)} (${w.lo.toFixed(3)} to ${w.hi.toFixed(3)}; survival part ${f3(w.sd)}, the rest ${f3(w.rest)})`); }
  const it = items(K, SP);
  out('\nTHE ITEMS (each read by its registered rule)');
  for (const x of it) {
    out(`${x.n}. ${x.text}: ${x.outcome}`);
    if (x.n === 1) {
      for (const l of x.legs) { const u = guardedU(l.k); out(`     ${l.id.padEnd(14)} ${l.k.saved} saved/${l.k.lost} lost of ${l.k.N}  p ${l.p.toExponential(1)}  Holm ${l.pHolm.toExponential(1)}  change ${f3(l.iv.d)} (${l.iv.lo.toFixed(3)} to ${l.iv.hi.toFixed(3)}; unconditional ${u.lo.toFixed(3)} to ${u.hi.toFixed(3)})  margin ${l.margin}  -> ${l.o}${l.o === 'harm' ? `; carried by ${split(l.id, K, l.margin)}` : ''}`); }
      const s = items(K, SP, id => (id === 'S124' ? 0.5 : MARGIN[id]))[0].legs.find(l => l.id === 'S124');
      out(`     reported beside, not the item: S124 at the 0.5 margin -> ${s.o}`);
    }
    if (x.n === 2) { for (const l of x.legs) { const o = SP(l.id); out(`     ${l.id.padEnd(14)} while both spend (${o.kept} paths) ${l.a.toFixed(4)} -> ${l.b.toFixed(4)}: ${f3(100 * l.d)}% (${(100 * l.lo).toFixed(3)} to ${(100 * l.hi).toFixed(3)}) | reported, a failed path's years 0: ${f3(100 * o.old.d)}%`); } out(`     the mean of the ${PANEL.length} ${f3(100 * x.mean.d)}% (${(100 * x.mean.lo).toFixed(3)} to ${(100 * x.mean.hi).toFixed(3)})`); }
  }
  { const Tt = TR[`S126|${TSOFF[0]}|${TSOFF[1]}`], t = cells(T126.SHIP.survived, Tt.survived), r = cells(Tt.survived, T126.CAND.survived), x = item3(t, r);
    out(`${x.n}. ${x.text}: ${x.outcome}`);
    out(`     CAND (7af's) against TSOFF, the reader on top of the tier state  ${r.saved} saved/${r.lost} lost of ${r.N}  p ${x.p.toExponential(1)}  change ${f3(x.ir.d)} (exact ${x.ir.lo.toFixed(3)} to ${x.ir.hi.toFixed(3)}; unconditional, guarded, ${x.ur.lo.toFixed(3)} to ${x.ur.hi.toFixed(3)})`);
    out(`     reported beside: TSOFF against SHIP (7af's), the tier state's own gain  ${t.saved} saved/${t.lost} lost  change ${f3(x.it.d)} (exact ${x.it.lo.toFixed(3)} to ${x.it.hi.toFixed(3)}; unconditional, guarded, ${x.ut.lo.toFixed(3)} to ${x.ut.hi.toFixed(3)})`);
    it.push(x); }
  out(`\nOUTCOME: ${it.map(x => `${x.n} ${x.outcome}`).join(', ')}`);
  return it;
}
const guardedU = k => A.guarded(survivalChangeU(k.a, k.lost, k.saved, k.d, ALPHA), k.lost, k.saved, k.N, ALPHA);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { planted(); } catch (e) { console.log(`PLANTED CHECK FAILED: the planted set threw (${e.message})`); process.exit(1); }
  if (process.argv.includes('--planted')) process.exit(0);
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diag7ag'), DIRF = args[1] || join(HERE, 'results', 'diag7af'), DIRA = args[2] || join(HERE, 'results', 'diag7aa');
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (UNITS.some(([id, a, l]) => !units.some(u => u.id === id && u.arm === a && u.label === l && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} units done in ${DIR}`); process.exit(1); }
  // 7af's S126 units, read only through 7af's own gates (the stamps, 7aa's gate, 7af's gate with 7aa's identity, the traces)
  const logsA = logsOf(DIRA), unitsA = Object.values(logsA).flatMap(A.parse);
  requireFairLogs(logsA, A.PRED);
  { const b = A.gate(unitsA); if (b.length) { console.log(`FAIR-TEST GATE (7aa): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
  const refA = (id, arm, l) => unitsA.find(u => u.id === id && u.arm === arm && u.label === l) || null;
  const logsF = logsOf(DIRF), unitsF = Object.values(logsF).flatMap(F.parse);
  requireFairLogs(logsF, F.PRED);
  { const b = F.gate(unitsF, refA); if (b.length) { console.log(`FAIR-TEST GATE (7af): FAILED\n  ${b.join('\n  ')}`); process.exit(1); } }
  const u126 = unitsF.filter(u => u.id === 'S126'), badF = [], TRF = F.loadTraces(u126, DIRF, stampOf(logsF), badF, DIRA, stampOf(logsA), refA);
  if (badF.length) { console.log(`FAIR-TEST GATE (7af's S126 traces): FAILED\n  ${badF.join('\n  ')}`); process.exit(1); }
  const T126 = { SHIP: TRF[`S126|${SHIP[0]}|${SHIP[1]}`], CAND: TRF[`S126|${CAND[0]}|${CAND[1]}`] };
  requireFairLogs(logs, PRED);
  const bad = gate(units, N, PTS, u126), ST = stampOf(logs);
  if (!sameCode(ST, stampOf(logsF))) bad.push(`TSOFF's code id ${ST && ST.code} is not 7af's ${stampOf(logsF) && stampOf(logsF).code}: item 3's pairing across the two runs needs the same solver code`);
  const TR = bad.length ? {} : loadTraces(units, DIR, ST, bad);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  reading(units, TR, console.log, N, T126);
}
