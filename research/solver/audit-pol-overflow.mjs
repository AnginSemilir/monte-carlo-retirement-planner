/*
 * HOW MUCH DID THE BYTE-WIDE POLICY TABLE COST?   (found 23 Sep; see results-pol-overflow.txt)
 *
 *   node research/solver/audit-pol-overflow.mjs <bandIndex> [paths=2000]
 *
 * The stored policy was a Uint8Array while the menu had 360 moves, so every stored index above 255 read
 * back as index - 256: a different move. Only one reader acted on it: the FINAL YEAR of every simulated
 * path, where chooseAction returns the stored move. This solves the household in its flex-tiers
 * configuration (landed lambda, five levels, raises, tiers, single table), then simulates the same paths
 * twice - the true final-year move, and the wrapped one the old code used - and reports the difference.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve, runPolicy } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
const K = Number(process.argv[2]), N = Number(process.argv[3] || 2000);
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync('/home/user/vitejs-vite-kdvuf9qw/research/solver/results/band-70-98-7001.json', 'utf8'));
const sc = singles[band[K].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const FT = JSON.parse(readFileSync(`/home/user/vitejs-vite-kdvuf9qw/research/solver/results/flex-tiers/${sc.id}.json`, 'utf8'));
const r = solve(E, M, plan, { points: 30, lambda: FT.solver.lambda, raiseWeight: 0.003, spendLevels: [1.2, 1.1, 1, 0.9, 0.8], tiers: true, lump: m.ctx.fullLumpSum });
const T = m.ctx.totalYears, paths = E.pathsForSeed(7002, N, T);
let wrappedCells = 0; for (const v of r.pol[T]) if (v > 255) wrappedCells++;
const sim = () => { let alive = 0, pot = [], lastLevel = 0; for (const zs of paths) { const o = runPolicy(r, zs); if (o.survived) alive++; pot.push(o.terminalNet); } pot.sort((a, b) => a - b); return { surv: 100 * alive / N, med: pot[N >> 1], p10: pot[Math.floor(N / 10)] }; };
const good = sim();
const keep = r.pol[T]; r.pol[T] = Uint16Array.from(keep, v => v & 255);   // exactly what a byte stored
const bad = sim();
r.pol[T] = keep;
console.log(`${sc.id}  final-year cells storing a move above 255: ${(100 * wrappedCells / keep.length).toFixed(1)}%  |  survival true ${good.surv.toFixed(2)} wrapped ${bad.surv.toFixed(2)} (${(bad.surv - good.surv >= 0 ? '+' : '')}${(bad.surv - good.surv).toFixed(2)})  |  median end pot ${Math.round(good.med / 1e3)}k vs ${Math.round(bad.med / 1e3)}k  |  p10 ${Math.round(good.p10 / 1e3)}k vs ${Math.round(bad.p10 / 1e3)}k`);
