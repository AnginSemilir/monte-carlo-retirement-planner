/*
 * THE SHAPE OF A SOLVED POLICY, read from one table: what a cell's move shares with its poorer wealth
 * neighbour and with the same cell a year later. Step 0 of Phase E1 (PLAN.md, Part E), which decides
 * whether a candidate-set search seeded from next year's table is worth building.
 *
 *   [POINTS=30] [TIERS=1] [LEVELS=1.2,1.1,1,0.9,0.8] [LAMBDA=0.2] node research/solver/policy-shape.mjs <bandIndex>
 *
 * Measured 2026-09-22 on S004 at 30 points, tiers and levels on, lambda 0.2: along wealth 70.7% of pairs
 * agree; against next year 94.5% identical, 96.8% same draw order, 97.7% same order as next year or as
 * the neighbour; 65 of 216 moves ever chosen. The step 0 read wants the last figure at or above 95% on
 * S004, S184, S268 and S330 with each household's landed lambda from its flex-tiers record.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve } from '../../src/solver/solve.js';
import { tiersFor } from '../../src/solver/fast.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';
const HERE = '/home/user/vitejs-vite-kdvuf9qw/research/solver';
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync(HERE + '/results/band-70-98-7001.json', 'utf8'));
const sc = singles[band[Number(process.argv[2] || 0)].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(sc.plan)), config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const LEVELS = process.env.LEVELS ? process.env.LEVELS.split(',').map(Number) : undefined;
const r = solve(E, M, plan, { points: Number(process.env.POINTS || 30), lump: m.ctx.fullLumpSum, spendLevels: LEVELS, lambda: Number(process.env.LAMBDA || 0.2), tiers: process.env.TIERS === '1' ? tiersFor(m) : undefined });
const g = r.g, T = r.pol.length - 1, acts = r.actions, A = acts.length;
const orderKey = (a) => a.steps.join('>') + '|' + (a.harvest ? a.harvestCeil : '-');
const OK = acts.map(orderKey), LV = acts.map(a => a.spendLevel), TR = acts.map(a => a.tierPen * 4 + a.tierIsa);
const byOrder = {}; acts.forEach((a, i) => { (byOrder[OK[i]] ||= []).push(i); });
const byOrderTier = {}; acts.forEach((a, i) => { (byOrderTier[OK[i] + '#' + TR[i]] ||= []).push(i); });
let sw = { any: 0, order: 0, level: 0, tier: 0 }, pairs = 0;
let yr = { total: 0, exact: 0, sameOrderAnyLevelTier: 0, sameOrderTierAnyLevel: 0, sameOrderOrNeighbourOrder: 0 };
const orders = new Set(OK); const usedOrders = new Set();
for (let t = 0; t <= T; t++) {
  const P = r.pol[t], Pn = t < T ? r.pol[t + 1] : null;
  for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++) for (let it = 0; it < g.nt; it++) for (let ii = 0; ii < g.ni; ii++) {
    let prev = -1;
    for (let ip = 0; ip < g.np; ip++) {
      const idx = g.index(ip, ii, it, ig, ic), a = P[idx]; usedOrders.add(OK[a]);
      if (ip > 0) {
        pairs++;
        if (a !== prev) sw.any++;
        if (OK[a] !== OK[prev]) sw.order++;
        if (LV[a] !== LV[prev]) sw.level++;
        if (TR[a] !== TR[prev]) sw.tier++;
      }
      if (Pn) {
        const n = Pn[idx]; yr.total++;
        if (a === n) yr.exact++;
        if (OK[a] === OK[n]) yr.sameOrderAnyLevelTier++;
        if (OK[a] === OK[n] && TR[a] === TR[n]) yr.sameOrderTierAnyLevel++;
        const nb = ip > 0 ? P[g.index(ip - 1, ii, it, ig, ic)] : -1;
        if (OK[a] === OK[n] || (nb >= 0 && OK[a] === OK[nb])) yr.sameOrderOrNeighbourOrder++;
      }
      prev = a;
    }
  }
}
const pc = (x, n) => (100 * x / n).toFixed(1).padStart(5) + '%';
console.log(`${sc.id}  ${T + 1} years, ${g.np} wealth points, ${A} moves = ${orders.size} draw orders x ${new Set(LV).size} levels x ${new Set(TR).size} tiers`);
console.log(`  along wealth, a cell differs from its poorer neighbour in:`);
console.log(`    anything ${pc(sw.any, pairs)}   draw order ${pc(sw.order, pairs)}   spend level ${pc(sw.level, pairs)}   tier ${pc(sw.tier, pairs)}`);
console.log(`  draw orders ever chosen anywhere: ${usedOrders.size} of ${orders.size}`);
console.log(`  this year's optimum at a cell, against next year's at the same cell:`);
console.log(`    identical move                          ${pc(yr.exact, yr.total)}`);
console.log(`    same draw order (any level, any tier)   ${pc(yr.sameOrderAnyLevelTier, yr.total)}   candidate set size ${Object.values(byOrder)[0].length}`);
console.log(`    same order and tier (any level)         ${pc(yr.sameOrderTierAnyLevel, yr.total)}   candidate set size ${Object.values(byOrderTier)[0].length}`);
console.log(`    same order as next year OR as neighbour ${pc(yr.sameOrderOrNeighbourOrder, yr.total)}`);
