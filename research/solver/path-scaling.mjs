/*
 * HOW THE SOLVED PLAN'S PATHS SCALE ACROSS THREADS (step P, D56; EXPLORATORY: it measures, it decides nothing).
 *
 * Phase 9's budgets (results-budget-strategy.txt) found four threads running the Strategy tab's paths at under twice one. This
 * asks whether that is the paths' own cost or the threads': a solve at the app's settings split four ways on
 * src/solverPool.js's arena, as budget-strategy.mjs makes it (path-scaling-worker.mjs, its worker timed on its own thread), then the same number of
 * the Strategy tab's paths (src/solverStrategy.js strategyRuns: both arms) run
 *   1. on one part alone, the others idle;
 *   2. on two parts at once, each its own paths;
 *   3. on all four at once, each its own paths;
 * each part timed on its own, ms a path. Paths run alone and at once are different paths of the same seed, the same count
 * each, so the comparison is of the threads, not the paths: each stage is run twice, the parts' paths swapped round.
 *   node research/solver/path-scaling.mjs [id] [--paths N]    (S002, 100 paths a part)
 * Run with nothing else on the machine; its output is research/solver/results-path-scaling.txt.
 */
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { cpus, loadavg } from 'node:os';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaFor, arenaPool } from '../../src/solverPool.js';
import { strategyRuns } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { codeId } from './code-id.mjs';

const WORKER = fileURLToPath(new URL('./path-scaling-worker.mjs', import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = Number(args[i + 1]); args.splice(i, 2); return v; };
const P = opt('--paths', 100), PARTS = 4, SEED = 12345;
const id = args[0] || 'S002';
const byId = Object.fromEntries(buildScenarios().map(s => [s.id, s]));
const cid = codeId();
console.log(`HOW THE SOLVED PLAN'S PATHS SCALE ACROSS THREADS (step P, D56; EXPLORATORY): ${id}; split ${PARTS} ways; ${P} paths of seed ${SEED} a part a stage; code ${cid ? cid.hash : 'unknown'}; ${cpus().length} cores (${cpus()[0].model}), load ${loadavg().map(x => x.toFixed(2)).join(' ')} at the start`);

const plan = E.normalizePlan(byId[id].plan), arena = arenaFor();
if (!arena) throw new Error('no growable SharedArrayBuffer here');
const workers = [], solvedP = [], replies = [];
for (let part = 1; part < PARTS; part++) {
  const w = new Worker(WORKER, { workerData: { part, parts: PARTS, arena, plan, seed: SEED } });
  const queue = []; replies[part] = queue;
  solvedP.push(new Promise((resolve, reject) => {
    w.on('message', m => { if (m.error) reject(new Error(m.error)); else if (m.solved) resolve(); else { const q = queue.shift(); q && q(m.ms); } });
    w.once('error', reject);
  }));
  workers.push(w);
}
// a worker part's paths, timed on its own thread
const ask = (part, from, to) => new Promise(resolve => { replies[part].push(resolve); workers[part - 1].postMessage({ from, to }); });
const t0 = performance.now(), pool = arenaPool(0, PARTS, arena);
let r;
try { r = solveForApp(E, M, plan, { e2: pool }); } catch (e) { pool.fail(); throw e; }
await Promise.all(solvedP);
console.log(`the solve split ${PARTS} ways: ${((performance.now() - t0) / 1000).toFixed(1)} s`);
const own = (from, to) => { const t = performance.now(); strategyRuns(E, r, plan, { seed: SEED, from, to }); return performance.now() - t; };
// warm every part on its own first paths, untimed
await Promise.all([own(0, 10), ...[1, 2, 3].map(p => ask(p, 10 * p, 10 * p + 10))]);
let next = 1000;   // fresh paths from here on, P a part a stage
const take = () => { const a = next; next += P; return [a, a + P]; };
const msA = ms => (ms / P).toFixed(2);
async function stage(parts, label) {
  const out = [];
  for (let rep = 0; rep < 2; rep++) {
    const ranges = parts.map(() => take());
    const order = rep ? ranges.slice().reverse() : ranges;
    const ts = await Promise.all(parts.map((p, k) => (p === 0 ? Promise.resolve().then(() => own(...order[k])) : ask(p, ...order[k]))));
    out.push(...ts);
  }
  const mean = out.reduce((a, b) => a + b, 0) / out.length;
  console.log(`${label}: ${out.map(msA).join(', ')} ms a path (each part, both rounds); mean ${msA(mean)}`);
  return mean / P;
}
const one0 = await stage([0], '1. the owner alone');
const one1 = await stage([1], '1. a worker part alone');
const two = await stage([0, 1], '2. two parts at once');
const four = await stage([0, 1, 2, 3], '3. four parts at once');
const one = (one0 + one1) / 2;
console.log(`a path at once against alone: two parts x${(two / one).toFixed(2)}, four parts x${(four / one).toFixed(2)}; so four parts run ${(4 * one / four).toFixed(2)} times as many paths as one in the same time`);
workers.forEach(w => w.postMessage('stop'));
await Promise.all(workers.map(w => w.terminate()));
console.log('\nEXPLORATORY: a measurement for step P (D56), deciding nothing.');
