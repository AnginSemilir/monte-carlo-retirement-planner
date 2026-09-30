/*
 * PHASE 6e, THE CODE'S OWN GATE. Three arms were added to the grid for the fidelity screen:
 * re-spaced gain buckets (`gainBuckets`, which already existed), an interpolated gain axis
 * (`gainInterp`) and a lump-sum axis whose bucket 0 is reachable only by a state that has taken
 * nothing (`pclsStrict`). All three default OFF, and the first thing this checks is that the shipped
 * build did not move.
 *
 * The distinction the screen turns on, and which B4 pins down: arm 3 removes the SNAPPING, not the
 * CEILING. Above the top bucket the axis stays flat. Arm 2 moves the ceiling. They are measured apart
 * on purpose, because one is free and the other is not.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, nearestIndex } from '../../src/solver/solve.js';
import { makeGrid, locateVec, interp, vecOf, readValues } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...p, config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const sc = singles.find(s => s.id === 'S300');          // worst household on the gain axis: 89.0%
const plan = prep(sc.plan);
const m = M.prepare(E, plan, {});
const LSA = m.P.lsa;
/* a probe vector: pen, isa, taxable, gain fraction, allowance used, lump taken, cash ISA */
const vec = (gf, used) => Float64Array.from([300000, 120000, 90000, gf, used, used > 0 ? 1 : 0, 0]);

const ONLY = process.env.GRIDFID_ONLY || '';   // 'E': section E alone (research/solver/mutate-grid-pclsinterp.py)
console.log('=========== A. THE SHIPPED BUILD DID NOT MOVE ===========');
if (!ONLY || ONLY.includes('A')) {
  const a = solve(E, M, plan, { points: 14 });
  const b = solve(E, M, plan, { points: 14, gainInterp: false, pclsStrict: false, pclsInterp: false });
  const s0 = a.value(M.initialState(a.m), 0), s1 = b.value(M.initialState(b.m), 0);
  ok('A1  the flags off are the flags absent, bit for bit',
    s0.survival === s1.survival && s0.bequest === s1.bequest && s0.resilience === s1.resilience,
    `${s0.survival} vs ${s1.survival}`);
  const g = makeGrid(m, {});
  ok('A2  a grid built with no options has every arm off', g.gainInterp === false && g.pclsStrict === false && g.pclsInterp === false);
}

console.log('=========== B. THE GAIN AXIS ===========');
if (!ONLY || ONLY.includes('B')) {
  const gS = makeGrid(m, {}), gI = makeGrid(m, { gainInterp: true });
  ok('B1  snapping puts 0.39 on the 0.25 bucket and 0.41 on the 0.55 one - a 30-point step on one pound',
    locateVec(gS, vec(0.39, 0)).ig === 1 && locateVec(gS, vec(0.41, 0)).ig === 2);
  const l39 = locateVec(gI, vec(0.39, 0)), l41 = locateVec(gI, vec(0.41, 0));
  ok('B2  interpolating brackets both of them between the same two buckets, with weights either side of half',
    l39.ig === 1 && l41.ig === 1 && l39.igw < 0.5 && l41.igw > 0.5,
    `w(0.39)=${l39.igw.toFixed(3)} w(0.41)=${l41.igw.toFixed(3)}`);
  /*
   * The property here is about the CELL READ, not how the bracket spells it. At 0.25 the bracket
   * returns {i: 0, w: 1} - index 0 carrying no weight and index 1 carrying all of it - which reads
   * exactly the cell snapping reads, written differently. The first draft asserted igw === 0 and
   * failed on its own wording; this asserts the effective index instead.
   */
  const eff = (l) => l.ig * (1 - l.igw) + (l.ig + 1) * l.igw;
  ok('B3  exactly on a bucket, the interpolated read lands on the same cell as the snap',
    [0.05, 0.25, 0.55].every(f => eff(locateVec(gI, vec(f, 0))) === locateVec(gS, vec(f, 0)).ig),
    [0.05, 0.25, 0.55].map(f => `${f}->${eff(locateVec(gI, vec(f, 0)))}`).join(' '));
  /* the claim the screen rests on: arm 3 removes the snap, NOT the ceiling */
  const l55 = locateVec(gI, vec(0.55, 0)), l89 = locateVec(gI, vec(0.89, 0));
  ok('B4  above the top bucket the interpolated axis is STILL FLAT: 0.55 and 0.89 read the same cell',
    l55.ig === l89.ig && l55.igw === l89.igw && l55.ic === l89.ic,
    'removing the snap is not removing the ceiling - that is arm 2');
  const gR = makeGrid(m, { gainBuckets: [0.10, 0.45, 0.80] });
  ok('B5  re-spacing DOES move the ceiling: 0.89 now reads 0.80, and 0.60 no longer reads the top',
    gR.gain[locateVec(gR, vec(0.89, 0)).ig] === 0.80 && gR.gain[locateVec(gR, vec(0.60, 0)).ig] === 0.45);
}

