/*
 * `switchCharge` (PLAN.md P; research only, off by default; the deep review after 7ae, deep-review-log.md 28 Sep 22:52 UK):
 * THE SWITCH CHARGED IN THE SCORE, IN BOTH PASSES. A move that leaves the held tier pair pays the charge (score units) in
 * the tier state's backward pass - in h, so the stored values carry every later switch's charge - and in the forward
 * chooser at the true state. It replaces the margin's hold rule, which the table never charges (O44, O48, O50).
 *
 *   A. it refuses what it cannot do: no tier state, a negative or non-finite charge
 *   B. OFF IS UNTOUCHED: the option absent and 0 give every layer of every world to the bit; meta names it only when on
 *   C. IT ACTS: charged at 0.001 with no margin, the layers differ from the uncharged margin-0 layers somewhere, and the
 *      stored moves leave the held pair less often
 *   D. THE CHOOSER AGREES WITH THE TABLE: on the three-world mixture with the joint tier state (TS+J), charged in both
 *      passes, holding pair j at a node, the chooser picks the move stored in layer j at every node sampled where some move
 *      can pay (the defining property) - planted: the charge in the chooser alone (tables uncharged) disagrees somewhere
 *   node research/tests/solver-switchcharge.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, solveMixture, chooseAction, scoreMoves } from '../../src/solver/solve.js';
import { toVec } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const plan = prep(singles.find(x => x.id === 'S126').plan), m = M.prepare(E, plan);
const o = { points: 8, lump: m.ctx.fullLumpSum, tiers: true, spendLevels: [1, 0.9, 0.8], lambda: 0.05, finalIntegral: true, finalExact: true };
const T = m.ctx.totalYears;
const same = (a, b) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const tabsSame = (L, R) => { for (let t = 0; t <= T; t++) for (const kk of ['surv', 'beq', 'resil', 'short', 'pol']) if (!same(L[kk][t], R[kk][t])) return `${kk} year ${t}`; return null; };

console.log('=========== A. REFUSALS ===========');
const refuse = (extra, re) => { let e = null; try { solve(E, M, plan, { ...o, ...extra }); } catch (x) { e = x.message; } return !!e && re.test(e) ? e : `no refusal (${e})`; };
for (const [nm, extra, re] of [['no tier state', { switchCharge: 0.001 }, /tier state/], ['a negative charge', { tierState: true, switchCharge: -0.001 }, /finite number of 0 or more/], ['a charge that is not finite', { tierState: true, switchCharge: Infinity }, /finite number of 0 or more/]]) {
  const r = refuse(extra, re); ok(`A  refuses ${nm}`, !/^no refusal/.test(r), r);
}

console.log('=========== B. OFF IS UNTOUCHED ===========');
const base = { ...o, mix: 3, jointWorlds: true, tierState: true };
const absent = solveMixture(E, M, plan, base), zero = solveMixture(E, M, plan, { ...base, switchCharge: 0 });
let badB = null;
absent.worlds.forEach((w, k) => { for (let j = 0; j < w.tsLayers.length && !badB; j++) { const d = tabsSame(w.tsLayers[j], zero.worlds[k].tsLayers[j]); if (d) badB = `world ${k} layer ${j}: ${d}`; } });
ok('B  the option absent and 0: every layer of every world to the bit (the product\'s margin and cost)', !badB, badB || `${absent.worlds.length} worlds, ${absent.worlds[0].tsLayers.length} layers`);
ok('B  meta names the charge only when it is on', absent.meta.switchCharge === undefined && zero.meta.switchCharge === undefined);

console.log('=========== C. IT ACTS ===========');
const m0 = solveMixture(E, M, plan, { ...base, switchMargin: 0 });
const ch = solveMixture(E, M, plan, { ...base, switchMargin: 0, switchCharge: 0.001 });
ok('C  meta names the charge when on', ch.meta.switchCharge === 0.001 && ch.switchCharge === 0.001);
let differ = 0; ch.worlds.forEach((w, k) => w.tsLayers.forEach((L, j) => { for (let t = 0; t <= T; t++) { const a = L.short[t], b = m0.worlds[k].tsLayers[j].short[t]; for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) differ++; } }));
ok('C  charged, the layers differ from the uncharged margin-0 layers somewhere', differ > 0, `${differ} cells`);
const leaves = r => { const prs = r.meta.tierState.split(',').map(x => x.split('/').map(Number)), acts = r.c.acts; let n = 0; r.worlds[1].tsLayers.forEach((L, j) => { for (let t = 0; t <= T; t++) for (const a of L.pol[t]) if (acts[a].tierPen !== prs[j][0] || acts[a].tierIsa !== prs[j][1]) n++; }); return n; };
const lc = leaves(ch), l0 = leaves(m0);
ok('C  charged, the stored moves leave the held pair less often than uncharged at margin 0', lc < l0, `${lc} against ${l0} stored leaves`);

console.log('=========== D. THE CHOOSER AGREES WITH THE TABLE ===========');
const agreeMix = (r) => { const g = r.g, v = new Float64Array(7), prs = r.meta.tierState.split(',').map(x => x.split('/').map(Number)); let ag = 0, nn = 0, first = null;
  for (const t of [1, 5, 15, T - 2]) for (let idx = 0; idx < g.size; idx += 7) {
    const ip = idx % g.np, ii = Math.floor(idx / g.np) % g.ni, it = Math.floor(idx / (g.np * g.ni)) % g.nt, ig = Math.floor(idx / (g.np * g.ni * g.nt)) % g.gain.length, ic = Math.floor(idx / (g.np * g.ni * g.nt * g.gain.length));
    if (g.index(ip, ii, it, ig, ic) !== idx) continue;
    toVec(g, ip, ii, it, ig, ic, v);
    for (let j = 0; j < prs.length; j++) {
      const held = { pen: prs[j][0], isa: prs[j][1], gia: 0 };
      const SC = new Float64Array(r.actions.length), TX = new Float64Array(r.actions.length), BQ = new Float64Array(r.actions.length);
      scoreMoves(r.worlds[0], Float64Array.from(v), t, SC, TX, BQ, held);
      if (!SC.some(x => x > -Infinity)) continue;
      const a = chooseAction(r, Float64Array.from(v), t, held), stored = r.worlds[1].tsLayers[j].pol[t][idx];
      nn++; if (a === stored) ag++; else if (!first) first = `year ${t} node ${idx} layer ${j}: chooser ${a}, table ${stored}`;
    } }
  return { ag, nn, first }; };
const d = agreeMix(ch);
ok('D  charged in both passes: holding pair j at a node, the chooser picks the move stored in layer j, at every node sampled', d.nn > 0 && d.ag === d.nn, `${d.ag} of ${d.nn}${d.first ? '; ' + d.first : ''}`);
const planted = solveMixture(E, M, plan, { ...base, switchMargin: 0 }); planted.switchCharge = 0.001;   // the chooser charged, the tables not
const p = agreeMix(planted);
ok('D  planted: the charge in the chooser alone (uncharged tables) disagrees with the tables somewhere', p.nn > 0 && p.ag < p.nn, `${p.ag} of ${p.nn}`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
