/*
 * F1, THE CLIFF-AWARE READ OF A RETIRED BRIDGE YEAR (PLAN.md "S126's dead corner", the F1 write-up). F1 had no test of
 * its own until v2 (24 Sep): these pin v2's three changes on planted inputs, and pin v1 and "off" where they must not move.
 *   - the bridge table on a stub: v1's need is unchanged; v2's requirement counts money arriving later in the bridge
 *   - v2's chance the money lasts: growth raises it, a short position gets a chance between nothing and a half
 *   - one real household solved small: off, v1 and v2 read the same where there is no retired bridge
 */
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solve } from '../../src/solver/solve.js';
import { bridgeTable, bridgeChanceV2 } from '../../src/solver/grid.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };

// --- the bridge table on a stub: an 8-year retired bridge, 23k a year at the floor, an inheritance of 171k in year 4
const T = 12, A = 8;
const f64 = () => new Float64Array(T + 1);
const yr = { access: new Uint8Array(T + 1), spend: f64(), frac: f64(), taxFree0: f64(), taxable0: f64(), cost: f64(), buffer: f64(),
  dep: [f64(), f64(), f64(), f64()], ded: [f64(), f64(), f64(), f64()] };
for (let t = 0; t <= T; t++) { yr.access[t] = t >= A ? 1 : 0; yr.spend[t] = 23000; yr.frac[t] = 1; yr.buffer[t] = 11500; }
yr.dep[2][4] = 171000;   // into the taxable account, the way the library's inheritances land
const c = { T, yr, P: {}, volEff: [0.1, 0.115, 0.08, 0.005], real: [0.03, 0.0372, 0.03, -0.005], cashReal: -0.005 };
const m = { ctx: { owners: [{ ids: { isa: 'i', other: 'g' } }] }, acc: { i: { balance: 76000 }, g: { balance: 19000 } } };
const Estub = { calculateUKNetIncome: x => x };
const v1 = bridgeTable(Estub, m, c, 1, 1), v2 = bridgeTable(Estub, m, c, 1, 2);
ok(v1.need[0] === 8 * 23000 && v1.need[5] === 3 * 23000, "v1: the need is the whole bridge's, inflows not counted (184k from year 0)");
ok(v1.version === undefined && v1.req === undefined, 'v1: the table carries nothing new');
ok(v2.need[0] === v1.need[0], "v2: the need itself is unchanged");
ok(v2.req[0] === 4 * 23000, 'planted: v2 needs only the four years before the inheritance arrives (92k, not 184k)');
ok(v2.req[5] === 3 * 23000, 'v2: after the inheritance, the years left are needed in full (69k)');
ok(Math.abs(v2.mu - (76000 * 0.0372 + 19000 * 0.03) / 95000) < 1e-12, "v2: the growth is the accessible investments' own, balance-weighted");
yr.dep[2][4] = 0; yr.ded[1][2] = 10000;
const v2b = bridgeTable(Estub, m, c, 1, 2);
ok(v2b.req[0] === 8 * 23000 + 10000, 'v2: a deduction from an accessible pot adds to what is needed');
// one-off costs (plan one-off costs, future gifts, regular gifts: the engine's oneOffCosts) are part of the need in both
// versions; v2 also times them against the money arriving
yr.ded[1][2] = 0; yr.dep[2][4] = 171000; yr.cost[2] = 30000;
const c1 = bridgeTable(Estub, m, c, 1, 1), c2 = bridgeTable(Estub, m, c, 1, 2);
ok(c1.need[0] === 8 * 23000 + 30000, 'planted: v1 counts a one-off cost in the bridge (214k, not 184k)');
ok(c2.req[0] === 4 * 23000 + 30000, 'planted: v2 counts a one-off cost due before the inheritance (122k, not 92k)');
yr.cost[2] = 0; yr.cost[6] = 30000;
const c3 = bridgeTable(Estub, m, c, 1, 2);
ok(c3.req[0] === 4 * 23000 && bridgeTable(Estub, m, c, 1, 1).need[0] === 8 * 23000 + 30000, 'v2: a cost due after the inheritance is met by it (92k); v1 still counts it (214k)');
yr.cost[6] = 0;

// --- v2's chance the money lasts
const base = { cash: 11500, years: 6, sigma: 0.11, mu: 0.035, cashReal: -0.005 };
const ch = (acc, req, o = {}) => { const b = { ...base, ...o }; return bridgeChanceV2(acc, req, b.cash, b.years, b.sigma, b.mu, b.cashReal); };
ok(Math.abs(ch(100000, 100000, { mu: 0, cashReal: 0 }) - 0.5) < 1e-6, 'exactly covered with no growth: a half');
ok(ch(100000, 100000) > 0.5, 'exactly covered with growth: above a half (v1 said a half whatever the growth)');
ok(ch(84000, 100000) > 0.01 && ch(84000, 100000) < 0.5, 'planted: short by 16% - a chance between nothing and a half, not the dead read');
ok(ch(300000, 100000) > 0.99, 'three times covered: all but certain');
ok(ch(100000, 0) === null && ch(100000, -5000) === null, 'the inflows cover every year: no cap');
ok(ch(0, 100000) < 1e-5, 'nothing accessible: dead');
ok(ch(11500, 10000) > 0.99 && ch(11500, 12000, { cashReal: -0.005 }) < 0.01, 'all cash: covered or not, with no spread');

// --- one real household with no retired bridge, solved small: off, v1 and v2 read the same, bit for bit
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const sc = singles.find(s => E.buildContext(E.normalizePlan(s.plan)).owners[0].retireAge >= E.buildContext(E.normalizePlan(s.plan)).nmpa);
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const mm = M.prepare(E, plan);
const run = br => solve(E, M, plan, { points: 6, lump: mm.ctx.fullLumpSum, bridgeRead: br });
const R0 = run(undefined), R1 = run(true), R2 = run(2);
const [off, r1, r2] = [R0, R1, R2].map(r => r.value(M.initialState(mm), 0).survival);
ok(off === r1 && off === r2, `no retired bridge (${sc.id}): off, v1 and v2 read the same (${off.toFixed(6)})`);
// the solve records which version it ran, so a result file can tell v1 from v2 (v1 stays true, as its files recorded it)
ok(R0.meta.bridgeRead === false && R1.meta.bridgeRead === true && R2.meta.bridgeRead === 2, 'the solve records the version: off false, v1 true, v2 2');

console.log(`\n${n} passed`);