console.log('=========== C. THE LUMP-SUM AXIS ===========');
if (!ONLY || ONLY.includes('C')) {
  const gN = makeGrid(m, {}), gP = makeGrid(m, { pclsStrict: true });
  const used = 0.191 * LSA;   // S112's real figure: 19.1% of the allowance spent
  ok('C1  as shipped, a household that has spent 19.1% of its allowance reads as having spent NOTHING',
    locateVec(gN, vec(0.25, used)).ic === 0 && gN.pcls[0] === 0,
    `£${Math.round(used).toLocaleString('en-GB')} read as £0`);
  ok('C2  strict never puts a positive allowance use on the no-lump bucket',
    [0.001, 0.05, 0.191, 0.209, 0.24, 0.3, 0.7, 1].every(f => locateVec(gP, vec(0.25, f * LSA)).ic > 0));
  ok('C3  strict leaves a household that has taken nothing exactly where it was',
    locateVec(gP, vec(0.25, 0)).ic === 0 && locateVec(gN, vec(0.25, 0)).ic === 0);
  ok('C4  and the cost of it, stated rather than hidden: 7.1% now reads as 50%, not 0%',
    gP.pcls[locateVec(gP, vec(0.25, 0.071 * LSA)).ic] === 0.5);
}

console.log('=========== D. EVERY ARM STILL SOLVES TO A FINITE ANSWER ===========');
if (!ONLY || ONLY.includes('D')) {
  const arms = [
    ['current', {}],
    ['re-spaced', { gainBuckets: [0.10, 0.45, 0.80] }],
    ['interpolated', { gainInterp: true }],
    ['flag-fixed', { pclsStrict: true }],
    ['allowance-interpolated', { pclsInterp: true }]
  ];
  const vals = arms.map(([, o]) => {
    const r = solve(E, M, plan, { points: 14, ...o });
    return r.value(M.initialState(r.m), 0).survival;
  });
  ok('D1  all five arms return a finite survival in (0, 1)', vals.every(v => Number.isFinite(v) && v > 0 && v < 1),
    arms.map(([n], i) => `${n} ${(100 * vals[i]).toFixed(2)}`).join(', '));
  ok('D2  and the three arms are not all identical to current, or the screen has nothing to measure',
    vals.slice(1).some(v => v !== vals[0]));
}

