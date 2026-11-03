/*
 * THE STRATEGY TAB'S SIMULATION SPLIT ACROSS WORKERS (Part C Phase 9; the launch plan section 4: "the simulation, split";
 * the fast tier by D53's FAST_JOINING). Where the page is isolated a solve is split across workers (src/solverPool.js), and
 * each part keeps its solve and runs its own share of the paths, the results joined in path order (src/solverStrategy.js
 * joinRuns), so the figures are the whole run's bit for bit. On S126 at light settings, on Node's worker threads:
 *   1. split two ways, each part running paths of its own share: the figures (headline, comparison, raise) the same as one
 *      whole solve running every path (three ways checked once by hand, 1 Nov: the same);
 *   2. planted, part 1 leaving out the first path of its share: refused (the parts do not meet), never a different figure.
 *   node research/tests/sim-split.test.mjs
 */
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveForApp } from '../../src/solverApp.js';
import { arenaFor, arenaPool } from '../../src/solverPool.js';
import { strategyRuns, joinRuns, strategySummary, strategyOf } from '../../src/solverStrategy.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const WORKER = fileURLToPath(new URL('./sim-split-worker.mjs', import.meta.url));
const opts = { points: 4, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } };
const plan = E.normalizePlan(buildScenarios().find(s => s.id === 'S126').plan), SEED = 12345, N = 160;

const whole = strategyOf(E, solveForApp(E, M, plan, opts), plan, { trials: N, seed: SEED });
// the paths shared out as the page does: an even share each, part 0 the first
const shares = parts => Array.from({ length: parts }, (_, k) => [Math.floor((k * N) / parts), Math.floor(((k + 1) * N) / parts)]);
async function split(parts, planted = null) {
  const arena = arenaFor();
  if (!arena) throw new Error('no growable SharedArrayBuffer here');
  const sh = shares(parts), got = [], ends = [];
  for (let part = 1; part < parts; part++) {
    const w = new Worker(WORKER, { workerData: { part, parts, arena, plan, opts, seed: SEED, from: sh[part][0], to: sh[part][1], planted } });
    ends.push(new Promise((resolve, reject) => {
      w.on('message', m => (m.error ? reject(new Error(m.error)) : got.push(m.runs)));
      w.once('error', e => { Atomics.store(new Int32Array(arena.ctrl), 2, 1); reject(e); });
      w.once('exit', code => (code === 0 ? resolve() : reject(new Error(`part ${part} exited ${code}`))));
    }));
  }
  const pool = arenaPool(0, parts, arena);
  let r;
  try { r = solveForApp(E, M, plan, { ...opts, e2: pool }); } catch (e) { pool.fail(); throw e; }
  const mine = strategyRuns(E, r, plan, { seed: SEED, from: sh[0][0], to: sh[0][1] });
  await Promise.all(ends);
  return strategySummary(E, r, joinRuns([mine, ...got]));
}
for (const parts of [2]) {
  const s = await split(parts);
  ok(JSON.stringify(s) === JSON.stringify(whole), `1. split ${parts} ways, each part running its share of ${N} paths: every figure the whole run's (survival ${s.headline.survival.toFixed(2)}%, start ${s.headline.startLevel}%, ${s.headline.case}; yours ${s.compare.yours.survival.toFixed(2)}%)`);
}
let refused = '';
try { await split(2, 'drop'); } catch (e) { refused = e.message; }
ok(/path order/.test(refused), `2. planted, part 1 leaving out its first path: refused (${refused || 'not refused'})`);
console.log(`\n${failed ? `FAILED: ${failed} of ${n + failed}` : `ALL PASS: ${n}`}`);
process.exit(failed ? 1 : 0);
