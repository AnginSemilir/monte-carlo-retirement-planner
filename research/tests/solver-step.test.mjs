/*
 * `bridgeStep: 'exact'` (PLAN.md 7z, Q; research only): THE READER'S STEP, INTEGRATED ACROSS. In a year whose next year is a
 * reader year, next year's survival read has a hard step in accessible money at that year's first bill (reader.js: acc - d0
 * < -1); the year's return is integrated by 12-point Gauss-Legendre on each side of it (solve.js stepExpect), in the
 * backward pass at the grid's nodes and in the forward chooser at the true state (scoreMoves), instead of over the
 * quadrature's few points. Revived 27 Sep for the deep review after 7x (deep-review-log.md 22:32 UK): the first attempt's
 * check C read the table's opening value, which the backward part cannot move (no node near share 0.95's opening sees the
 * step), and D failed on the test's own error (Float64Array.from(M.initialState(m)) is empty: the state vector is vecOf's).
 * What matters is the chooser's read at the true state, and that is what C now checks.
 *
 *   A. the option refuses what it cannot do: a value other than 'exact', and no bridge reader
 *   B. it changes no table from the last bridge year on (to the bit), and something before it; meta names it only when on
 *   C. THE CHOOSER AT THE TRUE STATE: at vecOf(initialState) in year 0, in every world, each move's score with the option
 *      on is within 0.003 (0.3 points of survival) of the same score averaged over 4,000 equal-probability returns on the
 *      same tables; planted: the product's five points miss it by more than that on some move (else C is vacuous)
 *   D. the chooser uses it: the moves' scores at the opening state differ on and off, on some move
 *   E. a household with no reader year (S194, no bridge) is the same to the bit on and off: every table and every score
 *   F. the 4,000-point reference integrates 1 and z^2 (a planted check on the reference itself)
 *   node research/tests/solver-step.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveMixture, scoreMoves } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { tiersFor } from '../../src/solver/fast.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * E.num(p.spending.targetSpend, 0)) } }));
// share 0.95: S126 with 95% of its wealth in the pension, the rest in its accessible pots pro rata, two years before its
// pension age (audit-s126.mjs's variant, as diag-o35.mjs builds it)
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
const p = JSON.parse(JSON.stringify(singles.find(x => x.id === 'S126').plan));
const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(0.95 * W) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * 0.05 * W) }; return a; });
{ const nmpa = E.num(p.demographics.privatePensionAge, 58), age = nmpa - 2; p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) }; }
const plan = prep(p), m = M.prepare(E, plan);
const o = { points: 8, lump: m.ctx.fullLumpSum, tiers: tiersFor(m), mix: 3, spendLevels: [1.1, 1, 0.95, 0.9, 0.8], lambda: 0.05, bridgeRead: 'reader', finalIntegral: true };
const off = solveMixture(E, M, plan, o), on = solveMixture(E, M, plan, { ...o, bridgeStep: 'exact' });
const T = off.m.ctx.totalYears, s0 = vecOf(off.m, M.initialState(off.m));
const readerYears = Array.from(off.g.reader.years).map((v, i) => (v ? i : -1)).filter(i => i >= 0);
console.log(`share 0.95: reader years ${readerYears.join(', ')}; opening state length ${s0.length}, accessible ${Math.round(s0[1] + s0[2])}`);

console.log('=========== A. REFUSALS ===========');
let e1 = null; try { solveMixture(E, M, plan, { ...o, bridgeStep: 'nodes' }); } catch (e) { e1 = e.message; }
ok('A  a value other than exact is refused', !!e1 && /only 'exact'/.test(e1), e1 || 'no error');
let e2 = null; try { solveMixture(E, M, plan, { ...o, bridgeRead: false, bridgeStep: 'exact' }); } catch (e) { e2 = e.message; }
ok('A  without the bridge reader it is refused', !!e2 && /needs the bridge reader/.test(e2), e2 || 'no error');

console.log('=========== B. ONLY THE YEARS BEFORE A READER YEAR ===========');
const last = Math.max(...readerYears);
const tabEq = (a, b, t) => a.mix.tables.every((tab, k) => ['surv', 'lsurv', 'beq', 'pol'].every(kk => { const x = tab[kk][t], y = b.mix.tables[k][kk][t]; return x.length === y.length && x.every((v, i) => v === y[i]); }));
let sameAfter = true; for (let t = last; t <= T; t++) if (!tabEq(off, on, t)) sameAfter = false;
ok('B  from the last bridge year on, every table is the same to the bit', readerYears.length > 0 && sameAfter, `years ${last} to ${T}`);
let diffBefore = false; for (let t = 0; t < last; t++) if (!tabEq(off, on, t)) diffBefore = true;
ok('B  before it, something differs (the option acts at the nodes)', diffBefore);
ok('B  meta names the option only when on', on.meta.bridgeStep === 'exact' && off.meta.bridgeStep === null);

console.log('=========== F. THE REFERENCE ===========');
// 4,000 equal-probability returns: the midpoint in u = Phi(z), PhiInv by Acklam (as diag-o35.mjs)
const PhiInv = q => { const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572], c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]; const pl = 0.02425; if (q < pl) { const r = Math.sqrt(-2 * Math.log(q)); return (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } if (q > 1 - pl) { const r = Math.sqrt(-2 * Math.log(1 - q)); return -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1); } const r = q - 0.5, r2 = r * r; return (((((a[0] * r2 + a[1]) * r2 + a[2]) * r2 + a[3]) * r2 + a[4]) * r2 + a[5]) * r / (((((b[0] * r2 + b[1]) * r2 + b[2]) * r2 + b[3]) * r2 + b[4]) * r2 + 1); };
const DN = 4000, DZ = Array.from({ length: DN }, (_, i) => PhiInv((i + 0.5) / DN)), DW = new Array(DN).fill(1 / DN);
const m0 = DW.reduce((t, w) => t + w, 0), m2 = DZ.reduce((t, z, i) => t + DW[i] * z * z, 0);
ok('F  the reference integrates 1 and z^2', Math.abs(m0 - 1) < 1e-9 && Math.abs(m2 - 1) < 2e-3, `${m0.toFixed(9)}, ${m2.toFixed(5)}`);

console.log('=========== C. THE CHOOSER AT THE TRUE STATE ===========');
// the same tables read over the 4,000 returns: the world's view with its year-0 node rates and weights replaced, the step off
const denseView = (w) => {
  const nro = w.nodeRealOfAt.slice();
  nro[0] = w.actions.map((_, ai) => { const act = w.c.acts[ai], R = act.real, V = act.volEffAt[0]; return DZ.map(z => { const x = new Float64Array(4); for (let i = 0; i < 4; i++) x[i] = Math.exp(Math.log(1 + R[i]) + V[i] * z) - 1; return x; }); });
  return { ...w, nodeRealOfAt: nro, quadWeights: DW, stepExact: false, _post: null, _grown: null, _rd: null, _sx: null, _sxR: null, _fx: null, _fxR: null };
};
const n = off.actions.length;
const scores = (w) => { const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n); scoreMoves(w, s0, 0, SC, TX, BQ, null); return SC; };
const TOL = 0.003;
let worstOn = 0, worstOff = 0, cOk = true, where = '';
for (let k = 0; k < off.worlds.length; k++) {
  const sOn = scores(on.worlds[k]), sOff = scores(off.worlds[k]), sD = scores(denseView(off.worlds[k]));
  for (let ai = 0; ai < n; ai++) {
    if (!Number.isFinite(sD[ai])) { if (Number.isFinite(sOn[ai])) cOk = false; continue; }
    const eOn = Math.abs(sOn[ai] - sD[ai]), eOff = Math.abs(sOff[ai] - sD[ai]);
    if (eOn > worstOn) { worstOn = eOn; where = `world ${k}, ${off.actions[ai].label}`; }
    if (eOff > worstOff) worstOff = eOff;
    if (eOn > TOL) cOk = false;
  }
}
ok('C  on, every move\'s score at the opening state is within 0.003 of the 4,000-point score, in every world', cOk, `worst ${worstOn.toFixed(5)} (${where})`);
ok('C  planted: the five points miss the 4,000-point score by more than 0.003 on some move', worstOff > TOL, `worst ${worstOff.toFixed(5)}`);

console.log('=========== D. THE CHOOSER USES IT ===========');
let moved = 0; for (let k = 0; k < off.worlds.length; k++) { const a = scores(off.worlds[k]), b = scores(on.worlds[k]); for (let ai = 0; ai < n; ai++) if (Number.isFinite(a[ai]) && Math.abs(a[ai] - b[ai]) > 1e-9) moved++; }
ok('D  the moves\' scores at the opening state differ on and off', moved > 0, `${moved} move-worlds moved`);

console.log('=========== E. NO READER YEAR: THE SAME TO THE BIT ===========');
const q = prep(singles.find(x => x.id === 'S194').plan), mq = M.prepare(E, q);
const oq = { ...o, lump: mq.ctx.fullLumpSum, tiers: tiersFor(mq) };
const offQ = solveMixture(E, M, q, oq), onQ = solveMixture(E, M, q, { ...oq, bridgeStep: 'exact' });
const yrsQ = offQ.g.reader ? Array.from(offQ.g.reader.years).filter(Boolean).length : 0;
let allSame = yrsQ === 0; for (let t = 0; t <= offQ.m.ctx.totalYears && allSame; t++) if (!tabEq(offQ, onQ, t)) allSame = false;
const q0 = vecOf(offQ.m, M.initialState(offQ.m)), nq = offQ.actions.length;
const scq = w => { const SC = new Float64Array(nq), TX = new Float64Array(nq), BQ = new Float64Array(nq); scoreMoves(w, q0, 0, SC, TX, BQ, null); return SC; };
const sameScores = offQ.worlds.every((w, k) => { const a = scq(w), b = scq(onQ.worlds[k]); return a.every((v, i) => Object.is(v, b[i])); });
ok('E  S194 (no reader year): every table and every opening score the same to the bit', allSame && sameScores, `reader years ${yrsQ}`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
