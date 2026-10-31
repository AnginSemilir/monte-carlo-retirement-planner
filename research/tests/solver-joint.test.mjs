/*
 * `jointWorlds` (PLAN.md 7t): ONE POLICY FOR EVERY WORLD. Off, each world of the mixture picks its own best move at every
 * cell of the backward pass, so each world's table values a future in which the household knows its world; the forward
 * chooser (chooseAction) never knows and weighs the worlds by the mixture's fixed weights. On, every world takes the one
 * move with the best weighted score - the forward chooser's own rule - so the tables value the policy that is followed.
 *
 *   A. off is untouched: the option absent and the option false give the same tables to the bit
 *   B. on, every world holds the same move at every cell and year
 *   C. off, the worlds' moves differ somewhere (else B would be vacuous: the household must have a choice the worlds split on)
 *   D. on, the forward chooser at a grid cell picks the move the backward pass stored there (the defining property);
 *      off, it does not everywhere (the clairvoyant tables disagree with the chooser somewhere)
 *   E. planted: the joint pass with the wrong weights (all on the bad world) disagrees with the chooser at some cell -
 *      D can fail
 *   F. the option refuses what it cannot do: the ternary level search, a single world, missing weights
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, solveMixture, chooseAction } from '../../src/solver/solve.js';
import { tiersFor } from '../../src/solver/fast.js';
import { toVec } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const POINTS = 10;
const plan = prep(singles.find(x => x.id === 'S004').plan);
const m = M.prepare(E, plan);
const o = { points: POINTS, lump: m.ctx.fullLumpSum, tiers: tiersFor(m), mix: 3, spendLevels: [1, 0.95, 0.9, 0.8], lambda: 0.05, finalExact: true };
const off = solveMixture(E, M, plan, o);
const off2 = solveMixture(E, M, plan, { ...o, jointWorlds: false });
const on = solveMixture(E, M, plan, { ...o, jointWorlds: true });
const T = off.m.ctx.totalYears;

console.log('=========== A. OFF IS UNTOUCHED ===========');
ok('A  the option absent and false: every world\'s tables and moves equal, to the bit', off.mix.tables.every((tab, k) =>
  ['surv', 'beq', 'resil', 'short', 'pol'].every(kk => tab[kk].every((v, t) => same(Array.from(v), Array.from(off2.mix.tables[k][kk][t]))))));
ok('A  meta flags the option only when on', off.meta.jointWorlds === undefined && on.meta.jointWorlds === true);

console.log('=========== B, C. ONE POLICY ON, THREE OFF ===========');
const polSame = r => r.mix.tables.every(tab => tab.pol.every((v, t) => same(Array.from(v), Array.from(r.mix.tables[0].pol[t]))));
ok('B  on: every world holds the same move at every cell and year', polSame(on));
const splitCells = (() => { let n = 0; for (let t = 0; t <= T; t++) { const p0 = off.mix.tables[0].pol[t], p2 = off.mix.tables[2].pol[t]; for (let i = 0; i < p0.length; i++) if (p0[i] !== p2[i]) n++; } return n; })();
ok('C  off: the bad and good worlds pick different moves somewhere', splitCells > 0, `${splitCells} cells`);

console.log('=========== D, E. THE CHOOSER FOLLOWS THE JOINT TABLES ===========');
// the forward chooser at each grid cell of some years, no tier held (no switch charge or margin), against the stored move
function agreement(r) {
  const g = r.g, s = new Float64Array(7); let agree = 0, differ = 0;
  for (const t of [1, Math.floor(T / 3), Math.floor(2 * T / 3), T - 1]) {
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) for (let ip = 0; ip < g.np; ip++) {
      const idx = g.index(ip, ii, it, ig, ic);
      toVec(g, ip, ii, it, ig, ic, s);
      const stored = r.mix.tables[1].pol[t][idx];
      const chosen = chooseAction(r, Float64Array.from(s), t, null);
      if (r._sc[chosen] === -Infinity) continue;   // every move fails here: the two rules treat that differently
      if (chosen === stored) agree++; else differ++;
    }
  }
  return { agree, differ };
}
const aOn = agreement(on), aOff = agreement(off);
ok('D  on: the chooser picks the stored move at every grid cell checked', aOn.differ === 0 && aOn.agree > 100, `${aOn.agree} agree, ${aOn.differ} differ`);
ok('D  off: the chooser and the middle world\'s own move differ somewhere', aOff.differ > 0, `${aOff.agree} agree, ${aOff.differ} differ`);
// planted: the joint pass weighted wholly on the bad world, the chooser on the mixture's weights
const bad = solve(E, M, plan, { ...o, shifts: [-Math.sqrt(3), 0, Math.sqrt(3)], shiftZ: undefined, jointWorlds: true, shiftWeights: [1, 0, 0] });
bad.mix = { tables: bad.worlds, weights: [1 / 6, 2 / 3, 1 / 6], nodes: [-Math.sqrt(3), 0, Math.sqrt(3)] }; bad.meta.mixture = 3;
const aBad = agreement(bad);
ok('E  planted: the joint pass on the wrong weights disagrees with the chooser somewhere (D can fail)', aBad.differ > 0, `${aBad.agree} agree, ${aBad.differ} differ`);

console.log('=========== F. WHAT IT REFUSES ===========');
const throws = f => { try { f(); return false; } catch { return true; } };
ok('F  the ternary level search is refused', throws(() => solveMixture(E, M, plan, { ...o, jointWorlds: true, levelSearch: 'ternary' })));
ok('F  a single world is refused', throws(() => solve(E, M, plan, { ...o, jointWorlds: true, shiftWeights: [1] })));
ok('F  missing weights are refused', throws(() => solve(E, M, plan, { ...o, shifts: [-1, 0, 1], shiftZ: undefined, jointWorlds: true })));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
