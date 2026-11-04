/*
 * WHERE A SOLVED PLAN'S PATH GOES (step P, the launch plan section 4; its first target by D56: the chooser's cost per path).
 * EXPLORATORY: it measures, it decides nothing.
 *
 * Phase 9's budgets were not met (results-budget-strategy.txt): the Strategy tab's headline on 2,000 paths took 105 to 121 s
 * split four ways, against a target of 60. Its cause, as D56 records it: the chooser's cost per path, the solved plan's
 * path at the app's settings choosing among five spending levels since L1's floor. This prints where that path's time goes,
 * on the households of Phase 9's budgets, each solved at the app's settings (solveForApp: the candidate at 45 points, the
 * floor at 80%), the Strategy tab's paths (seed 12345) run one at a time on one thread, as a worker runs its share:
 *   1. your plan's path and the solved plan's, ms a path (each after a warm-up of the first paths, run untimed);
 *   2. within the solved plan's path, the table's choice (tablePolicy's choose: the position's vector and chooseAction)
 *      against the rest of the engine's year, ms a path, and the decisions a path;
 *   3. the chooser's size: the moves a decision, the spending levels among them, the worlds (the mixture's tables), the
 *      shared year (CHOOSER.share) on or off;
 *   4. the choice taken apart on the decisions of the first paths, replayed: the position's vector alone, chooseAction
 *      alone, and a CPU profile of the replayed choices, self time by function, the top 15.
 *   node research/solver/profile-path.mjs [id ...] [--paths N] [--replay N]   (S126 S370 S002 S188, 200 paths, 20 replayed)
 * Run with nothing else on the machine (no gate, no batch); its output is research/solver/results-profile-path.txt.
 */
import { Session } from 'node:inspector/promises';
import { cpus, loadavg } from 'node:os';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { runPath, solvedContext, yourContext } from '../../src/solverStrategy.js';
import { vecOf } from '../../src/solver/grid.js';
import { modelStateOf } from '../../src/solver/bridge.js';
import { chooseAction, CHOOSER, SHARE_CHECKED } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { codeId } from './code-id.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = Number(args[i + 1]); args.splice(i, 2); return v; };
const N = opt('--paths', 200), REPLAY = opt('--replay', 20), WARM = 20, SEED = 12345, TOP = 15;
const ids = args.length ? args : ['S126', 'S370', 'S002', 'S188'];
const byId = Object.fromEntries(buildScenarios().map(s => [s.id, s]));
const now = () => performance.now();
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2), pc = (a, b) => `${(100 * a / b).toFixed(1)}%`;
const cid = codeId();
console.log(`WHERE A SOLVED PLAN'S PATH GOES (step P, D56; EXPLORATORY): ${ids.join(', ')}; ${N} paths of seed ${SEED} on one thread, the first ${WARM} run untimed first; ${REPLAY} paths' decisions replayed; code ${cid ? cid.hash : 'unknown'}; ${cpus().length} cores (${cpus()[0].model}), load ${loadavg().map(x => x.toFixed(2)).join(' ')} at the start`);

