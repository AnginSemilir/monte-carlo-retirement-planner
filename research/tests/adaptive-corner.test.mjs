/*
 * THE ADAPTIVE REFERENCE AT THE READER'S CORNERS (HO-DEP's gate: items/HO-DEP.md; the deep review after FOOT-S366, deep-review-log.md
 * 18 Oct 09:43 UK, its design consult of 11:27 UK and its design reviews of this test's drafts, 11:52, 12:01 and 12:04 UK; RULES.md
 * section 4
 * row 14: design-reviewed before it counts). The faults it guards: F1, the fix's own values (the A = 0 node, the read below the
 * lattice's foot, the top's move in the inflow year, and what they feed back into the year before); F2, a NaN or under-floor top
 * (O178).
 * The reference's chance p (adaptive.js readV) against its own rule run forward from the same cell (adaptive.js simulate: the
 * nearest lattice cell's joint move each year, the flow, the world's own returns at fresh draws), on S362 under HO-DEP's K1F
 * settings (the RS split, the fix) at 4 points (the lattice does not depend on the wealth points). A cell's tolerance is
 * 4 se + 0.05 (se the simulation's binomial error on NSIM runs; 0.05 a materiality allowance where p is smooth, set before the
 * first run); p must be finite. THE SLICES, every cell required (a slice short of its cells refuses):
 *   A0     bridge years 1 to 3 at no accessible money, every world, b 0 and 1 (the state does not depend on b there)
 *   CLIFF  each of years 1 to 3's step in p found by bisection (the least accessible money where p passes 0.001), read at
 *          A* e^-0.08 and A* e^+0.08, outside the lattice's smear (each year's A cell, (hi - lo) / 159 in log A from the
 *          reference's own bills, asserted at most half of 0.08; the gap inside the step cell, at A* e^(cell / 2), reported, not
 *          bound), every world, b 0, 0.5 and 1, all three gain nodes
 *   SMOOTH (reported, not bound: year 3's smeared step carries an honest error into year 2's crossings, and no plant is read
 *          there; the design review of 12:01 UK) years 1 and 2 at the crossings of p 0.1, 0.5 and 0.9 below the year's top p,
 *          found by bisection, every world, b 0.5, the middle gain node
 *   Y4     bridge year 4 (S362's inflow year) at A 0, 50, 500, 5,000 and either side of the unfixed top (0.9 and 1.1 times
 *          3 rem + d0, the top's own move), every world, b 0, 0.5 and 1, all three gain nodes
 * THE GATE'S PRINTED FORM, per bound slice (A0, CLIFF, Y4): its cells, the base's largest clean gap against its cell's own
 * tolerance, and each plant's effect inside its own slice; it passes when every base cell's gap is at most half its own
 * tolerance, and each plant's largest gap in its slice is at least twice that cell's tolerance (a non-finite p counts as caught;
 * simulate is not run where p is non-finite).
 * Fixtures and plants:
 *   base         S362, the fix on: every cell passes
 *   top          S362 with its year-4 inflow raised to 200,000, the fix on; shown first to reach O178's case (year 4's bill below
 *                zero and 3 rem + d0 under the lattice's floor, the bridge years and the inflow year unchanged): every cell passes,
 *                p finite everywhere
 *   plant foot   the reference's own plant 'foot' (an A = 0 node of 0 valued as sure to pay): caught in A0
 *   plant drift  the reference's own plant 'drift' (worlds 0 and 2 grown at the centre world's rates in the backward step, while
 *                simulate grows each at its own): caught in CLIFF or Y4, world 0 or 2
 *   plant top    the top fixture with the fix off: caught in Y4 at A 500 or more by p alone (a non-finite p; no simulate in this
 *                run), or its build refused with a message naming the top, NaN or the lattice as words
 * WHAT IT CANNOT SEE (the design review, 11:52 UK): faults p and simulate share - setState's fixed context (no pension, the
 * sheltered cash it assumes), the flow and growth code (O165's question: p against the engine), the candidate's runs, and a
 * wrong move choice; and the reader's copy and split rules (O179-SECOND lives there, read by HO-DEP's reported GB by corner).
 *   node research/tests/adaptive-corner.test.mjs [nsim=20000]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { bridgeTable } from '../../src/solver/grid.js';
import { solveCandidate } from '../solver/candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const NSIM = Number(process.argv[2] || 20000), TOL = 0.05, LAMBDA = 0.0223606797749979, W = 0.02, STEP = 0.08;
const LATTICE = { na: 160, nb: 41, nz: 128 };
const base = buildScenarios().find(s => s.id === 'S362');
if (!base) { console.error('adaptive-corner: no S362 in the scenario library'); process.exit(2); }
const gaussOf = seed => { let s = seed >>> 0, spare = null; const u = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296; }; return () => { if (spare !== null) { const x = spare; spare = null; return x; } const r = Math.sqrt(-2 * Math.log(u())), a = 2 * Math.PI * u(); spare = r * Math.sin(a); return r * Math.cos(a); }; };
const planOf = inflow => {
  const h = JSON.parse(JSON.stringify(base.plan));
  if (inflow !== undefined) { if (!(h.oneOffContributions && h.oneOffContributions.length === 1)) throw new Error('S362 no longer has one inflow'); h.oneOffContributions[0].amount = inflow; }
  return E.resolveMpaa(E.normalizePlan({ ...h, config: { ...h.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.spending, floorSpend: Math.round(0.8 * E.num(h.spending.targetSpend, 0)) } }));
};
function build(label, { inflow, foot = true, plant = '' }) {
  const t0 = Date.now();
  const cand = solveCandidate(E, M, planOf(inflow), { lambda: LAMBDA, points: 4, bequestWeight: W, readerRef: 'adaptive', readerSplit: 'rs', adaptiveLattice: { ...LATTICE, ...(foot ? { foot: true } : {}), ...(plant ? { plant } : {}) } });
  const ad = cand.mix.tables[0].g.reader && cand.mix.tables[0].g.reader.adaptive;
  if (!ad || !ad.ref) throw new Error(`${label}: the adaptive reference did not build`);
  // the reference's own bills (solve.js adaptiveFor's billsOf over the same bridge table)
  const B = bridgeTable(E, cand.m, cand.c, Math.min(...cand.levelOf), 2), T = cand.m.ctx.totalYears;
  const billsOf = t => { const bl = []; for (let j = t; j < Math.min(B.accessAt, T + 1); j++) bl.push(B.needY[j] - B.inY[j]); return bl; };
  const gains = Array.from(cand.mix.tables[0].g.gain), ref = ad.ref;
  console.log(`  ${label}: built in ${((Date.now() - t0) / 1000).toFixed(0)} s; bridge years ${ref.bridge.join(',')}, last ${ref.TL}; fix ${!!(ad.lattice && ad.lattice.foot)}; live A = 0 nodes ${ref.footLive ?? -1}; gain nodes ${gains.map(x => x.toFixed(3)).join(',')}; year 4's bills ${billsOf(4).map(x => Math.round(x)).join(',')}`);
  return { ref, gains, K: cand.mix.nodes.length, billsOf };
}
// each year's A cell in log A, as adaptive.js lays the lattice (lo at max(100, 0.5 d0), hi at 3 rem + max(d0, 0), guarded)
const cellOf = (R, t) => { const bl = R.billsOf(t), d0 = bl[0], rem = bl.reduce((u, v) => u + Math.max(0, v), 0), lo = Math.log(Math.max(100, 0.5 * d0)), hi0 = Math.log(3 * rem + Math.max(d0, 0)), hi = !(hi0 > lo + Math.LN2) ? lo + Math.LN2 : hi0; return (hi - lo) / (LATTICE.na - 1); };
const oldTop = R => { const bl = R.billsOf(4), d0 = bl[0], rem = bl.reduce((u, v) => u + Math.max(0, v), 0); return { d0, rem, top: 3 * rem + d0, floor: Math.max(100, 0.5 * d0) }; };
const bisect = (f, lo, hi, n = 60) => { for (let i = 0; i < n; i++) { const mid = Math.sqrt(lo * hi); if (f(mid)) hi = mid; else lo = mid; } return hi; };
// the cells, each slice required in full
function cellsOf(R) {
  const { ref, gains, K } = R, mid = gains[Math.floor(gains.length / 2)], S = { A0: [], CLIFF: [], SMOOTH: [], Y4: [], INCELL: [] }, short = [];
  const pre = ref.bridge.filter(t => t >= 1 && t <= 3 && t < ref.TL);
  if (pre.length !== 3 || !ref.bridge.includes(4)) short.push(`the bridge years ${ref.bridge.join(',')} do not hold years 1 to 4`);
  for (let k = 0; k < K; k++) {
    for (const t of pre) {
      for (const b of [0, 1]) S.A0.push({ k, t, A: 0, b, gf: mid });
      for (const b of [0, 0.5, 1]) for (const gf of gains) {
        const p = A => ref.readV(k, t, A, b, gf);
        if (!(p(1e7) > 0.001)) { short.push(`world ${k} year ${t} b ${b} gain ${gf.toFixed(3)}: p never passes 0.001`); continue; }
        const As = bisect(A => p(A) > 0.001, 1, 1e7), cell = cellOf(R, t);
        if (!(STEP >= 2 * cell)) { short.push(`year ${t}: its A cell ${cell.toFixed(4)} is more than half the step offset ${STEP}`); continue; }
        S.CLIFF.push({ k, t, A: As * Math.exp(-STEP), b, gf }, { k, t, A: As * Math.exp(STEP), b, gf }); S.INCELL.push({ k, t, A: As * Math.exp(cell / 2), b, gf });
      }
      if (t <= 2) { const p = A => ref.readV(k, t, A, 0.5, mid), top = p(1e7), qs = [0.1, 0.5, 0.9].filter(q => q < top - 0.01); for (const q of qs) S.SMOOTH.push({ k, t, A: bisect(A => p(A) >= q, 1, 1e7), b: 0.5, gf: mid }); }
    }
    const ot = oldTop(R);
    for (const A of [0, 50, 500, 5000, ...(ot.top > 0 ? [0.9 * ot.top, 1.1 * ot.top] : [])]) for (const b of [0, 0.5, 1]) for (const gf of gains) S.Y4.push({ k, t: 4, A, b, gf });
  }
  return { S, short };
}
const read = (R, c, seed) => {
  const p = R.ref.readV(c.k, c.t, c.A, c.b, c.gf);
  if (!Number.isFinite(p)) return { ...c, p, s: NaN, se: 0, gap: Infinity, tol: 4 * Math.sqrt(1 / NSIM / NSIM) + TOL, ok: false };
  const s = R.ref.simulate(c.k, c.t, c.A, c.b, c.gf, NSIM, gaussOf(seed + 7919 * c.k + 104729 * c.t + Math.round(c.A * 7 + c.b * 13 + c.gf * 101) % 100003));
  const se = Math.sqrt(Math.max(s * (1 - s), 1 / NSIM) / NSIM), gap = Number.isFinite(p) ? Math.abs(p - s) : Infinity, tol = 4 * se + TOL;
  return { ...c, p, s, se, gap, tol, ok: Number.isFinite(p) && gap <= tol };
};
function run(label, R, seed) {
  const { S, short } = cellsOf(R), out = {};
  for (const [nm, cs] of Object.entries(S)) out[nm] = cs.map(c => read(R, c, seed));
  const off = Object.entries(out).filter(([nm]) => BOUND.includes(nm)).flatMap(([nm, rs]) => rs.filter(r => !r.ok).map(r => `${nm} world ${r.k} year ${r.t} A ${r.A.toFixed(0)} b ${r.b} gain ${r.gf.toFixed(3)}: p ${Number.isFinite(r.p) ? r.p.toFixed(4) : r.p} sim ${r.s.toFixed(4)} gap ${Number.isFinite(r.gap) ? r.gap.toFixed(4) : 'non-finite'} over ${r.tol.toFixed(4)}`));
  console.log(`  ${label}: cells ${Object.entries(out).map(([nm, rs]) => `${nm} ${rs.length}`).join(', ')}; ${off.length} off${short.length ? `; SHORT: ${short.join('; ')}` : ''}`);
  for (const x of off.slice(0, 12)) console.log(`    off ${x}`);
  return { out, short, off };
}
const BOUND = ['A0', 'CLIFF', 'Y4'];
const worst = rs => rs.reduce((m, r) => Math.max(m, r.gap), 0), ratio = rs => rs.reduce((m, r) => Math.max(m, r.gap / r.tol), 0);

console.log(`ADAPTIVE CORNER TEST (S362 under HO-DEP's K1F settings; ${NSIM} runs a cell; a cell's tolerance 4 se + ${TOL})`);
let fails = 0;
const verdict = (ok, what) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); };
const B0 = build('base', {}), rb = run('base', B0, 1);
verdict(!rb.short.length && !rb.off.length, `base: every cell of every bound slice within its tolerance (${rb.off.length} off${rb.short.length ? `, ${rb.short.length} short` : ''})`);
const T0 = build('top', { inflow: 200000 }), ot = oldTop(T0), otb = oldTop(B0);
verdict(ot.d0 < 0 && !(Math.log(ot.top) > Math.log(ot.floor)) && T0.ref.bridge.join(',') === B0.ref.bridge.join(',') && otb.d0 < 0 && [1, 2, 3].every(t => T0.billsOf(t)[0] > 0),
  `top fixture reaches O178's case: year 4's bill ${Math.round(ot.d0)} below zero, 3 rem + d0 = ${Math.round(ot.top)} under the floor ${Math.round(ot.floor)}; the bridge years ${T0.ref.bridge.join(',')} as the base's; year 4 the only inflow year among 1 to 4`);
const rt = run('top', T0, 2);
verdict(!rt.short.length && !rt.off.length, `top: every cell within its tolerance and p finite everywhere, the top guarded (${rt.off.length} off)`);
// the plants, each caught inside its own slice
const rf = run('plant foot', build('plant foot', { plant: 'foot' }), 3), effF = ratio(rf.out.A0);
verdict(effF >= 2, `plant foot caught in A0: its largest gap there ${worst(rf.out.A0).toFixed(4)}, ${effF.toFixed(2)} times its cell's tolerance`);
const rd = run('plant drift', build('plant drift', { plant: 'drift' }), 4), inD = [...rd.out.CLIFF, ...rd.out.Y4].filter(r => r.k !== 1), effD = ratio(inD);
verdict(effD >= 2, `plant drift caught in CLIFF or Y4, worlds 0 and 2: its largest gap there ${worst(inD).toFixed(4)}, ${effD.toFixed(2)} times its cell's tolerance`);
let topCaught = false, topWhat = '', RT = null;
try { RT = build('plant top', { inflow: 200000, foot: false }); } catch (e) { topCaught = /\btop\b|\bNaN\b|\blattice\b/i.test(e.message); topWhat = `the build refused: ${e.message.split('\n')[0]}`; }
// judged by p alone at its slice (no simulate: with the fix off, readV returns 0 at A = 0 before the NaN lattice, and simulate's
// nearest cell there indexes it; the design review of 12:04 UK)
if (RT) { const above = cellsOf(RT).S.Y4.filter(c => c.A >= 500), nonF = above.filter(c => !Number.isFinite(RT.ref.readV(c.k, c.t, c.A, c.b, c.gf))); topCaught = nonF.length > 0; topWhat = `${nonF.length} of ${above.length} year-4 cells at A 500 or more with a non-finite p`; }
verdict(topCaught, `plant top caught in Y4 at A 500 or more: ${topWhat}`);
// THE GATE'S PRINTED FORM: per slice, the base's largest clean gap, the tolerance, the plants' effects in their slices
console.log('\nTHE GATE, by bound slice (the base\'s largest gap as a share of its own cell\'s tolerance; at most one half):');
for (const nm of BOUND) { const r = ratio(rb.out[nm]); console.log(`  ${nm}: cells ${rb.out[nm].length}, the base's largest gap ${worst(rb.out[nm]).toFixed(4)}, at most ${r.toFixed(3)} of its cell's tolerance`); verdict(r <= 0.5, `${nm}: every base cell's gap at most half its own tolerance`); }
console.log(`  SMOOTH (reported, not bound): cells ${rb.out.SMOOTH.length}, the base's largest gap ${worst(rb.out.SMOOTH).toFixed(4)}, at most ${ratio(rb.out.SMOOTH).toFixed(3)} of its cell's tolerance`);
console.log(`  INCELL (reported, not bound): the base's largest gap inside the cliff's step cell ${worst(rb.out.INCELL).toFixed(4)} over ${rb.out.INCELL.length} cells`);
console.log(`  plants: foot ${effF.toFixed(2)} times its cell's tolerance in A0; drift ${effD.toFixed(2)} times in CLIFF and Y4, worlds 0 and 2; top ${topWhat}`);
console.log(`\nadaptive-corner: ${fails ? `${fails} FAILED` : 'all passed'}`);
process.exit(fails ? 1 : 0);
