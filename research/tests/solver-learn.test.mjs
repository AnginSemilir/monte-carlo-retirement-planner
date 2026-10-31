/*
 * 7t's LEARNING CHOOSER (research/solver/learn.mjs): the mixture's tables, the product's rule, and world weights that are
 * the posterior given the returns the path has realised.
 *
 *   A. the posterior: no data gives the prior; returns at a world's node favour that world, by Bayes' rule computed by hand
 *   B. the model matches the simulation: solve.js realAt still grows each pot by ln(1+R) + S zPath + V z (else learn.mjs's
 *      likelihood is of another model)
 *   C. year 0 has no returns yet, so the chooser picks chooseAction's move; the weights are restored after every call
 *   D. along a path deep in the bad world (yearly draws at zero) the weights move to the bad world, and on a good path to the
 *      good one; the number of updates is the years run less one; planted: a sign slip in the likelihood fails the check
 *   E. the product's chooser through the same hook picks runPolicy's own moves on every path - so the learning arm differs
 *      from the product's only through the weights; and the learning arm does differ somewhere
 *   F. five worlds: the chooser runs on a five-world mixture and its weights sum to one
 *   G. refusals: no mixture, a fold path with no long-run shift
 *   H. no look-ahead: year t's weights ignore year t's draw, which is not yet realised (the seventy-eighth review, MINOR 7);
 *      year t+1's do not
 *   I. the oracle (the bound): the path's true shift on the nodes, fixed from year 0; the weights restored; refusals
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveMixture, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { tiersFor } from '../../src/solver/fast.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { learningChooser, posterior, update, signalPot, oracleChooser, oracleWeights } from '../solver/learn.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const near = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol;

console.log('=========== A. THE POSTERIOR ===========');
const prior = [1 / 6, 2 / 3, 1 / 6], nodes = [-Math.sqrt(3), 0, Math.sqrt(3)];
ok('A  no data: the posterior is the prior', posterior(prior, [0, 0, 0]).every((w, k) => near(w, prior[k])));
{
  const S = 0.0214, V = 0.171, logL = [0, 0, 0];
  for (let t = 0; t < 30; t++) update(logL, nodes, S, V, S * nodes[0]);   // thirty years exactly at the bad node
  const byHand = nodes.map((z, k) => prior[k] * Math.exp(-30 * (S * nodes[0] - S * z) ** 2 / (2 * V * V)));
  const tot = byHand.reduce((a, b) => a + b, 0), got = posterior(prior, logL);
  ok('A  thirty years at the bad node: Bayes\' rule by hand', got.every((w, k) => near(w, byHand[k] / tot, 1e-12)), got.map(x => x.toFixed(4)).join(' '));
  ok('A  and the bad world gains weight', got[0] > prior[0] && got[2] < prior[2]);
}

console.log('=========== B. THE MODEL IS THE SIMULATION\'S ===========');
{
  const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../src/solver/solve.js'), 'utf8');
  ok('B  realAt grows each pot by ln(1+R) + S zPath + V z', /out\[i\] = Math\.exp\(Math\.log\(1 \+ R\[i\]\) \+ S\[i\] \* zPath \+ V\[i\] \* z\) - 1/.test(src));
  ok('B  runPolicy grows year t by the path\'s own draw and the move held', /F\.grow\(c, t, s, realAt\(c, zs\[t\], real, act, t, zPath\)\)/.test(src));
}

const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = p => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const plan = prep(singles.find(x => x.id === 'S004').plan);
const m = M.prepare(E, plan);
const o = { points: 6, lump: m.ctx.fullLumpSum, tiers: tiersFor(m), mix: 3, spendLevels: [1, 0.95, 0.9, 0.8], lambda: 0.05, finalExact: true, switchMargin: 0.001 };
const r = solveMixture(E, M, plan, o);
const T = r.m.ctx.totalYears;
const paths = E.pathsForSeed(7002, 200, T);

console.log('=========== C. YEAR 0, AND THE WEIGHTS RESTORED ===========');
{
  const L = learningChooser(r, paths[0]);
  let a0, w0 = r.mix.weights;
  runPolicy(r, paths[0], { choose: (t, s, h) => { const ai = L.choose(t, s, h); if (t === 0) a0 = [ai, chooseAction(r, s, t, h)]; return ai; } });
  ok('C  year 0: the learning chooser picks chooseAction\'s move', a0 && a0[0] === a0[1]);
  ok('C  the mixture\'s weights are the same object after the run', r.mix.weights === w0 && w0.every((w, k) => w === prior[k]));
}

console.log('=========== D. THE WEIGHTS FOLLOW THE PATH ===========');
{
  // every yearly draw at zero, so each year's return shows the path's shift alone (a real path adds noise: B's model)
  const flat = z => { const p = new Array(T + 2).fill(0); p[T + 1] = z; return p; };
  const bad = flat(-2.5), good = flat(2.5);
  const Lb = learningChooser(r, bad), Lg = learningChooser(r, good);
  const ob = runPolicy(r, bad, { choose: Lb.choose }), og = runPolicy(r, good, { choose: Lg.choose });
  const yb = ob.survived ? T + 1 : ob.failYear - r.m.ctx.baseYear + 1, yg = og.survived ? T + 1 : og.failYear - r.m.ctx.baseYear + 1;
  const badWins = w => w[0] > prior[0] && w[0] > w[2], goodWins = w => w[2] > prior[2] && w[2] > w[0];
  ok('D  a path at shift -2.5: the bad world gains weight and leads the good one', badWins(Lb.n.last), Lb.n.last.map(x => x.toFixed(3)).join(' '));
  ok('D  a path at shift +2.5: the good world gains weight and leads the bad one', goodWins(Lg.n.last), Lg.n.last.map(x => x.toFixed(3)).join(' '));
  ok('D  one update a year after the first, for every year run', Lb.n.updates === yb - 1 && Lg.n.updates === yg - 1, `${Lb.n.updates}/${yb - 1}, ${Lg.n.updates}/${yg - 1}`);
  ok('D  the pot read is a real one (a positive shift and spread)', !!signalPot(r.c.acts[0], 0));
  // planted: the likelihood with the nodes' sign flipped (a sign slip in update) must fail D's check on the bad path
  const S = 0.0214, V = 0.171, logL = [0, 0, 0];
  for (let t = 0; t < 27; t++) update(logL, nodes.map(z => -z), S, V, S * -2.5);
  ok('D  planted: a flipped sign in the likelihood fails the bad-path check', !badWins(posterior(prior, logL)));
}

console.log('=========== E. THE HOOK IS NEUTRAL; THE WEIGHTS ARE THE ONLY CHANGE ===========');
{
  let same = 0, differ = 0, learnDiffers = 0;
  for (let i = 0; i < 60; i++) {
    const seqP = [], seqF = [], seqL = [];
    runPolicy(r, paths[i], { visit: (t, s, h, ai) => seqP.push(ai) });
    runPolicy(r, paths[i], { choose: (t, s, h) => { const ai = chooseAction(r, s, t, h); seqF.push(ai); return ai; } });
    const L = learningChooser(r, paths[i]);
    runPolicy(r, paths[i], { choose: (t, s, h) => { const ai = L.choose(t, s, h); seqL.push(ai); return ai; } });
    if (seqP.join() === seqF.join()) same++; else differ++;
    if (seqL.join() !== seqP.join()) learnDiffers++;
  }
  ok('E  the product\'s chooser through the hook: runPolicy\'s own moves on all 60 paths', same === 60 && differ === 0, `${same} same`);
  ok('E  the learning chooser moves differently on some path (else the arm tests nothing)', learnDiffers > 0, `${learnDiffers} of 60 paths`);
}

console.log('=========== F. FIVE WORLDS ===========');
{
  const r5 = solveMixture(E, M, plan, { ...o, mix: 5 });
  const L5 = learningChooser(r5, paths[2]);
  const o5 = runPolicy(r5, paths[2], { choose: L5.choose });
  ok('F  five worlds: the chooser runs, the weights sum to one over five', L5.n.last.length === 5 && near(L5.n.last.reduce((a, b) => a + b, 0), 1, 1e-9) && typeof o5.survived === 'boolean');
}

console.log('=========== G. REFUSALS ===========');
{
  const threw = f => { try { f(); return false; } catch { return true; } };
  ok('G  no mixture is refused', threw(() => learningChooser({ ...r, mix: null }, paths[0])));
  ok('G  a fold path (no long-run shift) is refused', threw(() => learningChooser(r, paths[0].slice(0, T + 1))));
}

console.log('=========== H. NO LOOK-AHEAD ===========');
{
  // two paths the same but for year 5's draw: the weights the chooser uses in year 5 must be the same (that draw is not yet
  // realised), and in year 6 they must differ (it is)
  const A = paths[3].slice(), B = paths[3].slice(); B[5] = A[5] + 2;
  const at = zs => { const L = learningChooser(r, zs), w = []; runPolicy(r, zs, { choose: (t, st, h) => { const ai = L.choose(t, st, h); w[t] = L.n.last.slice(); return ai; } }); return w; };
  const wa = at(A), wb = at(B), same = (x, y) => x && y && x.every((v, k) => v === y[k]);
  ok('H  year 5: the weights ignore year 5\'s own draw', same(wa[5], wb[5]), wa[5] && wa[5].map(x => x.toFixed(4)).join(' '));
  ok('H  year 6: the weights read it (the check can fail)', !!wa[6] && !!wb[6] && !same(wa[6], wb[6]));
}

console.log('=========== I. THE ORACLE ===========');
{
  const N3 = [-Math.sqrt(3), 0, Math.sqrt(3)], f = w => w.map(x => x.toFixed(3)).join(' ');
  ok('I  the oracle\'s weights: beyond the bad node all on it, at 0 all on the normal, halfway split', f(oracleWeights(N3, -2.5)) === '1.000 0.000 0.000' && f(oracleWeights(N3, 0)) === '0.000 1.000 0.000' && f(oracleWeights(N3, -Math.sqrt(3) / 2)) === '0.500 0.500 0.000' && f(oracleWeights(N3, 3)) === '0.000 0.000 1.000');
  ok('I  five nodes: a shift between -2.86 and -1.36 splits between them, summing to one', (() => { const w = oracleWeights([-2.85697, -1.355626, 0, 1.355626, 2.85697], -2); return w[0] > 0 && w[1] > 0 && Math.abs(w.reduce((a, b) => a + b, 0) - 1) < 1e-12; })());
  const bad = paths[4].slice(); bad[T + 1] = -2.5;
  const O = oracleChooser(r, bad), w0 = r.mix.weights; let first;
  runPolicy(r, bad, { choose: (t, st, h) => { const ai = O.choose(t, st, h); if (t === 0) { const w = r.mix.weights; r.mix.weights = [1, 0, 0]; first = [ai, chooseAction(r, st, t, h)]; r.mix.weights = w; } return ai; } });
  ok('I  the oracle picks the move of the bad world\'s weights from year 0, and restores the mixture\'s', first && first[0] === first[1] && r.mix.weights === w0);
  const threw = g => { try { g(); return false; } catch { return true; } };
  ok('I  the oracle refuses no mixture and a fold path', threw(() => oracleChooser({ ...r, mix: null }, paths[0])) && threw(() => oracleChooser(r, paths[0].slice(0, T + 1))));
}

console.log(`\n=========== ${passed} passed, ${failed} failed ===========`);
if (failed) process.exit(1);
