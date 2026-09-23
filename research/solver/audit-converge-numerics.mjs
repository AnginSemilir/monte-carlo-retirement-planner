/*
 * PHASE V: IS THE NUMERICAL MACHINERY CONVERGED?   (PLAN.md Phase V, extended 23 Sep)
 *
 *   node research/solver/audit-converge-numerics.mjs [bandIndex=32] [heldPaths=1000]
 *
 * V1   the quadrature - five Gauss-Hermite nodes, now a parameter (`quadNodes`); 5 / 9 / 15
 * V2   the TOTAL-WEALTH axis - 16 / 24 / 30 / 40 / 56 points, as a convergence sequence
 * V2s  the two SHARE axes - 6 / 9 / 12 points each; never tested before #106 showed a fault on one
 * V3   the interpolation scheme - log-odds against linear, read between coarse nodes against the
 *      refined tables, on both kinds of axis
 * CENSUS  how many cells, in every year, read through a clamped-zero corner beside a live one
 *
 * RUN ON THE OBJECTIVE THAT WILL SHIP, not the old one: resilience off, the six-level menu, raises on,
 * joint tiers, the household's own landed lambda. Single table, not the three-world mixture: the
 * question is the discretisation, which the mixture repeats identically in each world.
 *
 * TWO READINGS OF EVERY ARM. The table's own opening value (what the numerics produce) AND the
 * simulated survival of the table's policy on the same held-out paths (what a household would get).
 * #106 showed the first can be badly wrong while the second is fine, so a gate on the first alone
 * would fail a correct solver on one household's artefact.
 */
import * as E from '/home/user/vitejs-vite-kdvuf9qw/research/engine.mjs';
import * as M from '/home/user/vitejs-vite-kdvuf9qw/src/solver/model.js';
import { solve, runPolicy } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/solve.js';
import { locateVec, interp } from '/home/user/vitejs-vite-kdvuf9qw/src/solver/grid.js';
import { buildScenarios } from '/home/user/vitejs-vite-kdvuf9qw/research/policy-study/scenarios.mjs';
import { readFileSync } from 'node:fs';

const K = Number(process.argv[2] || 32), HELD = Number(process.argv[3] || 1000);
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const band = JSON.parse(readFileSync('/home/user/vitejs-vite-kdvuf9qw/research/solver/results/band-70-98-7001.json', 'utf8'));
const sc = singles[band[K].i];
const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
const m = M.prepare(E, plan);
const T = m.ctx.totalYears;
const FT = JSON.parse(readFileSync(`/home/user/vitejs-vite-kdvuf9qw/research/solver/results/flex-tiers/${sc.id}.json`, 'utf8'));
const LAMBDA = FT.solver.lambda;
const LEVELS = [1.2, 1.1, 1, 0.95, 0.9, 0.8];
const base = { lambda: LAMBDA, raiseWeight: 0.003, spendLevels: LEVELS, tiers: true, lump: m.ctx.fullLumpSum, resilienceWeight: 0 };
const held = E.pathsForSeed(7002, HELD, T);

const run = (o) => {
  const t0 = Date.now();
  const r = solve(E, M, plan, { ...base, points: 30, ...o });
  const tv = r.value(M.initialState(m), 0).survival;
  let alive = 0; for (const zs of held) if (runPolicy(r, zs).survived) alive++;
  return { r, table: 100 * tv, sim: 100 * alive / HELD, s: (Date.now() - t0) / 1000 };
};
const policyDiff = (a, b) => {
  if (a.g.size !== b.g.size) return null;
  let d = 0, n = 0;
  for (let t = 0; t < a.pol.length; t++) for (let i = 0; i < a.g.size; i++) { n++; if (a.pol[t][i] !== b.pol[t][i]) d++; }
  return 100 * d / n;
};
const f = (x, d = 2) => (x >= 0 ? '+' : '') + x.toFixed(d);
const row = (label, x, ref, pd) => console.log(`  ${label.padEnd(12)} table ${x.table.toFixed(2).padStart(6)}  sim ${x.sim.toFixed(2).padStart(6)}  |  vs ref: table ${ref ? f(x.table - ref.table) : '   -  '}  sim ${ref ? f(x.sim - ref.sim) : '   -  '}  moves differing ${pd === null || pd === undefined ? '   -   ' : pd.toFixed(3) + '%'}  ${x.s.toFixed(0)}s`);

