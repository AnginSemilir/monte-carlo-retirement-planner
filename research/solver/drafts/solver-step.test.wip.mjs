/*
 * WORK IN PROGRESS, PARKED 27 Sep (not run by any suite): the test for the first attempt at Q's fix (drafts/q-step-exact.patch,
 * bridgeStep 'exact': the year's return split at the reader's step in next year's accessible money, at the reader's bill,
 * the menu's lowest spend level's floor). It ran 6 passed, 2 failed: D on the test's own error (M.initialState is not the
 * state vector: vecOf is); C - the opening survival not moved toward a 41-point table - UNEXPLAINED, NOT CHECKED (PLAN.md O35
 * lists the candidates). An earlier header here said the reader's step is not the year-1 edge; that rested on a probe solved at
 * spend level 1 alone (bill 29,000) and is withdrawn (the review of 27 Sep 21:45 UK). Parked until O35's diagnostic is read.
 */
/*
 * `bridgeStep: 'exact'` (PLAN.md 7z, Q; research only): THE READER'S STEP, INTEGRATED ACROSS. In a year whose next year is a
 * reader year, the year's return is integrated by 12-point Gauss-Legendre on each side of the step in next year's accessible
 * money (solve.js stepExpect), instead of over the quadrature's few points.
 *
 *   A. the option refuses what it cannot do: a value other than 'exact', and no bridge reader
 *   B. it changes nothing where no reader year follows: every table from the year after the last bridge year on is the same
 *      to the bit, on and off; and it changes something before (else B would be vacuous)
 *   C. it moves the 5-point table toward a dense-point one (41 points, off) at the opening state, on share 0.95 (S126 with
 *      95% of its wealth in the pension: 7w's case) - in every world; planted: the 5-point table off is further from it
 *   D. the forward chooser uses it: the moves' scores at the opening state differ on and off, and meta names the option
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveMixture, scoreMoves } from '../../src/solver/solve.js';
import { tiersFor } from '../../src/solver/fast.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let passed = 0, failed = 0;
const ok = (name, cond, note = '') => { if (cond) { passed++; console.log(`PASS  ${name}${note ? '  -- ' + note : ''}`); } else { failed++; console.log(`FAIL  ${name}${note ? '  -- ' + note : ''}`); } };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = (p) => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
// share 0.95: S126 with 95% of its wealth in the pension, the rest in its accessible pots pro rata (audit-s126.mjs variant)
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
const p = JSON.parse(JSON.stringify(singles.find(x => x.id === 'S126').plan));
const W = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0), liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
p.accounts = p.accounts.map(a => { const b = E.num(a.balance, 0); if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(0.95 * W) }; if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * 0.05 * W) }; return a; });
const plan = prep(p), m = M.prepare(E, plan);
const o = { points: 8, lump: m.ctx.fullLumpSum, tiers: tiersFor(m), mix: 3, spendLevels: [1, 0.9, 0.8], lambda: 0.05, bridgeRead: 'reader', finalIntegral: true };
const off = solveMixture(E, M, plan, o), on = solveMixture(E, M, plan, { ...o, bridgeStep: 'exact' });
const T = off.m.ctx.totalYears, s0 = M.initialState(off.m);
const readerYears = Array.from(off.g.reader.years).map((v, i) => (v ? i : -1)).filter(i => i >= 0);
console.log(`share 0.95: reader years ${readerYears.join(', ')}; the step is integrated across in the years before them`);

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
ok('B  before it, something differs (the option acts)', diffBefore);
ok('B  meta names the option only when on', on.meta.bridgeStep === 'exact' && off.meta.bridgeStep === null);

console.log('=========== C. TOWARD THE DENSE-POINT TABLE ===========');
const dense = solveMixture(E, M, plan, { ...o, quadNodes: 41 });
const sv = (r, k) => r.worlds[k].value(s0, 0).survival;
const K = off.worlds.length;
const dOn = Array.from({ length: K }, (_, k) => Math.abs(sv(on, k) - sv(dense, k))), dOff = Array.from({ length: K }, (_, k) => Math.abs(sv(off, k) - sv(dense, k)));
const fmt = xs => xs.map(x => (100 * x).toFixed(3)).join('/');
ok('C  on, the 5-point opening survival is no further from 41 points than off is, in every world, and nearer in one',
  dOn.every((x, k) => x <= dOff[k] + 1e-9) && dOn.some((x, k) => x < dOff[k] - 1e-6), `|on - 41| ${fmt(dOn)} against |off - 41| ${fmt(dOff)} points`);
ok('C  planted: read the other way round (off as on), the check fails', !(dOff.every((x, k) => x <= dOn[k] + 1e-9) && dOff.some((x, k) => x < dOn[k] - 1e-6)));

console.log('=========== D. THE FORWARD CHOOSER ===========');
const n = off.actions.length;
const sc = r => { const SC = new Float64Array(n), TX = new Float64Array(n), BQ = new Float64Array(n); scoreMoves(r.worlds[1], Float64Array.from(s0), 0, SC, TX, BQ, null); return SC; };
const a = sc(off), b = sc(on);
ok('D  the moves\' scores at the opening state differ on and off (the chooser reads through the step too)', a.some((v, i) => Number.isFinite(v) && Math.abs(v - b[i]) > 1e-9));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
