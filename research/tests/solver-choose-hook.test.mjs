/*
 * runPolicy's `choose` HOOK (research only; 7r's swap arms, audit-s126.mjs diag7r), written 26 Sep before 7r's run:
 *   1. A chooser that returns the solver's own move reproduces the run without it, path for path (survival, terminal
 *      wealth, tax). Planted: a chooser that always takes one other move must change at least one path.
 *   2. The layout the swap relies on: every move's tier pairs sit at tierBase + k, the same k giving the same pair under
 *      every base, and a swapped index keeps the base's order, harvest and spending level (its label less the tier words).
 *   3. The derivation 7r rests on (the reader reads only tables of years before access): on S126, along off's own runs,
 *      off's and the reader's choosers pick the same move in the last bridge year and from access on; planted, they differ
 *      in some earlier year (so the check is not comparing a solve with itself).
 *   4. swap.mjs's arms: each swapped move takes its tiers from one chooser and its order, harvest and level from the other,
 *      in every year it swaps; nothing swaps from the last bridge year on. Planted: a move list whose tier pairs are shifted
 *      by one must make swapIndex throw.
 *   node research/tests/solver-choose-hook.test.mjs
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, runPolicy, chooseAction } from '../../src/solver/solve.js';
import { swapChooser, swapIndex, stripTiers } from '../solver/swap.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const sc = buildScenarios().find(s => s.id === 'S126');
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } }));
// 8 points: at 4 the two choosers pick the same move in every year on S126 (the reader has nothing to change), so check
// 3 and the swap checks would run on nothing (found 26 Sep); 8 is the least tried where they differ, about 2.5 minutes
const OPTS = { lambda: 0.0223606797749979, points: 8, riskAbove: true, finalIntegral: true };
const rO = solvePlan(E, M, plan, { ...OPTS, bridgeRead: false }), rR = solvePlan(E, M, plan, { ...OPTS, bridgeRead: 'reader' });
const T = rO.m.ctx.totalYears, paths = E.pathsForSeed(7002, 40, T);
const sig = o => `${o.survived}|${Math.round(o.terminal)}|${Math.round(o.lifetimeTax)}`;

// 1. the hook, no-op and planted
{
  const plain = paths.map(zs => sig(runPolicy(rO, zs)));
  const hooked = paths.map(zs => sig(runPolicy(rO, zs, { choose: (t, s, held) => chooseAction(rO, s, t, held) })));
  ok(plain.every((x, i) => x === hooked[i]), `a chooser returning the solver's own move reproduces all ${paths.length} paths exactly`);
  const other = paths.map(zs => sig(runPolicy(rO, zs, { choose: () => rO.actions.length - 1 })));
  ok(other.some((x, i) => x !== plain[i]), 'planted: a chooser always taking the last move changes at least one path');
}
// 2. the swap layout
{
  const A = rO.actions, strip = l => l.replace(/, (pension|ISA) \d tiers? down/g, '');
  const bases = [...new Set(A.map(a => a.tierBase))], K = A.filter(a => a.tierBase === bases[0]).length;
  let bad = 0;
  for (const b of bases) for (let k = 0; k < K; k++) {
    const x = A[b + k], y = A[bases[0] + k];
    if (x.tierBase !== b || x.tierPen !== y.tierPen || x.tierIsa !== y.tierIsa || x.spendLevel !== A[b].spendLevel || strip(x.label) !== strip(A[b].label)) bad++;
  }
  ok(bases.length > 1 && K > 1 && bad === 0 && bases.length * K === A.length, `every one of ${bases.length} bases holds the same ${K} tier pairs in order, keeping its own order, harvest and level (${A.length} moves)`);
}
// 3. the reader acts only before the last bridge year
{
  let accessAt = T + 1; for (let t = 0; t <= T; t++) if (rO.c.yr.access[t]) { accessAt = t; break; }
  let late = 0, early = 0;
  paths.forEach(zs => runPolicy(rO, zs, { choose: (t, s, held) => { const a = chooseAction(rO, s, t, held), b = chooseAction(rR, s, t, held); if (a !== b) { if (t >= accessAt - 1) late++; else early++; } return a; } }));
  ok(accessAt === 2 && late === 0, `S126 (access at year ${accessAt}): off's and the reader's choosers agree in the last bridge year and after, on every path (${late} differ)`);
  ok(early > 0, `planted: they differ before it (${early} path-years), so the check compares two different solves`);
}
// 4. the swap arms
{
  const A = rO.actions;
  for (const which of ['rtier', 'rrest']) {
    const { choose, n: cnt } = swapChooser(rO, rR, which);
    let right = 0, wrong = 0;
    paths.forEach(zs => runPolicy(rO, zs, { choose: (t, s, held) => {
      const aO = chooseAction(rO, s, t, held), aR = chooseAction(rR, s, t, held), ai = choose(t, s, held);
      if (aO !== aR && t < 1) { const [tf, rf] = which === 'rtier' ? [aR, aO] : [aO, aR];
        if (A[ai].tierPen === A[tf].tierPen && A[ai].tierIsa === A[tf].tierIsa && A[ai].spendLevel === A[rf].spendLevel && stripTiers(A[ai].label) === stripTiers(A[rf].label)) right++; else wrong++; }
      return ai; } }));
    ok(right > 0 && wrong === 0 && cnt.late === 0 && cnt.swapped === right, `${which.toUpperCase()}: ${right} swapped moves each take ${which === 'rtier' ? "the reader's tiers and off's" : "off's tiers and the reader's"} order, harvest and level; none from the last bridge year on`);
  }
  const b1 = [...new Set(A.map(a => a.tierBase))][1];
  const shifted = A.map(a => ({ ...a, tierBase: a.tierBase === b1 ? b1 - 1 : a.tierBase }));
  let threw = false; try { swapIndex(shifted, 1, b1); } catch { threw = true; }
  ok(threw, 'planted: a move list with one base\'s tier pairs shifted by one makes swapIndex throw');
}
console.log(`\nsolver-choose-hook: ${n} passed`);