console.log(`Phase V on ${sc.id} ${sc.name.slice(0, 40)} - ${T + 1} years, lambda ${LAMBDA}, resilience off, six levels, ${HELD} held-out paths\n`);
const b30 = run({});

console.log('=========== V1. THE QUADRATURE (30 points, 6 shares) ===========');
const q9 = run({ quadNodes: 9 }), q15 = run({ quadNodes: 15 });
row('5 nodes', b30, q15, policyDiff(b30.r, q15.r));
row('9 nodes', q9, q15, policyDiff(q9.r, q15.r));
row('15 nodes', q15, null, null);
const v1 = Math.abs(b30.sim - q15.sim) <= 0.5 && Math.abs(b30.table - q15.table) <= 0.1 && policyDiff(b30.r, q15.r) < 1;
console.log(`  GATE V1: five stand if the table is within 0.1 of fifteen, the simulation within noise (0.5), and under 1% of moves differ ... ${v1 ? 'PASS' : 'FAIL'}\n`);

console.log('=========== V2. THE TOTAL-WEALTH AXIS (6 shares) ===========');
const seq = [];
for (const p of [16, 24, 30, 40, 56]) seq.push({ p, x: p === 30 ? b30 : run({ points: p }) });
const ref56 = seq[seq.length - 1].x;
let prev = null;
for (const { p, x } of seq) { row(`${p} points`, x, ref56, null); if (prev) x.step = x.table - prev.table; prev = x; }
const steps = seq.slice(1).map(({ x }) => Math.abs(x.step));
const shrinking = steps.every((v, i) => i === 0 || v <= steps[i - 1] + 1e-9);
const v2 = shrinking && Math.abs(b30.table - ref56.table) <= 0.2 && Math.abs(b30.sim - ref56.sim) <= 0.5;
console.log(`  table steps ${steps.map(v => v.toFixed(3)).join(' / ')} - ${shrinking ? 'shrinking' : 'NOT shrinking'}`);
console.log(`  GATE V2: thirty stand if the steps shrink, 30-to-56 is within 0.2 on the table and within noise on the simulation ... ${v2 ? 'PASS' : 'FAIL'}\n`);

console.log('=========== V2s. THE SHARE AXES (30 points) ===========');
const sh9 = run({ shares: 9 }), sh12 = run({ shares: 12 });
row('6 shares', b30, sh12, null);
row('9 shares', sh9, sh12, null);
row('12 shares', sh12, null, null);
const v2s = Math.abs(b30.table - sh12.table) <= 0.2 && Math.abs(b30.sim - sh12.sim) <= 0.5;
console.log(`  GATE V2s: six shares stand if 6-to-12 is within 0.2 on the table and within noise on the simulation ... ${v2s ? 'PASS' : 'FAIL'}\n`);

console.log('=========== V3. LOG-ODDS AGAINST LINEAR, BETWEEN COARSE NODES ===========');
/* Random positions between the coarse grid's nodes, read three ways: the 30x6 table in log-odds, the
 * same table read linearly, and a refined table (log-odds) as the reference. Errors in survival points. */
