/*
 * THE WIDER JOINT MOVE'S PILOT (D111; EXPLORATORY, seed 99001, deciding nothing): what a couple's path costs when the joint
 * move takes each person's top four or top six moves (couple.js solveCouple's topK) against today's two, to size the test
 * (JOINT-WIDE.md). Each couple is solved once on the couples' default as the app solves a couple (audit-couples.mjs
 * solverPlan('CANDC', ...), each person by solveForApp at 45 points without the single's tie-break, solveCouple on
 * APP_COUPLE's share rule with its joint move, src/solverSettings.js appJoint), and every width takes those same tables.
 * Each width's paths are timed by the process's CPU time (user and system) over the same paths of seed 99001, the review's,
 * in two rounds in opposite orders (K2 K4 K6, then K6 K4 K2), after a few untimed paths. No outcome is printed: only the
 * times, the joint pairs each width scores a decision, and the solve's time.
 *   node research/solver/joint-wide-pilot.mjs [couple ...]       (S327F S149 S023-90 unless named)
 *   JWP_N the timed paths a round (20 unless set), JWP_WARM the untimed (3)
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { solveForApp } from '../../src/solverApp.js';
import { APP_COUPLE, appJoint } from '../../src/solverSettings.js';
import { readPanel, appPlan } from './couple-panel.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { armA } from './select-phase4.mjs';
import { runPath } from './audit-phase4.mjs';
import { PANEL_FILE, solverPlan } from './audit-couples.mjs';
import { codeId } from './code-id.mjs';
import { cpus } from 'node:os';

const SEED = 99001, PTS = 45, W = 0.02, WIDTHS = [2, 4, 6];
const N = Number(process.env.JWP_N) || 20, WARM = Number(process.env.JWP_WARM) || 3;
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['S327F', 'S149', 'S023-90'];
const d4b = readPanel(PANEL_FILE), share = readSharePanel();
const planOf = id => { const h = d4b.find(x => x.id === id); if (h) return { plan: h.plan, from: 'couples-panel-d4b' }; const u = share.find(x => x.id === id); if (u) return { plan: u.plan, from: 'share-rules-panel' }; throw new Error(`no couple ${id}`); };
const cid = codeId();
console.log(`THE WIDER JOINT MOVE'S PILOT (EXPLORATORY, deciding nothing): code ${cid ? cid.hash : 'unknown'}; seed ${SEED}, ${N} timed paths a round after ${WARM} untimed, two rounds in opposite orders; ${PTS} points, estate weight ${W}; the couples' default ${JSON.stringify({ shareRule: APP_COUPLE.shareRule, ...appJoint() })}; ${cpus()[0].model}; node ${process.version}`);
for (const id of ids) {
  const { plan, from } = planOf(id), t0 = Date.now();
  const a = armA(appPlan(plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
  const hp = solverPlan('CANDC', plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics, memo = new Map();
  const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: PTS, ageWith: o.partnerAge0, research: { tieAboveCap: undefined } })); return memo.get(k); };
  const cps = Object.fromEntries(WIDTHS.map(K => [K, CPL.solveCouple(E, M, hp, { shareRule: APP_COUPLE.shareRule, solveOne, ...appJoint(), ...(K !== 2 ? { topK: K } : {}) })]));
  const solveSecs = (Date.now() - t0) / 1000;
  if (WIDTHS.some(K => cps[K].tables.self !== cps[2].tables.self || cps[K].tables.part !== cps[2].tables.part || cps[K].topK !== K)) throw new Error(`${id}: a width took other tables or another topK`);
  const ctxOf = cp => E.buildContext(CPL.withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
  const ctxs = Object.fromEntries(WIDTHS.map(K => [K, ctxOf(cps[K])])), T = ctxs[2].totalYears;
  const paths = E.pathsForSeed(SEED, WARM + N, T).map(zs => Float64Array.from(zs));
  const cpu = Object.fromEntries(WIDTHS.map(K => [K, 0]));
  for (const order of [WIDTHS, [...WIDTHS].reverse()]) for (const K of order) {
    for (let i = 0; i < WARM; i++) runPath(ctxs[K], paths[i], false);
    const c0 = process.cpuUsage();
    for (let i = WARM; i < WARM + N; i++) runPath(ctxs[K], paths[i], false);
    const c = process.cpuUsage(c0); cpu[K] += c.user + c.system;
  }
  const ms = K => cpu[K] / 1e3 / (2 * N);
  console.log(`${id.padEnd(8)} (${from}, T ${T}, share ${cps[2].share}): solved ${solveSecs.toFixed(0)} s; CPU a path ${WIDTHS.map(K => `K${K} ${ms(K).toFixed(1)} ms (x${(ms(K) / ms(2)).toFixed(2)})`).join(', ')}; the joint pairs a decision (splits x K x K) ${WIDTHS.map(K => `K${K} ${cps[K].splits.length * K * K}`).join(', ')}`);
}
