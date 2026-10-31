/*
 * E3 (PLAN.md E3; research option `e3`, off by default): a cell whose taxable pot is empty is copied from its zero-gain
 * twin, not solved. Stated before it ran (29 Sep): on S126, S194 and share-like households, in the product's per-world
 * tables, TS+J with the reader and the reader alone, every table (survival, estate, resilience, policy, shortfall, every
 * world and every tier-state layer) is bit for bit the same with e3 on and off, and the copied share of cells is
 * (ni + nt - 1) / (ni nt) of the non-zero gain buckets' cells. Planted: a copy from the wrong twin (the ISA-share axis
 * shifted) must break identity, or the comparison proves nothing.
 *   node research/tests/solver-e3.test.mjs [points=8]
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const PTS = Number(process.argv[2] || 8);
const planOf = id => { const sc = buildScenarios().find(x => x.id === id); return E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...sc.plan.spending, floorSpend: Math.round(0.8 * E.num(sc.plan.spending.targetSpend, 0)) } })); };
const arrays = r => { const out = []; const W = r.tablesW; const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L); else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  return out; };
const same = (A, B) => { if (A.length !== B.length) return `${A.length} against ${B.length} arrays`; let d = 0; for (let i = 0; i < A.length; i++) { const a = A[i], b = B[i]; for (let j = 0; j < a.length; j++) if (!Object.is(a[j], b[j])) d++; } return d; };
for (const [id, name, o] of [['S126', 'PRODUCT', {}], ['S126', 'READER/TS+J', { tierState: true, jointWorlds: true, bridgeRead: 'reader' }], ['S194', 'PRODUCT', {}], ['S194', 'READER/PRODUCT', { bridgeRead: 'reader' }], ['S360', 'READER/TS+J', { tierState: true, jointWorlds: true, bridgeRead: 'reader' }]]) {
  const plan = planOf(id), base = { lambda: 0.0223606797749979, points: PTS, bequestWeight: 0.02, ...o };
  const t0 = Date.now(), off = solvePlan(E, M, plan, base), t1 = Date.now(), on = solvePlan(E, M, plan, { ...base, e3: true }), t2 = Date.now();
  const d = same(arrays(off), arrays(on)), g = on.g, want = (g.ni + g.nt - 1) * g.np * (g.gain.length - 1) * g.pcls.length * (on.m.ctx.totalYears + 1);
  ok(d === 0, `${id} ${name} at ${PTS} points: every table bit for bit the same with e3 (${arrays(off).length} arrays; copied ${on.meta.e3.copied} cells, ${(t1 - t0) / 1000} s off, ${(t2 - t1) / 1000} s on)`);
  ok(on.meta.e3.copied === want, `${id} ${name}: the copied cells are the empty-pot cells of the non-zero gain buckets (${on.meta.e3.copied} = ${want})`);
}
{ const plan = planOf('S126'), base = { lambda: 0.0223606797749979, points: PTS, bequestWeight: 0.02 };
  const d = same(arrays(solvePlan(E, M, plan, base)), arrays(solvePlan(E, M, plan, { ...base, e3: true, e3PlantedWrongTwin: true })));
  ok(typeof d === 'number' && d > 0, `planted: a copy from the wrong twin (the ISA-share neighbour) breaks identity (${d} values differ)`); }
console.log(`\nsolver-e3: ${n} passed`);
