/*
 * STEP P'S ACCEPTANCE (the launch plan's step P: "results-perf-step.txt, printed by a script, gives the time from an edit to a
 * solved and simulated plan, and the memory, before and after ... the four households, one worker and split, and the locked
 * position beside the base"). EXPLORATORY: a measurement, deciding nothing.
 *
 * On gate 5's four households (audit-e2x.mjs's PANEL: bridge 4, S126, S370, share 0.50), each with its floor at 80% of its
 * target (B2), at the app's settings (src/solverApp.js solveForApp, 45 points):
 *   1. one worker: the solve; the Strategy tab's paths (src/solverStrategy.js strategyRuns: the solved plan and the plan as
 *      entered) on N paths, ms a path; so an edit to a solved and simulated plan, the solve and 5,000 paths (the 5,000 at the
 *      measured rate, printed as such);
 *   2. split four ways, as the page runs it: the solve on src/solverPool.js's arena (Node's worker threads, the main thread
 *      part 0), then the Strategy tab's 2,000 paths and then up to 5,000, shared out to every part at once, the owner among
 *      them (src/solverClient.js strategyNow), joined in path order; the solved plan's 5,000 outcomes hashed, so two trees'
 *      runs can be compared bit for bit;
 *   3. the dial at ten (B3a, solved on the base's tiers: solveForApp with `base`): its solve and its paths in one worker,
 *      beside the base's;
 *   4. the memory: the tables' bytes (src/solverDigest.js sizeOf), the base's and the position's, and the process's peak
 *      resident set; each solve's tables fingerprinted (digestOf), so two trees' tables can be compared bit for bit.
 * Every time is the wall clock of a machine running nothing else, the solve's CPU on its thread beside it.
 *   node research/solver/perf-step.mjs [--paths N] [id ...]     (N 500; the four households unless named)
 * Run from the root of the tree being measured (a worktree for "before", with this file and perf-step-worker.mjs copied in).
 */
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { cpus, loadavg } from 'node:os';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaFor, arenaPool } from '../../src/solverPool.js';
import { strategyRuns, joinRuns, strategySummary } from '../../src/solverStrategy.js';
import { tablesOf, sizeOf, digestOf } from '../../src/solverDigest.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { codeId } from './code-id.mjs';

const WORKER = fileURLToPath(new URL('./perf-step-worker.mjs', import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = Number(args[i + 1]); args.splice(i, 2); return v; };
const N = opt('--paths', 500), PARTS = 4, SEED = 12345, FIRST = 2000, MORE = 5000, DIAL = 10;
const PANEL = ['bridge 4', 'S126', 'S370', 'share 0.50'];
const ids = args.length ? args : PANEL;
const cid = codeId();
const wall = t => (performance.now() - t) / 1000;
const cpuS = c => { const u = process.threadCpuUsage(c); return (u.user + u.system) / 1e6; };
const mb = r => sizeOf(tablesOf(r)).bytes / 1048576;
console.log(`STEP P'S ACCEPTANCE (EXPLORATORY): ${ids.join(', ')}; the floor at 80%; seed ${SEED}; one-worker paths ${N} (scaled to 5,000); split ${PARTS} ways; code ${cid ? cid.hash : 'unknown'}; ${cpus().length} cores (${cpus()[0].model}), load ${loadavg().map(x => x.toFixed(2)).join(' ')} at the start`);

// audit-e2x.mjs's variant(), copied: S126 with its pension share or bridge length changed
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0);
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) };
    return a;
  });
  const age = E.num(p.demographics.privatePensionAge, 58) - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return { id: name, plan: p };
}
const BUILT = { 'bridge 4': { bridge: 4 }, 'share 0.50': { a0: 0.5 } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
const withFloor = p => E.normalizePlan({ ...p, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } });
const atDial = (p, pos) => ({ ...p, solver: { ...(p.solver || {}), aims: { ...((p.solver && p.solver.aims) || {}), cuts: pos } } });
const hashRuns = rs => { const h = createHash('sha256'); for (const x of rs) h.update(`${x.survived}:${x.failT}:${x.terminalPot}:${x.terminalPotNet}:${x.lifetimeTax}:${x.delivered};`); return h.digest('hex').slice(0, 16); };