/* the self time by function of a CPU profile (the inspector's sampling profiler): each node's hits times the mean sample interval */
function selfTimes(profile) {
  const dt = profile.timeDeltas.reduce((a, b) => a + b, 0) / Math.max(1, profile.timeDeltas.length) / 1000;   // ms a sample
  const by = new Map();
  for (const nd of profile.nodes) {
    const cf = nd.callFrame, file = (cf.url || '').replace(/^.*\/(src|research)\//, '$1/');
    const key = `${cf.functionName || '(anonymous)'} ${file ? `${file}:${cf.lineNumber + 1}` : ''}`.trim();
    by.set(key, (by.get(key) || 0) + nd.hitCount * dt);
  }
  const total = [...by.values()].reduce((a, b) => a + b, 0);
  return { total, top: [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP) };
}

const session = new Session();
session.connect();
for (const id of ids) {
  if (!byId[id]) throw new Error(`no household ${id}`);
  const plan = E.normalizePlan(byId[id].plan);
  let t0 = now();
  const r = solveForApp(E, M, plan);
  const solveS = (now() - t0) / 1000;
  const yc = yourContext(E, plan), sc = solvedContext(E, r);
  const paths = E.pathsForSeed(SEED, N, sc.totalYears);
  const levels = new Set(r.actions.map(a => (a.spendLevel !== undefined ? a.spendLevel : 1))).size;
  const worlds = r.mix ? r.mix.tables.length : 1;
  console.log(`\n== ${id}: solved at the app's settings in ${f1(solveS)} s on one thread (${r.meta && r.meta.points ? `${r.meta.points} points` : '45 points'}); ${sc.totalYears + 1} years a path; the chooser: ${r.actions.length} moves a decision, ${levels} spending levels, ${worlds} world${worlds === 1 ? '' : 's'}, the shared year ${CHOOSER.share ? 'on' : 'off'}`);

  // 1. both arms, ms a path, after a warm-up
  for (let i = 0; i < Math.min(WARM, N); i++) { runPath(E, yc, paths[i]); runPath(E, sc, paths[i]); }
  t0 = now(); let yoursOk = 0;
  for (const zs of paths) yoursOk += runPath(E, yc, zs).survived ? 1 : 0;
  const yoursMs = (now() - t0) / N;
  // 2. the solved plan's path, the choice timed inside it
  const orig = sc.policyOverride;
  let chooseMs = 0, decisions = 0;
  const timed = { ...orig, choose(state, t, held) { const a = now(); const x = orig.choose(state, t, held); chooseMs += now() - a; decisions++; return x; } };
  const sct = { ...sc, policyOverride: timed };
  t0 = now(); let solvedOk = 0;
  for (const zs of paths) solvedOk += runPath(E, sct, zs).survived ? 1 : 0;
  const solvedMs = (now() - t0) / N;
  console.log(`1. a path: your plan's ${f2(yoursMs)} ms (survival ${pc(yoursOk, N)}), the solved plan's ${f2(solvedMs)} ms (survival ${pc(solvedOk, N)}), ${f1(solvedMs / yoursMs)} times; both arms (the Strategy tab's runs) ${f2(yoursMs + solvedMs)} ms, so 2,000 paths ${f1(2 * (yoursMs + solvedMs))} s on one thread`);
  console.log(`2. the solved plan's path: the table's choice ${f2(chooseMs / N)} ms (${pc(chooseMs / N, solvedMs)}), the rest of the engine's years ${f2(solvedMs - chooseMs / N)} ms; ${f1(decisions / N)} decisions a path, ${f1(1000 * chooseMs / decisions)} us a decision, ${f2(1000 * chooseMs / decisions / r.actions.length)} us a move scored`);

  // 4. the decisions of the first paths, recorded then replayed
  const rec = [];
  const recorder = { ...orig, choose(state, t, held) { rec.push({ ms: structuredClone(modelStateOf(state)), t, held: held ? { pen: held.pen, isa: held.isa } : null }); return orig.choose(state, t, held); } };
  const scr = { ...sc, policyOverride: recorder };
  for (let i = 0; i < Math.min(REPLAY, N); i++) runPath(E, scr, paths[i]);
  const vs = rec.map(d => vecOf(r.m, d.ms));
  t0 = now(); for (let k = 0; k < 5; k++) for (const d of rec) vecOf(r.m, d.ms);
  const vecUs = 1000 * (now() - t0) / (5 * rec.length);
  const sc0 = { ...SHARE_CHECKED };
  t0 = now(); for (let k = 0; k < 3; k++) rec.forEach((d, i) => chooseAction(r, vs[i], d.t, d.held));
  const chooseUs = 1000 * (now() - t0) / (3 * rec.length);
  const dh = SHARE_CHECKED.hits - sc0.hits, dm = SHARE_CHECKED.miss - sc0.miss, df = SHARE_CHECKED.fails - sc0.fails, per = 3 * rec.length;
  const nq = (r.quadWeights || []).length, L = vs[0] ? vs[0].length : 0;
  await session.post('Profiler.enable');
  await session.post('Profiler.setSamplingInterval', { interval: 100 });
  await session.post('Profiler.start');
  for (let k = 0; k < 5; k++) rec.forEach((d, i) => chooseAction(r, vs[i], d.t, d.held));
  const { profile } = await session.post('Profiler.stop');
  await session.post('Profiler.disable');
  const st = selfTimes(profile);
  console.log(`3. replayed, ${rec.length} decisions of the first ${Math.min(REPLAY, N)} paths: the position's vector ${f1(vecUs)} us a decision, chooseAction ${f1(chooseUs)} us a decision`);
  console.log(`   a decision, over its worlds: ${f1(dm / per)} moves scored afresh, ${f1(dh / per)} answered by the memo (the same position after the move), ${f1(df / per)} failing; ${nq || 'the default'} quadrature nodes; the position ${L} numbers; the step read ${r.stepExact ? 'on' : 'off'}`);
  console.log(`4. chooseAction replayed five times under the sampling profiler (${f1(st.total)} ms sampled), self time by function, the top ${TOP}:`);
  for (const [k, ms] of st.top) console.log(`     ${pc(ms, st.total).padStart(6)}  ${k}`);
}
session.disconnect();
console.log('\nEXPLORATORY: a measurement for step P (D56), deciding nothing; the budgets are measured again once its cuts are in.');
