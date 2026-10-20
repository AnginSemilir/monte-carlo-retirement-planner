/*
 * THE ADAPTIVE REFERENCE'S EXACT STEPS (`stepAll`; PLAN.md REF-STEP, PR29; the deep review after REF-B, deep-review-log.md 20 Oct
 * 02:53 UK). adaptive-corner.test.mjs's INCELL slice (reported, not bound there) read the base's largest gap inside the cliff's
 * step cell at 0.4445: the lattice read of an earlier bridge year ramps across that year's own step. With `stepAll` each bridge
 * year's threshold A*_t is found by bisection, the read is 0 below it and the first live node's value between it and that
 * node, and the year before splits its expectation at the shock that clears A*_t. On S362 under REF-STEP's AN3 settings (the
 * adaptive reference, its fix, no split, `stepAll`) at 4 points, against the reference's own rule run forward
 * (adaptive.js simulate), every world, years 1 to 3 (the bridge years before the last), b 0, 0.5 and 1, every gain node:
 *   BELOW  just under A*_t (A*_t x (1 - 1e-6)): p exactly 0, and the rule run forward never pays the year (bound)
 *   INCELL inside the step's lattice cell (A*_t x e^(cell / 2)): within its tolerance (bound; adaptive-corner's 0.4445 slice)
 *   CLIFF  A*_t x e^-0.08 and x e^+0.08: within its tolerance (bound)
 * A cell's tolerance is 4 se + 0.05, as adaptive-corner's; the gate: every base cell's gap at most half its tolerance, and the
 * plant 'stepramp' (the thresholds kept, the reads and averages as without `stepAll`) caught in INCELL at twice its tolerance
 * or more, or in BELOW by a p over 0. e3pcls is off, as in reader-copy.test.mjs: its tables are bit for bit those with it on
 * (solver-e3pcls.test.mjs, on the pinned code), and the test reads the reference, not the copies.
 *   node research/tests/adaptive-step.test.mjs [nsim=20000]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { bridgeTable } from '../../src/solver/grid.js';
import { solveCandidate } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const NSIM = Number(process.argv[2] || 20000), TOL = 0.05, LAMBDA = 0.0223606797749979, W = 0.02, STEP = 0.08;
const LATTICE = { na: 160, nb: 41, nz: 128, foot: true, stepAll: true };
const base = buildScenarios().find(s => s.id === 'S362');
if (!base) { console.error('adaptive-step: no S362 in the scenario library'); process.exit(2); }
const gaussOf = seed => { let s = seed >>> 0, spare = null; const u = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296; }; return () => { if (spare !== null) { const v = spare; spare = null; return v; } const r = Math.sqrt(-2 * Math.log(u())), a = 2 * Math.PI * u(); spare = r * Math.sin(a); return r * Math.cos(a); }; };
const plan = () => { const h = JSON.parse(JSON.stringify(base.plan)); return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } })); };
function build(label, plant = '') {
  const t0 = Date.now();
  const cand = solveCandidate(E, M, plan(), { lambda: LAMBDA, points: 4, bequestWeight: W, e3pcls: false, readerRef: 'adaptive', adaptiveLattice: { ...LATTICE, ...(plant ? { plant } : {}) } });
  const ad = cand.mix.tables[0].g.reader && cand.mix.tables[0].g.reader.adaptive;
  if (!ad || !ad.ref || !ad.lattice || !ad.lattice.stepAll) throw new Error(`${label}: the adaptive reference did not build with stepAll`);
  const B = bridgeTable(E, cand.m, cand.c, Math.min(...cand.levelOf), 2), T = cand.m.ctx.totalYears;
  const billsOf = t => { const bl = []; for (let j = t; j < Math.min(B.accessAt, T + 1); j++) bl.push(B.needY[j] - B.inY[j]); return bl; };
  console.log(`  ${label}: built in ${((Date.now() - t0) / 1000).toFixed(0)} s; bridge years ${ad.ref.bridge.join(',')}, last ${ad.ref.TL}; stepAll ${!!ad.lattice.stepAll}; nonMono ${ad.nonMono}`);
  return { ref: ad.ref, gains: Array.from(cand.mix.tables[0].g.gain), K: cand.mix.nodes.length, billsOf, nonMono: ad.nonMono };
}
// each year's A cell in log A, as adaptive.js lays the lattice (lo at max(100, 0.5 d0), hi at 3 rem + max(d0, 0), guarded: foot)
const cellOf = (R, t) => { const bl = R.billsOf(t), d0 = bl[0], rem = bl.reduce((u, v) => u + Math.max(0, v), 0), lo = Math.log(Math.max(100, 0.5 * d0)), hi0 = Math.log(3 * rem + Math.max(d0, 0)), hi = !(hi0 > lo + Math.LN2) ? lo + Math.LN2 : hi0; return (hi - lo) / 159; };
function cellsOf(R) {
  const { ref, gains, K } = R, S = { BELOW: [], INCELL: [], CLIFF: [] }, short = [];
  const pre = ref.bridge.filter(t => t >= 1 && t <= 3 && t < ref.TL);
  if (pre.length !== 3) short.push(`the bridge years ${ref.bridge.join(',')} do not hold years 1 to 3 before the last`);
  for (let k = 0; k < K; k++) for (const t of pre) for (const b of [0, 0.5, 1]) for (const gf of gains) {
    const a = ref.astarAt(t, b, gf), cell = cellOf(R, t);
    if (!(a > 0 && a < 1e11)) { short.push(`world ${k} year ${t} b ${b} gain ${gf.toFixed(3)}: no step (A* ${a})`); continue; }
    if (!(STEP >= 2 * cell)) { short.push(`year ${t}: its A cell ${cell.toFixed(4)} is more than half the step offset ${STEP}`); continue; }
    S.BELOW.push({ k, t, A: a * (1 - 1e-6), b, gf }); S.INCELL.push({ k, t, A: a * Math.exp(cell / 2), b, gf });
    S.CLIFF.push({ k, t, A: a * Math.exp(-STEP), b, gf }, { k, t, A: a * Math.exp(STEP), b, gf });
  }
  return { S, short };
}
const read = (R, c, seed, nm) => {
  const p = R.ref.readV(c.k, c.t, c.A, c.b, c.gf);
  if (!Number.isFinite(p)) return { ...c, p, s: NaN, se: 0, gap: Infinity, tol: TOL, ok: false };
  const s = R.ref.simulate(c.k, c.t, c.A, c.b, c.gf, nm === 'BELOW' ? 200 : NSIM, gaussOf(seed + 7919 * c.k + 104729 * c.t + Math.round(c.A * 7 + c.b * 13 + c.gf * 101) % 100003));
  if (nm === 'BELOW') return { ...c, p, s, se: 0, gap: Math.max(Math.abs(p), s), tol: 1e-12, ok: p === 0 && s === 0 };
  const se = Math.sqrt(Math.max(s * (1 - s), 1 / NSIM) / NSIM), gap = Math.abs(p - s), tol = 4 * se + TOL;
  return { ...c, p, s, se, gap, tol, ok: gap <= tol };
};
function run(label, R, seed) {
  const { S, short } = cellsOf(R), out = {};
  for (const [nm, cs] of Object.entries(S)) out[nm] = cs.map(c => read(R, c, seed, nm));
  const off = Object.entries(out).flatMap(([nm, rs]) => rs.filter(r => !r.ok).map(r => `${nm} world ${r.k} year ${r.t} A ${r.A.toFixed(0)} b ${r.b} gain ${r.gf.toFixed(3)}: p ${Number(r.p).toFixed(4)} s ${Number(r.s).toFixed(4)} (tol ${r.tol.toFixed(4)})`));
  console.log(`  ${label}: cells ${Object.entries(out).map(([nm, rs]) => `${nm} ${rs.length}`).join(', ')}; ${off.length} off${short.length ? `; SHORT: ${short.join('; ')}` : ''}`);
  for (const x of off.slice(0, 8)) console.log(`    off ${x}`);
  return { out, short, off };
}
const worst = rs => rs.reduce((m, r) => Math.max(m, r.gap), 0), ratio = rs => rs.reduce((m, r) => Math.max(m, r.gap / r.tol), 0);

console.log(`ADAPTIVE STEP TEST (S362 under REF-STEP's AN3 settings, e3pcls off; ${NSIM} runs a cell; a cell's tolerance 4 se + ${TOL})`);
let fails = 0;
const verdict = (ok, what) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); };
const B0 = build('base'), rb = run('base', B0, 1);
verdict(B0.nonMono === 0, `base: no non-monotone threshold (${B0.nonMono})`);
verdict(!rb.short.length && !rb.off.length, `base: every cell of every slice within its tolerance (${rb.off.length} off${rb.short.length ? `, ${rb.short.length} short` : ''})`);
for (const nm of ['INCELL', 'CLIFF']) { const r = ratio(rb.out[nm]); verdict(rb.out[nm].length > 0 && r <= 0.5, `base ${nm}: cells ${rb.out[nm].length}, the largest gap ${worst(rb.out[nm]).toFixed(4)}, ${r.toFixed(3)} of its cell's tolerance (at most one half)`); }
verdict(rb.out.BELOW.length > 0 && rb.out.BELOW.every(r => r.p === 0 && r.s === 0), `base BELOW: p exactly 0 and the rule run forward never paying just under every year's step (${rb.out.BELOW.length} cells)`);
const P0 = build('plant stepramp', 'stepramp'), rp = run('plant stepramp', P0, 3), effI = ratio(rp.out.INCELL), belowLive = rp.out.BELOW.filter(r => r.p > 0).length;
verdict(effI >= 2 || belowLive > 0, `plant stepramp caught: INCELL's largest gap ${worst(rp.out.INCELL).toFixed(4)}, ${effI.toFixed(2)} times its cell's tolerance; ${belowLive} of ${rp.out.BELOW.length} BELOW cells read over 0`);
console.log(`\nadaptive-step: ${fails ? `${fails} FAILED` : 'all passed'}`);
process.exit(fails ? 1 : 0);