for (const id of ids) {
  const c = caseOf(id);
  if (!c) throw new Error(`no household ${id}`);
  const plan = withFloor(c.plan);
  // 1. one worker
  let t = performance.now(), cu = process.threadCpuUsage();
  const r = solveForApp(E, M, plan);
  const solve1 = wall(t), solve1cpu = cpuS(cu);
  t = performance.now(); strategyRuns(E, r, plan, { seed: SEED, from: 0, to: N }); const ms1 = 1000 * wall(t) / N;
  const edit1 = solve1 + 5 * ms1;   // the solve and 5,000 paths, in seconds (5,000 x ms / 1,000)
  const dig = (await digestOf(tablesOf(r))).slice(0, 16);
  console.log(`\n== ${id}: one worker: the solve ${solve1.toFixed(1)} s (${solve1cpu.toFixed(1)} s of CPU); the Strategy tab's paths ${ms1.toFixed(1)} ms a path (${N} paths); so an edit to a solved and simulated plan (the solve and 5,000 paths at that rate) ${(edit1 / 60).toFixed(1)} min; the tables ${mb(r).toFixed(0)} MB, digest ${dig}`);
  // 2. split four ways, as the page runs it
  const arena = arenaFor();
  if (!arena) throw new Error('no growable SharedArrayBuffer here');
  const workers = [], solvedP = [], replies = [];
  for (let part = 1; part < PARTS; part++) {
    const w = new Worker(WORKER, { workerData: { part, parts: PARTS, arena, plan, seed: SEED } });
    const queue = []; replies[part] = queue;
    solvedP.push(new Promise((resolve, reject) => {
      w.on('message', m => { if (m.error) reject(new Error(m.error)); else if (m.solved) resolve(); else { const q = queue.shift(); q && q(m.runs); } });
      w.once('error', e => { Atomics.store(new Int32Array(arena.ctrl), 2, 1); reject(e); });
    }));
    workers.push(w);
  }
  const ask = (part, from, to) => new Promise(resolve => { replies[part].push(resolve); workers[part - 1].postMessage({ from, to }); });
  const share = (a, b) => Array.from({ length: PARTS }, (_, k) => [a + Math.floor((k * (b - a)) / PARTS), a + Math.floor(((k + 1) * (b - a)) / PARTS)]);
  t = performance.now();
  const pool = arenaPool(0, PARTS, arena);
  let rs;
  try { rs = solveForApp(E, M, plan, { e2: pool }); } catch (e) { pool.fail(); throw e; }
  await Promise.all(solvedP);
  const solveS = wall(t), tEnd = performance.now();
  const stage = async (a, b) => { const sh = share(a, b), pending = Promise.all(sh.slice(1).map(([f, to], k) => ask(k + 1, f, to))); const mine = strategyRuns(E, rs, plan, { seed: SEED, from: sh[0][0], to: sh[0][1] }); return [mine, ...(await pending)]; };
  let runs = joinRuns(await stage(0, FIRST));
  const head = wall(tEnd), s1 = strategySummary(E, rs, runs);
  runs = joinRuns([runs, ...(await stage(FIRST, MORE))]);
  const more = wall(tEnd), s2 = strategySummary(E, rs, runs);
  workers.forEach(w => w.postMessage('stop'));
  await Promise.all(workers.map(w => w.terminate()));
  console.log(`   split ${PARTS} ways: the solve ${solveS.toFixed(1)} s; then the Strategy tab's 2,000 paths ${head.toFixed(1)} s, 5,000 ${more.toFixed(1)} s; so an edit to a solved and simulated plan ${((solveS + more) / 60).toFixed(1)} min (to the first figures ${((solveS + head) / 60).toFixed(1)} min); survival ${s1.headline.survival.toFixed(2)}% on 2,000, ${s2.headline.survival.toFixed(2)}% on 5,000; the solved plan's 5,000 outcomes ${hashRuns(runs.solved)}`);
  // 3. the dial at ten, on the base's tiers, in one worker
  const p10 = atDial(plan, DIAL);
  t = performance.now(); cu = process.threadCpuUsage();
  const rl = solveForApp(E, M, p10, { base: r });
  const solveL = wall(t), solveLcpu = cpuS(cu);
  t = performance.now(); strategyRuns(E, rl, p10, { seed: SEED, from: 0, to: N }); const msL = 1000 * wall(t) / N;
  const digL = (await digestOf(tablesOf(rl))).slice(0, 16);
  console.log(`   the dial at ${DIAL} (on the base's tiers), one worker: the solve ${solveL.toFixed(1)} s (${solveLcpu.toFixed(1)} s of CPU; x${(solveL / solve1).toFixed(2)} the base's); the paths ${msL.toFixed(1)} ms a path (x${(msL / ms1).toFixed(2)} the base's); so the position from its base ${((solveL + 5 * msL) / 60).toFixed(1)} min; its tables ${mb(rl).toFixed(0)} MB beside the base's, digest ${digL}`);
  console.log(`   the memory: the base's tables and the position's ${(mb(r) + mb(rl)).toFixed(0)} MB; the process's peak resident set so far ${(process.resourceUsage().maxRSS / 1024).toFixed(0)} MB`);
}
console.log('\nEXPLORATORY: a measurement for step P, deciding nothing.');