let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
function v3(coarse, fine, label) {
  const g = coarse.r.g, gf = fine.r.g;
  const W0 = g.axes.W.pts[0], W1 = g.axes.W.pts[g.axes.W.pts.length - 1];
  const years = [0, 5, 10, 20, 30].filter(t => t < T);
  const acc = { lo: [], li: [], loCliff: [], liCliff: [] };
  for (const t of years) for (let k = 0; k < 2000; k++) {
    const W = Math.exp(Math.log(W0) + rnd() * (Math.log(W1) - Math.log(W0))), a = rnd(), b = rnd();
    const ig = Math.floor(rnd() * g.gain.length), ic = Math.floor(rnd() * g.pcls.length);
    const pen = a * W, rest = W - pen, isa = b * rest;
    const v = Float64Array.from([pen, isa, rest - isa, g.gain[ig], g.pcls[ic] * m.P.lsa, g.pcls[ic] > 0 ? 1 : 0, -1]);
    const loc = locateVec(g, v), locF = locateVec(gf, v);
    const ref = interp(gf, fine.r.surv[t], locF, true);
    const eLo = 100 * Math.abs(interp(g, coarse.r.surv[t], loc, true) - ref);
    const eLi = 100 * Math.abs(interp(g, coarse.r.surv[t], loc, false) - ref);
    acc.lo.push(eLo); acc.li.push(eLi);
    if (ref > 0.05 && ref < 0.95) { acc.loCliff.push(eLo); acc.liCliff.push(eLi); }
  }
  const st = (xs) => { const s = [...xs].sort((p, q) => p - q); return `mean ${(xs.reduce((p, q) => p + q, 0) / Math.max(1, xs.length)).toFixed(2)}  p95 ${s[Math.floor(0.95 * (s.length - 1))]?.toFixed(2) ?? '-'}  max ${s[s.length - 1]?.toFixed(2) ?? '-'}`; };
  console.log(`  ${label}`);
  console.log(`    all positions (${acc.lo.length})         log-odds ${st(acc.lo)}   |   linear ${st(acc.li)}`);
  console.log(`    on the cliff, 5-95% (${acc.loCliff.length})   log-odds ${st(acc.loCliff)}   |   linear ${st(acc.liCliff)}`);
  const mx = (xs) => xs.length ? Math.max(...xs) : 0;
  return mx(acc.loCliff) <= mx(acc.liCliff);
}
const v3w = v3(b30, ref56, 'reference: 56 points on total wealth');
const v3s = v3(b30, sh12, 'reference: 12 points on each share axis');
console.log(`  GATE V3: log-odds stands if its worst error on the cliff is no larger than linear's ... total axis ${v3w ? 'PASS' : 'FAIL'}, share axes ${v3s ? 'PASS' : 'FAIL'}\n`);

console.log('=========== CENSUS: DEAD CORNERS ===========');
/* A cell reading >= 50% with a corner at <= 1e-5 one step along a SHARE axis - the #106 signature. */
{
  const g = b30.r.g, S = b30.r.surv;
  const byDecade = {};
  for (let t = 0; t <= T; t++) {
    let live = 0, hit = 0;
    for (let ic = 0; ic < g.pcls.length; ic++) for (let ig = 0; ig < g.gain.length; ig++)
      for (let it = 0; it < g.nt - 1; it++) for (let ii = 0; ii < g.ni - 1; ii++) for (let ip = 0; ip < g.np - 1; ip++) {
        const v = S[t][g.index(ip, ii, it, ig, ic)]; if (v < 0.5) continue; live++;
        let dead = false;
        // share-axis steps only (d & 1 === 0 keeps total wealth fixed): a dead corner ALONG total wealth is
        // the survival cliff itself, which log-odds is meant to keep sharp; along a share axis it is #106
        for (let d = 2; d < 8 && !dead; d += 2) if (S[t][g.index(ip, ii + ((d >> 1) & 1), it + ((d >> 2) & 1), ig, ic)] <= 1e-5) dead = true;
        if (dead) hit++;
      }
    const k = `${Math.floor(t / 10) * 10}-${Math.floor(t / 10) * 10 + 9}`;
    byDecade[k] = byDecade[k] || { live: 0, hit: 0 }; byDecade[k].live += live; byDecade[k].hit += hit;
  }
  for (const [k, { live, hit }] of Object.entries(byDecade)) console.log(`  years ${k.padEnd(6)} cells reading >= 50%: ${String(live).padStart(7)}   beside a dead corner: ${String(hit).padStart(6)} (${(100 * hit / Math.max(1, live)).toFixed(2)}%)`);
}
console.log(`\nSUMMARY ${sc.id}: V1 ${v1 ? 'PASS' : 'FAIL'}  V2 ${v2 ? 'PASS' : 'FAIL'}  V2s ${v2s ? 'PASS' : 'FAIL'}  V3 ${v3w && v3s ? 'PASS' : 'FAIL'}`);
