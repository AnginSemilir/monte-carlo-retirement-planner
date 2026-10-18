/*
 * THE ADAPTIVE REFERENCE AT THE READER'S CORNERS (HO-DEP's gate: items/HO-DEP.md; the deep review after FOOT-S366, deep-review-log.md
 * 18 Oct 09:43 UK, and its design consult of 18 Oct 11:27 UK; RULES.md section 4 row 14: design-reviewed before it counts).
 * The reference's chance p (adaptive.js readV) against its own rule run forward from the same cell (adaptive.js simulate, the
 * nearest lattice cell's joint move each year at fresh draws of the world's own returns), on S362 under HO-DEP's K1F settings
 * (the RS split, the fix), at the cells the deep review named: in every world, bridge years 1 to 3 at no accessible money and at
 * the low-money cliff (the accessible money where p first passes 0.1, 0.5 and 0.9 along a log grid, at b 0.5 and the middle
 * gain node), and bridge year 4 (S362's inflow year) at no accessible money and just above it. A cell passes when
 * |p - sim| <= 4 se + 0.05 (se the simulation's binomial error on NSIM runs; 0.05 the lattice's own interpolation allowance,
 * set before the first run); p must be finite.
 * Fixtures and plants (each planted run must FAIL at one cell at least, or the test fails):
 *   base     S362, the fix on: every cell passes
 *   top      S362 with its year-4 inflow raised to 200,000 (past its year's bill plus three times the later bills: O178's case),
 *            the fix on (its top guarded): every cell passes and p is finite everywhere
 *   plant foot   the reference's own plant 'foot' (an A = 0 node of 0 valued as sure to pay): must fail (years 1 to 3 at A = 0)
 *   plant top    the top fixture with the fix off (the top at log(3 rem + d0), NaN or under the floor): must fail
 *   node research/tests/adaptive-corner.test.mjs [nsim=20000]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCandidate } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const NSIM = Number(process.argv[2] || 20000), TOL = 0.05, LAMBDA = 0.0223606797749979, W = 0.02;
const LATTICE = { na: 160, nb: 41, nz: 128 };
const base = buildScenarios().find(s => s.id === 'S362');
if (!base) { console.error('adaptive-corner: no S362 in the scenario library'); process.exit(2); }
// mulberry32 and Box-Muller: the simulation's own fresh draws, seeded
const gaussOf = seed => { let s = seed >>> 0, spare = null; const u = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296; }; return () => { if (spare !== null) { const x = spare; spare = null; return x; } const r = Math.sqrt(-2 * Math.log(u())), a = 2 * Math.PI * u(); spare = r * Math.sin(a); return r * Math.cos(a); }; };
const planOf = (inflow) => {
  const h = JSON.parse(JSON.stringify(base.plan));
  if (inflow !== undefined) { if (!(h.oneOffContributions && h.oneOffContributions.length === 1)) throw new Error('S362 no longer has one inflow'); h.oneOffContributions[0].amount = inflow; }
  return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } }));
};
function refOf(label, { inflow, foot = true, plant = '' }) {
  const t0 = Date.now();
  const cand = solveCandidate(E, M, planOf(inflow), { lambda: LAMBDA, points: 4, bequestWeight: W, readerRef: 'adaptive', readerSplit: 'rs', adaptiveLattice: { ...LATTICE, ...(foot ? { foot: true } : {}), ...(plant ? { plant } : {}) } });
  const ad = cand.mix.tables[0].g.reader && cand.mix.tables[0].g.reader.adaptive;
  if (!ad || !ad.ref) throw new Error(`${label}: the adaptive reference did not build`);
  const gains = Array.from(cand.mix.tables[0].g.gain);
  console.log(`  ${label}: built in ${((Date.now() - t0) / 1000).toFixed(0)} s; bridge years ${ad.ref.bridge.join(',')}, last ${ad.ref.TL}; fix ${!!(ad.lattice && ad.lattice.foot)}; live A = 0 nodes ${ad.ref.footLive ?? -1}; gain nodes ${gains.map(x => x.toFixed(3)).join(',')}`);
  return { ref: ad.ref, gains, K: cand.mix.nodes.length };
}
// the cells: worlds by bridge year; years before the inflow at A = 0 and at the cliff, the inflow year at A = 0 and A = 50
function cells({ ref, gains, K }) {
  const out = [], gf = gains[Math.floor(gains.length / 2)], b = 0.5;
  for (let k = 0; k < K; k++) for (const t of ref.bridge.filter(x => x < ref.TL && x <= 4)) {
    out.push({ k, t, A: 0, b, gf, why: 'no accessible money' });
    if (t === 4) { out.push({ k, t, A: 50, b, gf, why: 'just above no money' }); continue; }
    const grid = Array.from({ length: 121 }, (_, i) => 100 * Math.pow(10, i * 4 / 120));
    for (const q of [0.1, 0.5, 0.9]) { const A = grid.find(a => ref.readV(k, t, a, b, gf) >= q); if (A !== undefined) out.push({ k, t, A, b, gf, why: `the cliff at p ${q}` }); }
  }
  return out;
}
function check(label, R, seed) {
  let bad = 0, worst = 0;
  for (const c of cells(R)) {
    const p = R.ref.readV(c.k, c.t, c.A, c.b, c.gf), s = R.ref.simulate(c.k, c.t, c.A, c.b, c.gf, NSIM, gaussOf(seed + 1000 * c.k + 10 * c.t + Math.round(c.A) % 997)), se = Math.sqrt(Math.max(s * (1 - s), 1 / NSIM) / NSIM);
    const gap = Math.abs(p - s), ok = Number.isFinite(p) && gap <= 4 * se + TOL;
    if (Number.isFinite(gap)) worst = Math.max(worst, gap);
    if (!ok) bad++;
    console.log(`    ${ok ? 'ok  ' : 'OFF '} ${label} world ${c.k} year ${c.t} A ${c.A.toFixed(0)} (${c.why}): p ${Number.isFinite(p) ? p.toFixed(4) : p} sim ${s.toFixed(4)} (se ${se.toFixed(4)}) gap ${Number.isFinite(gap) ? gap.toFixed(4) : 'NaN'}`);
  }
  return { bad, worst };
}

console.log(`ADAPTIVE CORNER TEST (S362 under HO-DEP's K1F settings; ${NSIM} runs a cell; a cell passes at |p - sim| <= 4 se + ${TOL})`);
let fails = 0;
const want = (label, r, pass) => { const ok = pass ? r.bad === 0 : r.bad > 0; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${r.bad} cells off, the largest gap ${r.worst.toFixed(4)}${pass ? '' : ' (a planted fault: it must show)'}`); };
want('base: S362 with the fix', check('base', refOf('base', {}), 1), true);
want('top: S362 with its inflow at 200,000, the fix on (O178 guarded)', check('top', refOf('top', { inflow: 200000 }), 2), true);
want('plant foot: an A = 0 node of 0 valued as sure to pay', check('plant-foot', refOf('plant foot', { plant: 'foot' }), 3), false);
let topOff = null; try { topOff = refOf('plant top', { inflow: 200000, foot: false }); } catch (e) { console.log(`  plant top: the reference did not build (${e.message.split('\n')[0]})`); }
want('plant top: the top fixture with the fix off (O178 unguarded)', topOff ? check('plant-top', topOff, 4) : { bad: 1, worst: NaN }, false);
console.log(`\nadaptive-corner: ${fails ? `${fails} FAILED` : '4 passed'}`);
process.exit(fails ? 1 : 0);
