/*
 * HOW MUCH OF A LANDING IS SOLVING, AND HOW MUCH IS RUNNING PATHS FORWARD?
 *
 *   SOLVER_PROFILE=1 [POINTS=30] [SEARCH=5400] [MIX=3] [TIERS=1] node research/solver/split.mjs <bandIndex>
 *
 * The question behind it: every phase of Part E - E0, E1, E2, E3, E4 - makes the SOLVE faster, and
 * none of them touches the forward passes. If the forward passes are a large share of a landing, then
 * E3's measured 30.2% saving is 30.2% of only part of the run, and the cheapest remaining win is the
 * search-path count (task #108) rather than any of Part E.
 *
 * This is deliberately NOT an estimate differenced from two runs that changed several things at once.
 * The timers sit inside solveFlex, around the solve and around rateOn, and are off without
 * SOLVER_PROFILE. They cost a Date.now() per solve and per path batch, which is nothing beside either.
 */
import * as E from '/home/user/vitejs-vite-kdvuf9qw/research/engine.mjs';
import * as M from '/home/user/vitejs-vite-kdvuf9qw/src/solver/model.js';
import { solveFlex } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/solve.js';
import { tiersFor } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/fast.js';
import { buildScenarios } from '/home/user/vitejs-vite-kdvuf9qw/research/policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';

const HERE = '/home/user/vitejs-vite-kdvuf9qw/research/solver';
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync(HERE + '/results/band-70-98-7001.json', 'utf8'));
const sc = singles[band[Number(process.argv[2] || 0)].i];
const raw = JSON.parse(JSON.stringify(sc.plan));
const target = E.num(raw.spending.targetSpend, 0);
const plan = E.resolveMpaa(E.normalizePlan({ ...raw,
  config: { ...raw.config, guardrails: false, lookaheadYears: 0 },
  spending: { ...raw.spending, floorSpend: Math.round(target * 0.8), floorConfidence: 90 } }));
const m = M.prepare(E, plan);
const POINTS = Number(process.env.POINTS || 30);
const SEARCH = Number(process.env.SEARCH || 5400);
const MIX = process.env.MIX !== undefined ? Number(process.env.MIX) : 3;

const t0 = Date.now();
const r = solveFlex(E, M, plan, {
  points: POINTS, lump: m.ctx.fullLumpSum, searchPaths: SEARCH, seed: 7001, confidence: 0.9,
  bisectSteps: 5, margin: 0.005, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.9, 0.8],
  tiers: process.env.TIERS === '1' ? tiersFor(m) : undefined, mix: MIX || undefined
});
const wall = Date.now() - t0;
const p = r.meta.split;
console.log(`${sc.id} ${sc.name.slice(0, 36)}  ${m.ctx.totalYears + 1} years, ${POINTS} points, mix ${MIX}, tiers ${process.env.TIERS === '1' ? 'on' : 'off'}`);
console.log(`landed: ${r.meta.landed}, ${r.meta.solves} solves, ${SEARCH} search paths`);
if (!p) { console.log(`timers OFF (set SOLVER_PROFILE=1): wall clock ${(wall / 1000).toFixed(1)}s`); process.exit(0); }
const pc = (x) => (100 * x / p.totalMs).toFixed(1).padStart(5) + '%';
console.log(`\n  ${'what'.padEnd(38)}${'seconds'.padStart(9)}${'share'.padStart(8)}`);
console.log(`  ${`solving (${p.solveCalls} tables)`.padEnd(38)}${(p.solveMs / 1000).toFixed(1).padStart(9)}${pc(p.solveMs).padStart(8)}`);
console.log(`  ${`running paths forward (${p.fwdRuns.toLocaleString()})`.padEnd(38)}${(p.fwdMs / 1000).toFixed(1).padStart(9)}${pc(p.fwdMs).padStart(8)}`);
console.log(`  ${'landing, total'.padEnd(38)}${(p.totalMs / 1000).toFixed(1).padStart(9)}${'100.0%'.padStart(8)}`);
console.log(`  (wall clock ${(wall / 1000).toFixed(1)}s; the gap is plan prep and path generation)`);
console.log(`\n  per solve       ${(p.solveMs / Math.max(1, p.solveCalls) / 1000).toFixed(1)}s`);
console.log(`  per 1,000 paths ${(p.fwdMs / Math.max(1, p.fwdRuns)).toFixed(2)}ms x 1000 = ${(p.fwdMs / Math.max(1, p.fwdRuns)).toFixed(1)}s`);
console.log(`\n  WHAT IT MEANS FOR PART E: every phase of Part E speeds up the ${pc(p.solveMs).trim()} above, not the ${pc(p.fwdMs).trim()}.`);
console.log(`  E3's measured 30.2% of cell work is therefore about ${(30.2 * p.solveMs / p.totalMs).toFixed(1)}% of a landing.`);
