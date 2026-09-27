/*
 * `tierState: true` (PLAN.md 7y; research only; the deep review after 7x, deep-review-log.md 27 Sep 22:32 UK): THE TIER HELD
 * ON ENTERING THE YEAR AS PART OF THE SOLVED STATE. One table layer per tier pair on the menu; at layer j each move is scored
 * as the chooser scores it holding j (chargeSwitch on a move to another pair, the next year's layer of the pair it moves to),
 * and the move kept is the chooser's (the switch margin, ties to staying).
 *
 *   A. it refuses what it cannot do: a held tier, the ternary level search, a one-pair menu
 *   B. THE FREE ENDPOINT: with no switching cost and no margin every layer is today's free table, to the bit (survival,
 *      estate, resilience, shortfall, stored move), every year - planted: with the product's cost and margin it is not
 *   C. THE HELD ENDPOINT: with an infinite margin layer j is holdTier j's table, every year and every pair, within 1e-8. Not
 *      to the bit: on S126 at 8 points 1,222 of 1,244,160 cells differ, by at most 6.04e-10 (27 Sep), the first at year 11 in
 *      cells clamped at the survival floor, where two moves tie within eps and the tie goes to the other move, whose
 *      bequest differs by up to 6.04e-10. The
 *      reading (eps ties at survival clamped to the floor): checked read-only by the plan-auditor's review of 7y's registration
 *      (28 Sep): at the latest differing year the two kept moves score within 1.5e-17 of each other (eps 1e-12) and their
 *      bequests differ by up to 6.04e-10; grade C; its script kept as research/solver/drafts/check-7y-tie.mjs, not re-run. The count and the largest difference are printed
 *   D. THE CHOOSER AGREES WITH THE TABLE: at grid nodes, holding pair j, chooseAction picks the move the backward pass
 *      stored in layer j (one world, the product's cost and margin), at every node sampled where some move can pay (where
 *      every move fails, the chooser scores all at -Infinity and keeps the first, the table scores them alike and keeps the
 *      held pair: neither move pays anything)
 *   E. meta names it; the mixture's world views carry their layers; a forward run holds, charges and finishes
 *   F. 7y's swap chooser (swap.mjs tsSwapChooser): against itself it swaps nothing and runs as the plain chooser, path by
 *      path; against the tier state it swaps somewhere, and every swapped move lands (swapIndex checks it)
 *   G. THE JOINT TIER STATE (tierState with jointWorlds, TS+J; O41, the deep review after 7z): with no switching cost and no
 *      margin every layer is the one-policy (jointWorlds) table to the bit; on the three-world mixture, holding pair j at a
 *      node, the mixture's chooser picks the move stored in layer j at every node sampled where some move can pay - planted:
 *      the per-world tier state fails that check somewhere (O41)
 *   node research/tests/solver-tierstate.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, solveMixture, chooseAction, runPolicy, scoreMoves } from '../../src/solver/solve.js';
import { toVec } from '../../src/solver/grid.js';
import { tiersFor } from '../../src/solver/fast.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { tsSwapChooser } from '../solver/swap.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
const plan = prep(singles.find(x => x.id === 'S126').plan), m = M.prepare(E, plan);
const o = { points: 8, lump: m.ctx.fullLumpSum, tiers: true, spendLevels: [1, 0.9, 0.8], lambda: 0.05, finalIntegral: true, finalExact: true };
const T = m.ctx.totalYears;
const same = (a, b) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const tabsSame = (L, R) => { for (let t = 0; t <= T; t++) for (const kk of ['surv', 'beq', 'resil', 'short']) if (!same(L[kk][t], R[kk][t])) return `${kk} year ${t}`; return null; };

console.log('=========== A. REFUSALS ===========');
const refuse = (extra, re, fn = solve) => { let e = null; try { fn(E, M, plan, { ...o, tierState: true, ...extra }); } catch (x) { e = x.message; } return !!e && re.test(e) ? e : `no refusal (${e})`; };
for (const [nm, extra, re, fn] of [['a held tier', { holdTier: [0, 0] }, /holdTier/], ['the ternary level search', { levelSearch: 'ternary' }, /ternary/], ['a one-pair menu', { tiers: false }, /two pairs/]]) {
  const r = refuse(extra, re, fn); ok(`A  refused: ${nm}`, !/^no refusal/.test(r), r);
}

console.log('=========== B. THE FREE ENDPOINT ===========');
const free = solve(E, M, plan, { ...o, switchCost: 0, switchMargin: 0 });
const ts0 = solve(E, M, plan, { ...o, switchCost: 0, switchMargin: 0, tierState: true });
const J = ts0.tsLayers.length;
let bad = null; for (let j = 0; j < J && !bad; j++) { const d = tabsSame(ts0.tsLayers[j], free); if (d) bad = `layer ${j}: ${d}`; for (let t = 0; t <= T && !bad; t++) if (!same(ts0.tsLayers[j].pol[t], free.pol[t])) bad = `layer ${j}: move year ${t}`; }
ok('B  no cost, no margin: every layer is the free table to the bit, every year', !bad, bad || `${J} layers, ${T + 1} years`);
const tsP = solve(E, M, plan, { ...o, tierState: true });
let differs = false; for (let j = 0; j < J && !differs; j++) if (tabsSame(tsP.tsLayers[j], free)) differs = true;
ok('B  planted: with the product\'s cost and margin some layer differs from the free table', differs);

console.log('=========== C. THE HELD ENDPOINT ===========');
const tsInf = solve(E, M, plan, { ...o, switchMargin: Infinity, tierState: true });
let maxC = 0, nC = 0, cells = 0;
for (const [j, [pen, isa]] of tsInf.meta.tierState.split(',').map(x => x.split('/').map(Number)).entries()) {
  const held = solve(E, M, plan, { ...o, switchMargin: Infinity, holdTier: [pen, isa] });
  for (let t = 0; t <= T; t++) for (const kk of ['surv', 'beq', 'resil', 'short']) { const a = tsInf.tsLayers[j][kk][t], b = held[kk][t]; for (let i = 0; i < a.length; i++) { cells++; const d = Math.abs(a[i] - b[i]); if (!Object.is(a[i], b[i])) nC++; if (d > maxC || Number.isNaN(d)) maxC = Number.isNaN(d) ? Infinity : d; } }
}
ok('C  an infinite margin: layer j is holdTier j\'s table within 1e-8, every year and every pair', maxC < 1e-8, `${tsInf.meta.tierState}; ${nC} of ${cells} cells not bit-identical, largest difference ${maxC.toExponential(2)}`);
// planted: the same comparison against the free table must fail
let maxF = 0; for (let t = 0; t <= T; t++) { const a = tsInf.tsLayers[1].surv[t], b = free.surv[t]; for (let i = 0; i < a.length; i++) maxF = Math.max(maxF, Math.abs(a[i] - b[i])); }
ok('C  planted: layer 1 held for life is not the free table', maxF > 1e-6, `largest difference ${maxF.toExponential(2)}`);

console.log('=========== D. THE CHOOSER AGREES WITH THE TABLE ===========');
const g = tsP.g, v = new Float64Array(7), pairs = tsP.meta.tierState.split(',').map(x => x.split('/').map(Number));
let agree = 0, n = 0, firstOff = null;
for (const t of [1, 5, 15, T - 2]) for (let idx = 0; idx < g.size; idx += 7) {
  const ip = idx % g.np, ii = Math.floor(idx / g.np) % g.ni, it = Math.floor(idx / (g.np * g.ni)) % g.nt, ig = Math.floor(idx / (g.np * g.ni * g.nt)) % g.gain.length, ic = Math.floor(idx / (g.np * g.ni * g.nt * g.gain.length));
  if (g.index(ip, ii, it, ig, ic) !== idx) continue;
  toVec(g, ip, ii, it, ig, ic, v);
  for (let j = 0; j < pairs.length; j++) {
    const held = { pen: pairs[j][0], isa: pairs[j][1], gia: 0 };
    const SC = new Float64Array(tsP.actions.length), TX = new Float64Array(tsP.actions.length), BQ = new Float64Array(tsP.actions.length);
    scoreMoves(tsP, Float64Array.from(v), t, SC, TX, BQ, held);
    if (!SC.some(x => x > -Infinity)) continue;
    const a = chooseAction(tsP, Float64Array.from(v), t, held);
    n++; if (a === tsP.tsLayers[j].pol[t][idx]) agree++; else if (!firstOff) firstOff = `year ${t} node ${idx} layer ${j}: chooser ${a}, table ${tsP.tsLayers[j].pol[t][idx]}`;
  }
}
ok('D  holding pair j at a node, the chooser picks the move the table stored in layer j, at every node sampled', n > 0 && agree === n, `${agree} of ${n}${firstOff ? '; ' + firstOff : ''}`);

console.log('=========== E. THE RESULT ===========');
ok('E  meta names the tier state only when on', !!tsP.meta.tierState && free.meta.tierState === null, tsP.meta.tierState);
const mix = solveMixture(E, M, plan, { ...o, mix: 3, tierState: true });
ok('E  every world of the mixture carries its own layers', mix.worlds.length === 3 && mix.worlds.every(w => w.tsLayers && w.tsLayers.length === J) && mix.worlds[0].tsLayers[0].surv !== mix.worlds[2].tsLayers[0].surv);
const paths = E.pathsForSeed(7002, 40, T);
let fin = 0, tierYrs = 0; for (const zs of paths) { const out = runPolicy(mix, zs); if (Number.isFinite(out.terminalNet)) fin++; tierYrs += out.tierPenYears || 0; }
ok('E  forty forward runs on the mixture finish', fin === 40, `pension tier below the plan's in ${tierYrs} path-years`);

console.log('=========== F. 7Y\'S SWAP CHOOSER ===========');
{ const prod = solveMixture(E, M, plan, { ...o, mix: 3 });
  const self = tsSwapChooser(prod, prod, 'tier'); let sameRuns = true;
  for (const zs of paths.slice(0, 20)) { const a = runPolicy(prod, zs), b = runPolicy(prod, zs, { choose: self.choose }); if (a.survived !== b.survived || a.terminalNet !== b.terminalNet || a.tierPenYears !== b.tierPenYears) sameRuns = false; }
  ok('F  against itself: nothing swapped, each run the plain chooser\'s', self.n.swapped === 0 && sameRuns, `${self.n.same} path-years`);
  for (const which of ['tier', 'rest']) { const sw = tsSwapChooser(prod, mix, which); let err = null; try { for (const zs of paths.slice(0, 20)) runPolicy(prod, zs, { choose: sw.choose }); } catch (e) { err = e.message; } ok(`F  ${which}: against the tier state it swaps somewhere and every swap lands`, !err && sw.n.swapped > 0, err || `${sw.n.swapped} swapped, ${sw.n.same} the same`); } }
console.log('=========== G. THE JOINT TIER STATE ===========');
{ const jfree = solveMixture(E, M, plan, { ...o, mix: 3, jointWorlds: true, switchCost: 0, switchMargin: 0 });
  const tsj0 = solveMixture(E, M, plan, { ...o, mix: 3, jointWorlds: true, tierState: true, switchCost: 0, switchMargin: 0 });
  let badG = null;
  tsj0.worlds.forEach((w, k) => { for (let j = 0; j < w.tsLayers.length && !badG; j++) { const d = tabsSame(w.tsLayers[j], jfree.worlds[k]); if (d) badG = `world ${k} layer ${j}: ${d}`; for (let t = 0; t <= T && !badG; t++) if (!same(w.tsLayers[j].pol[t], jfree.worlds[k].pol[t])) badG = `world ${k} layer ${j}: move year ${t}`; } });
  ok('G  no cost, no margin: every layer of every world is the one-policy table to the bit', !badG, badG || `${tsj0.worlds.length} worlds`);
  const tsj = solveMixture(E, M, plan, { ...o, mix: 3, jointWorlds: true, tierState: true });
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
  const jg = agreeMix(tsj);
  ok('G  on the mixture, holding pair j at a node, the chooser picks the move stored in layer j, at every node sampled', jg.nn > 0 && jg.ag === jg.nn, `${jg.ag} of ${jg.nn}${jg.first ? '; ' + jg.first : ''}`);
  const pg = agreeMix(mix);
  ok('G  planted: the per-world tier state does not agree with the mixture chooser everywhere (O41)', pg.nn > 0 && pg.ag < pg.nn, `${pg.ag} of ${pg.nn}`); }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
