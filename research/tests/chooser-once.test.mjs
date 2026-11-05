/*
 * THE MOVES' REPEATS FOUND ONCE A DECISION CHANGE NO NUMBER (the launch plan's step P1; D56: the chooser's cost per path).
 * chooseAction's mixture finds the moves that leave the same position in the same class and layer once a decision, in world
 * 0's classes, where every world parts the moves alike, and each world scores only the first move of each repeat
 * (solve.js decisionRepeats, scoreWorldOnce); before, each world found them again in its own memo (scoreMovesShared).
 * On S224 under SHIP (6 points) and the light candidate (4 points, a small lattice), and S370 under the candidate; seed 99001:
 *   1. with CHOOSER.check on, every world's score, tax and estate of every move at every decision of 20 paths is recomputed by
 *      scoreMoves, the reference, and a difference of one bit throws; every decision takes the new path (none falls back);
 *   2. the engine's outcomes on 200 paths are the same with the repeats found once a world and once a decision, and the
 *      chooser's time on this thread's CPU is printed beside them (not checked);
 *   3. where the worlds are taken to part the moves differently (CHOOSER.plant 'oncediff'), every decision falls back to each
 *      world's memo and the outcomes are the same again.
 * Planted (CHOOSER.plant 'oncerep'): each repeat scored at the next repeat's first move; the check throws.
 *   node research/tests/chooser-once.test.mjs
 */
import { createHash } from 'node:crypto';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan, CHOOSER, SHARE_CHECKED } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, candidatePlan } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { cpuNs } from './cpu-time.mjs';

let pass = 0, fail = 0;
const failed = [];
const ok = (c, msg) => { c ? pass++ : (fail++, failed.push(msg.slice(0, 40))); console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); };
const LAMBDA = 0.0223606797749979, SEED = 99001, NCHECK = 20, NRUN = 200;
const all = buildScenarios();
const planOf = id => { const h = all.find(s => s.id === id).plan; return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } })); };
const ARMS = {
  SHIP: plan => solvePlan(E, M, candidatePlan(E, plan), { lambda: LAMBDA, points: 6, bequestWeight: 0.02 }),
  CAND: plan => solveCandidate(E, M, plan, { lambda: LAMBDA, points: 4, bequestWeight: 0.02, adaptiveLattice: { na: 24, nb: 5, nz: 16, foot: true, stepAll: true } })
};
const thrown = f => { try { f(); return null; } catch (e) { return e.message; } };
const runAll = (ctx, paths) => {
  const h = createHash('sha256'); let alive = 0;
  for (const zs of paths) { const x = E.runTrial(ctx, Float64Array.from(zs)); if (x.survived) alive++; h.update([x.survived, x.failAge, x.terminalPot, x.terminalPotNet, x.minPot, x.lifetimeTax, x.unmetTotal, x.realisedSpend, x.cutYears, x.raiseYears].join(':') + ';'); }
  return { hash: h.digest('hex').slice(0, 16), alive };
};
const set = (once, check, plant = '') => { CHOOSER.share = true; CHOOSER.once = once; CHOOSER.check = check; CHOOSER.plant = plant; };
const zero = () => Object.assign(SHARE_CHECKED, { n: 0, hits: 0, miss: 0, fails: 0, decisions: 0, once: 0, onceOff: 0 });

const solved = {};
for (const [id, arm] of [['S224', 'SHIP'], ['S224', 'CAND'], ['S370', 'CAND']]) {
  const r = ARMS[arm](planOf(id)), T = r.m.ctx.totalYears;
  solved[`${id} ${arm}`] = r;
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r));
  // 1. every world's score against scoreMoves, the new path taken at every decision
  set(true, true); zero();
  const e1 = thrown(() => runAll(ctx, E.pathsForSeed(SEED, NCHECK, T)));
  ok(!e1 && SHARE_CHECKED.n > 0 && SHARE_CHECKED.once > 0 && SHARE_CHECKED.onceOff === 0, `1  ${id} ${arm}: every world's score, tax and estate of every move at every decision of ${NCHECK} paths the same bit for bit as scoreMoves's, the repeats found once a decision at ${SHARE_CHECKED.once} decisions, ${SHARE_CHECKED.onceOff} falling back (${e1 || `${SHARE_CHECKED.n} scores checked; ${SHARE_CHECKED.miss} scored, ${SHARE_CHECKED.hits} repeats`})`);
  // 2. the outcomes, the repeats found once a world against once a decision; the time on this thread's CPU beside them
  const paths = E.pathsForSeed(SEED, NRUN, T);
  let off, on;
  set(false, false); const tOff = cpuNs(() => { off = runAll(ctx, paths); }, 1, 1).first;
  set(true, false); const tOn = cpuNs(() => { on = runAll(ctx, paths); }, 1, 1).first;
  ok(off.hash === on.hash, `2  ${id} ${arm}: the engine's outcomes on ${NRUN} paths with the repeats found once a world and once a decision, ${off.hash} / ${on.hash} (survives ${on.alive}); ${(tOff / 1e6 / NRUN).toFixed(1)} and ${(tOn / 1e6 / NRUN).toFixed(1)} ms of CPU a path`);
  // 3. the fall-back where the worlds part the moves differently
  set(true, false, 'oncediff'); zero();
  const fb = runAll(ctx, paths);
  ok(fb.hash === off.hash && SHARE_CHECKED.once === 0 && SHARE_CHECKED.onceOff > 0, `3  ${id} ${arm}: the worlds taken to part the moves differently: each world's own memo at all ${SHARE_CHECKED.onceOff} decisions, the outcomes ${fb.hash}`);
}
// the plant, under the check: each repeat scored at the next repeat's first move
{
  const r = solved['S224 CAND'], T = r.m.ctx.totalYears, ctx = E.buildContext(withTable(r.m.ctx.plan, r));
  set(true, true, 'oncerep');
  const e = thrown(() => runAll(ctx, E.pathsForSeed(SEED, NCHECK, T)));
  ok(/share check: year \d+/.test(e || ''), `4  planted, S224 CAND: each repeat scored at the next repeat's first move: the check throws (${e ? e.slice(0, 60) : 'no throw'})`);
}
set(true, false);

console.log(`\n=========== ${pass} passed, ${fail} failed${failed.length ? `: ${failed.join('; ')}` : ''} ===========`);
process.exit(fail ? 1 : 0);
