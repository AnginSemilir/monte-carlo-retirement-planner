/*
 * WHERE DOES A SOLVE'S TIME GO?  One household, one table, at whatever grid you ask for.
 *
 *   SOLVER_PROFILE=1 [POINTS=20] [TIERS=1] [LEVELS=1.2,1.1,1,0.9,0.8] node research/solver/profile.mjs <bandIndex>
 *
 * Without SOLVER_PROFILE it prints the wall clock only, which is how you price the timers: they cost
 * 18 to 33% and the report subtracts a calibrated per-call figure, so the shares are net but not
 * exact. Measured 2026-09-22 on S004 at 20 points: with tiers off, flow 51% / nodes 39% / other 10%;
 * with tiers on, flow 29% / nodes 59% / other 12%, because the tier variants already reuse the flow.
 * The reading: flow is independent of lambda, so sharing it across the landing's five to seven solves
 * is the big lever when tiers are off; with tiers on the node loop dominates instead, and what helps
 * both is evaluating fewer (cell, action) pairs at all.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, buildActions } from '../../src/solver/solve.js';
import { tiersFor } from '../../src/solver/fast.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
const HERE = '/home/user/vitejs-vite-kdvuf9qw/research/solver';
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync(HERE + '/results/band-70-98-7001.json', 'utf8'));
const sc = singles[band[Number(process.argv[2] || 0)].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(sc.plan)), config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const POINTS = Number(process.env.POINTS || 30);
const LEVELS = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number) : undefined;
const opts = { points: POINTS, lump: m.ctx.fullLumpSum, spendLevels: LEVELS, lambda: 0.2,
  tiers: process.env.TIERS === '1' ? tiersFor(m) : undefined };
const r = solve(E, M, plan, opts);
const p = r.meta.profile;
if (!p) { console.log(`${sc.id} timers OFF: solve() wall clock ${(r.meta.ms/1000).toFixed(2)}s`); process.exit(0); }
const pc = (x) => (100 * x / p.total).toFixed(1).padStart(5) + '%';
console.log(`${sc.id} ${sc.name.slice(0, 34)}  ${r.meta.years} years, ${POINTS} points, ${r.meta.actions} moves, ${r.meta.size} cells/yr`);
console.log(`  cells visited ${p.cells.toLocaleString()}, flows run ${p.flows.toLocaleString()}, tier variants reusing a flow ${p.skipped.toLocaleString()}`);
console.log(`\n  ${'phase'.padEnd(34)}${'seconds'.padStart(9)}${'share'.padStart(8)}`);
console.log(`  ${'flow: the year\'s draws and tax'.padEnd(34)}${(p.flow / 1000).toFixed(2).padStart(9)}${pc(p.flow).padStart(8)}`);
console.log(`  ${'nodes: expectation over returns'.padEnd(34)}${(p.nodes / 1000).toFixed(2).padStart(9)}${pc(p.nodes).padStart(8)}`);
console.log(`  ${'everything else in the loop'.padEnd(34)}${(p.other / 1000).toFixed(2).padStart(9)}${pc(p.other).padStart(8)}`);
console.log(`  ${'backward loop, total'.padEnd(34)}${(p.total / 1000).toFixed(2).padStart(9)}${'100.0%'.padStart(8)}`);
console.log(`  ${'solve() wall clock'.padEnd(34)}${(r.meta.ms / 1000).toFixed(2).padStart(9)}   (setup and allocation is the difference)`);
