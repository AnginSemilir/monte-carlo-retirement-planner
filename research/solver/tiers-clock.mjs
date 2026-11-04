/*
 * WHY solver-tiers.test.mjs's C2 TIMES THE THREAD'S CPU (3 Nov; a diagnostic, deciding nothing).
 *
 * C2 asks that the solve with the joint tier moves cost under two and a half times the plain solve, each timed once. The
 * full tier runs two test files at once (run-shard.mjs -j 2), so a neighbour's load can land on one of the two solves and
 * not the other. This repeats C2's measurement on its two households with that happening on purpose: busy processes, twice
 * as many as the cores, started just before the tier solve and stopped after it, the plain solve run with nothing beside it.
 * It prints each ratio on the wall clock, as C2 read it before, and on the thread's CPU clock (cpu-time.mjs), as it reads
 * it now, with C2's bar of 2.5.
 *   node research/solver/tiers-clock.mjs > research/solver/results-tiers-clock.txt
 */
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { cpuNs } from '../tests/cpu-time.mjs';
import { codeId } from './code-id.mjs';

const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const picks = [singles[3], singles[Math.floor(singles.length * 0.6)]];   // C2's two households
const n = 2 * cpus().length, BAR = 2.5;
const cid = codeId();
console.log(`C2's measurement with a neighbour's load on the tier solve only (EXPLORATORY, a diagnostic): ${picks.map(s => s.id).join(', ')}, 16 points; ${n} busy processes on ${cpus().length} cores (${cpus()[0].model}) during the tier solve; code ${cid ? cid.hash : 'unknown'}`);
const timed = work => { const w0 = performance.now(); const c = cpuNs(work, 1, 1).first / 1e6; return { wall: performance.now() - w0, cpu: c }; };
let wallOver = 0, cpuOver = 0;
for (const sc of picks) {
  const plan = prep(sc.plan);
  const a = timed(() => solve(E, M, plan, { points: 16, skipLump: true }));
  const hogs = Array.from({ length: n }, () => spawn(process.execPath, ['-e', 'for(;;){}'], { stdio: 'ignore' }));
  await new Promise(r => setTimeout(r, 300));
  const b = timed(() => solve(E, M, plan, { points: 16, skipLump: true, tiers: true }));
  hogs.forEach(h => h.kill());
  const rw = b.wall / a.wall, rc = b.cpu / a.cpu;
  wallOver += rw >= BAR; cpuOver += rc >= BAR;
  console.log(`  ${sc.id}: the plain solve ${a.wall.toFixed(0)} ms on the wall clock, ${a.cpu.toFixed(0)} ms of CPU; the tier solve under the load ${b.wall.toFixed(0)} ms on the wall clock, ${b.cpu.toFixed(0)} ms of CPU; the ratio on the wall clock ${rw.toFixed(2)}x (${rw < BAR ? 'under' : 'OVER'} ${BAR}), on the CPU ${rc.toFixed(2)}x (${rc < BAR ? 'under' : 'OVER'} ${BAR})`);
}
console.log(`VERDICT: C2 on the wall clock would fail on ${wallOver} of ${picks.length} households under this load; on the thread's CPU, ${cpuOver} of ${picks.length}`);
