/*
 * GATE 3 ON THE PRE-REGISTERED SET. For each household in the 70-98 band: solve (30-point total-wealth grid,
 * withdrawal order only), then score three things on the same held-out seed through the REAL engine:
 * the solved table as the plan's policy, the plan's own rule, and the reduced model's own forecast of
 * the table (the fast flow on the same seed's draws). The gap is the model-to-engine gap, per household.
 *   ONLY=<k> node research/solver/bridge-gate.mjs run <tag> [points=30] [trials=3000] [seed=9102]
 *   node research/solver/bridge-gate.mjs reduce <tag>
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, solveMixture, runPolicy } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS = join(HERE, 'results');
const mode = process.argv[2];
const tag = process.argv[3] || 'bridge';
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));

if (mode === 'run') {
  const POINTS = Number(process.argv[4] || 30), TRIALS = Number(process.argv[5] || 3000), SEED = Number(process.argv[6] || 9102);
  const band = JSON.parse(readFileSync(join(RESULTS, 'band-70-98-7001.json'), 'utf8'));
  const k = Number(process.env.ONLY);
  const sc = singles[band[k].i];
  const plan = prep(sc.plan);
  const m0 = M.prepare(E, plan);
  const t0 = Date.now();
  const MIX = process.env.MIX !== undefined ? Number(process.env.MIX) : 5;   // the mixture by default since gate 3; MIX=0 for the folded single table
  const r = MIX ? solveMixture(E, M, plan, { points: POINTS, lump: m0.ctx.fullLumpSum, mix: MIX }) : solve(E, M, plan, { points: POINTS, lump: m0.ctx.fullLumpSum });
  const mcT = E.monteCarlo(withTable(plan, r), { trials: TRIALS, seed: SEED });
  const mcF = E.monteCarlo(plan, { trials: TRIALS, seed: SEED });
  const zs = E.pathsForSeed(SEED, TRIALS, m0.ctx.totalYears);
  const fwd = zs.map(z => runPolicy(r, z));
  const forecast = 100 * fwd.filter(x => x.survived).length / zs.length;
  const out = { tag, id: sc.id, name: sc.name, points: POINTS, trials: TRIALS, seed: SEED, mixture: MIX, solveMs: r.meta.ms, engineTable: mcT.successRate, engineFixed: mcF.successRate, forecast, gap: mcT.successRate - forecast, edge: mcT.successRate - mcF.successRate, medianTable: mcT.medianTerminalNet, medianFixed: mcF.medianTerminalNet, p10Table: mcT.p10TerminalNet, p10Fixed: mcF.p10TerminalNet, ms: Date.now() - t0 };
  mkdirSync(join(RESULTS, tag), { recursive: true });
  writeFileSync(join(RESULTS, tag, `${sc.id}.json`), JSON.stringify(out, null, 1));
  console.log(`${sc.id} ${sc.name.slice(0, 32).padEnd(33)} engine: table ${out.engineTable.toFixed(1)}  fixed ${out.engineFixed.toFixed(1)}  edge ${out.edge >= 0 ? '+' : ''}${out.edge.toFixed(2)}  | model forecast ${forecast.toFixed(1)}  gap ${out.gap >= 0 ? '+' : ''}${out.gap.toFixed(2)}  ${(out.ms / 1000).toFixed(0)}s`);
}

if (mode === 'reduce') {
  const dir = join(RESULTS, tag);
  const rows = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(dir, f), 'utf8'))).sort((a, b) => a.id.localeCompare(b.id));
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  console.log(`${rows.length} households, tag ${tag}, ${rows[0].points} points, ${rows[0].trials} paths through the real engine, seed ${rows[0].seed}\n`);
  console.log('id    engine: table / fixed   edge    model forecast   gap');
  for (const r of rows) console.log(`${r.id}  ${r.engineTable.toFixed(1).padStart(5)} / ${r.engineFixed.toFixed(1).padStart(5)}   ${(r.edge >= 0 ? '+' : '') + r.edge.toFixed(2).padStart(5)}   ${r.forecast.toFixed(1).padStart(6)}        ${(r.gap >= 0 ? '+' : '') + r.gap.toFixed(2)}`);
  const gaps = rows.map(r => r.gap), edges = rows.map(r => r.edge);
  console.log(`\nmodel-to-engine gap (engine minus forecast): mean ${mean(gaps) >= 0 ? '+' : ''}${mean(gaps).toFixed(2)}, worst |gap| ${Math.max(...gaps.map(Math.abs)).toFixed(2)}, within 2 points on ${gaps.filter(g => Math.abs(g) <= 2).length} of ${rows.length}, within 1 on ${gaps.filter(g => Math.abs(g) <= 1).length}`);
  console.log(`edge in the real engine (table minus the plan's own rule): mean ${mean(edges) >= 0 ? '+' : ''}${mean(edges).toFixed(2)}, up on ${edges.filter(e => e > 0).length}, down on ${edges.filter(e => e < 0).length}; worst ${Math.min(...edges).toFixed(2)}; median pot table minus fixed £${Math.round(mean(rows.map(r => r.medianTable - r.medianFixed)) / 1000)}k`);
  console.log('=== bridge gate reduced ===');
}