console.log('=========== E. THE ALLOWANCE AXIS INTERPOLATED (7ap; PLAN.md O71) ===========');
{
  const gN = makeGrid(m, {}), gI = makeGrid(m, { pclsInterp: true });
  /* a table whose every cell holds its own allowance bucket's value, in the bequest slot (read linearly), survival flat */
  const table = g => { const ls = new Float64Array(g.size), bq = new Float64Array(g.size); for (let i = 0; i < g.size; i++) bq[i] = g.pcls[Math.floor(i / g.stride.pcls)]; return { ls, bq }; };
  const read = (g, f) => { const t = table(g), out = new Float64Array(4); readValues(g, t.ls, t.bq, vec(0.25, f * LSA), out); return out[1]; };
  const fs = [0, 0.1, 0.2, 0.3, 0.5, 0.6, 0.69, 0.74, 0.76, 0.9, 1];
  ok('E1  the snap is absorbing: 0, 0.1 and 0.2 of the allowance used all read as none used, and 0.74 as half',
    read(gN, 0) === 0 && read(gN, 0.1) === 0 && read(gN, 0.2) === 0 && read(gN, 0.74) === 0.5 && read(gN, 0.76) === 1,
    fs.map(f => `${f}->${read(gN, f)}`).join(' '));
  ok('E2  interpolated, the read is the used share itself on a table linear in it (to 1e-12), across the 0.75 wall',
    fs.every(f => Math.abs(read(gI, f) - f) < 1e-12), fs.map(f => `${f}->${read(gI, f).toFixed(3)}`).join(' '));
  ok('E3  on a bucket the interpolated read is the snapped read', [0, 0.5, 1].every(f => read(gI, f) === read(gN, f)));
  ok('E4  above the allowance the axis stays at its top bucket', read(gI, 1.3) === 1 && locateVec(gI, vec(0.25, 1.3 * LSA)).ic === 1);
  const l = locateVec(gI, vec(0.25, 0.74 * LSA));
  ok('E5  locateVec brackets 0.74 between the 0.5 and 1 buckets with weight 0.48 above, and interp agrees with readValues',
    l.ic === 1 && Math.abs(l.icw - 0.48) < 1e-12 && Math.abs(interp(gI, table(gI).bq, l, false) - 0.74) < 1e-12, `ic ${l.ic} icw ${l.icw}`);
  ok('E6  the snapped grid reports no allowance weight', locateVec(gN, vec(0.25, 0.74 * LSA)).icw === 0);
  let threw = false; try { makeGrid(m, { pclsInterp: true, pclsStrict: true }); } catch { threw = true; }
  ok('E7  pclsInterp and pclsStrict together are refused (two readings of one axis)', threw);
  /* with the gain axis interpolated too: 32 corners, the weights still sum to one */
  const gB = makeGrid(m, { pclsInterp: true, gainInterp: true }), t = table(gB), one = new Float64Array(gB.size).fill(1), out = new Float64Array(4);
  readValues(gB, t.ls, one, vec(0.4, 0.74 * LSA), out);
  ok('E8  both axes interpolated: the corner weights sum to one (a table of ones reads one)', Math.abs(out[1] - 1) < 1e-12, String(out[1]));
  readValues(gB, t.ls, t.bq, vec(0.4, 0.74 * LSA), out);
  ok('E9  and the allowance read is still the used share', Math.abs(out[1] - 0.74) < 1e-12, String(out[1]));
  /* the stored-policy lookup (nearestIndex, solve.js): the nearest cell, so an interpolated axis's lower bracket is
     rounded by its weight - the same buckets as the snap (the plan-auditor's MINOR 3 of 30 Sep 23:32 UK) */
  const cOf = (g, v) => Math.floor(nearestIndex(g, v) / g.stride.pcls), gOf = (g, v) => Math.floor(nearestIndex(g, v) / g.stride.gain) % g.gain.length;
  const gG = makeGrid(m, { gainInterp: true });
  ok('E10 nearestIndex under the interpolated allowance picks the snap\'s bucket (0.2 -> 0, 0.3 and 0.74 -> 0.5, 0.76 -> 1)',
    fs.every(f => cOf(gI, vec(0.25, f * LSA)) === cOf(gN, vec(0.25, f * LSA))), fs.map(f => `${f}->${gI.pcls[cOf(gI, vec(0.25, f * LSA))]}`).join(' '));
  ok('E11 and under the interpolated gain axis, the snap\'s gain bucket (0.39 -> 0.25, 0.41 -> 0.55)',
    [0.05, 0.2, 0.39, 0.41, 0.6].every(f => gOf(gG, vec(f, 0)) === gOf(gN, vec(f, 0))), [0.05, 0.2, 0.39, 0.41, 0.6].map(f => `${f}->${gG.gain[gOf(gG, vec(f, 0))]}`).join(' '));
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
if (fail) process.exitCode = 1;
