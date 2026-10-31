/*
 * 7U-F'S BUDGET, from measured units (registrations/fresh-7uf.md's Budget line; the review's Step 4.3: "budget about 0.8 core-
 * hours a unit ... size the broad slice from that"). Each of the audit's units (panel-7uf.mjs unitsOf), costed as
 *   the solve: 7u's own measured solve of that household and arm (results/diag7u/case*.txt, the frozen candidate for CAND
 *     and DECOMP, the product for SHIP), times the package's cost on CAND (PACKAGE_FACTOR: the adaptive reference's build,
 *     the gate-5 estimate's 16.1% to 20.8% on S366 and S360, taken at its top, rounded up); a household 7u did not run
 *     (S362, S382, S406, S418) takes S370's, the same family's;
 *   the simulation: the preflight's measured seconds a path-year (results/preflight-7uf/case*.txt: the engine's runs, runPolicy
 *     beside them, each world's runs, on S224 and S002) times the household's years and 7u-F's paths (16,000 by the engine,
 *     4,000 beside, 2,000 a world on CAND and DECOMP).
 * Both sets of timings were taken under load (four or more processes on four cores), so the estimate leans long.
 *   node research/solver/budget-7uf.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { unitsOf, bridgeYears, N, BESIDE, NW } from './panel-7uf.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), PACKAGE_FACTOR = 1.25, CORES = 4;
const all = buildScenarios(), years = id => E.buildContext(E.normalizePlan(all.find(s => s.id === id).plan)).totalYears + 1;
// 7u's measured solves: { id: { CAND: secs, SHIP: secs } } at W0.02 and W0.01 averaged
const solve7u = {};
for (const f of readdirSync(join(HERE, 'results/diag7u')).filter(f => /^case\d+\.txt$/.test(f))) {
  const t = readFileSync(join(HERE, 'results/diag7u', f), 'utf8'), id = (/^(.+?)\s+case \| unit/m.exec(t) || [])[1], m = /solve (CAND|SHIP)\/\S+: table \S+ secs (\d+)/.exec(t);
  if (!id || !m) continue;
  const x = ((solve7u[id.trim()] = solve7u[id.trim()] || {})[m[1]] = solve7u[id.trim()][m[1]] || []); x.push(+m[2]);
}
const solveOf = (id, arm) => { const src = solve7u[id] ? id : 'S370', v = solve7u[src][arm === 'SHIP' ? 'SHIP' : 'CAND']; return { secs: v.reduce((a, b) => a + b, 0) / v.length * (arm === 'CAND' ? PACKAGE_FACTOR : 1), from: src }; };
// the preflight's seconds a path-year: the engine's 16,000-path part, runPolicy beside it, the worlds
const pre = { engine: [], beside: [], world: [] };
for (const f of readdirSync(join(HERE, 'results/preflight-7uf')).filter(f => /^case\d+\.txt$/.test(f))) {
  const t = readFileSync(join(HERE, 'results/preflight-7uf', f), 'utf8'), id = (/^(\S+)\s+case \| unit/m.exec(t) || [])[1];
  const run = /run \S+: engine \S+ estate \d+ secs (\d+) \| runPolicy on (\d+): \S+, the engine alone \d+, runPolicy alone \d+, secs (\d+)/.exec(t), w = /worlds \S+: secs (\d+)/.exec(t), np = /; (\d+) paths of seed/.exec(t);
  if (!id || !run || !np) continue;
  const Y = years(id), P = +np[1];
  pre.engine.push(+run[1] / (P * Y)); pre.beside.push(+run[3] / (+run[2] * Y)); if (w) pre.world.push(+w[1] / (3 * Math.min(NW, P) * Y));
}
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
if (!pre.engine.length || !pre.world.length) { console.error('budget-7uf: the preflight\'s logs hold no run or world lines'); process.exit(2); }
const perPY = { engine: avg(pre.engine), beside: avg(pre.beside), world: avg(pre.world) };
const hasBridge = id => bridgeYears(E, all.find(s => s.id === id).plan) > 0;
let total = 0; const byArm = {};
for (const [id, arm] of unitsOf(hasBridge)) {
  const Y = years(id), s = solveOf(id, arm).secs, sim = Y * (N * perPY.engine + BESIDE * perPY.beside + (arm === 'SHIP' ? 0 : 3 * NW * perPY.world));
  total += s + sim; byArm[arm] = (byArm[arm] || 0) + s + sim;
}
console.log(`7U-F'S BUDGET: ${unitsOf(hasBridge).length} units; seconds a path-year (the preflight, under load): the engine ${perPY.engine.toExponential(3)}, runPolicy ${perPY.beside.toExponential(3)}, a world's engine run ${perPY.world.toExponential(3)}; solves from 7u's units (CAND x ${PACKAGE_FACTOR})`);
console.log(`  by arm, core-hours: ${Object.entries(byArm).map(([a, s]) => `${a} ${(s / 3600).toFixed(1)}`).join(', ')}`);
console.log(`BUDGET: ${(total / 3600).toFixed(1)} core-hours, about ${(total / 3600 / CORES).toFixed(1)} hours on ${CORES} cores`);
