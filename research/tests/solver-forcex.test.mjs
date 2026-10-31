/*
 * FORCE-X'S FORCED DRAW (src/solver/fast.js step 7b'; PLAN.md's FORCE-X): `c.forceTF`, set for one year by a forward run's
 * own chooser, adds one pension draw whose tax-free part is that amount, taxed with the year's income and re-wrapped (ISA
 * first, then the GIA). Held here, at random post-access positions across the library, against the same flow unforced:
 *   A. the tax-free used rises by exactly min(forceTF, allowance left) more; the pension falls by that over the lump-sum
 *      share more; nothing is lost but the extra income tax (the pots' total falls by the tax difference); the flag is cleared
 *      (it acts once) and c.forced records the gross;
 *   B. it does nothing before access, with no allowance left, with an empty pension, or unset (the unforced flow twice is
 *      the same to the bit, and a second year with the flag cleared equals the unforced year).
 *   node research/tests/solver-forcex.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as F from '../../src/solver/fast.js';
import { buildActions } from '../../src/solver/solve.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const prep = p => E.resolveMpaa(E.normalizePlan({ ...JSON.parse(JSON.stringify(p)), config: { ...p.config, guardrails: false, lookaheadYears: 0 } }));
const actions = buildActions();
let rng = 4242; const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };

const run = (c, t, ai, s, tf) => { const x = Float64Array.from(s); c.forceTF = tf; c.forced = 0; const unmet = F.flow(c, t, ai, x); return { x, unmet, tax: c.last.taxPaid + c.last.cgtPaid, cgt: c.last.cgtPaid, drawn: c.last.drawdown, left: c.forceTF, forced: c.forced }; };

console.log('=========== A. THE FORCED DRAW AGAINST THE SAME YEAR UNFORCED ===========');
let n = 0, cgtApart = 0, worstTF = 0, worstPen = 0, worstWealth = 0, cleared = 0, recorded = 0, moved = 0;
const B = { pre: 0, preBad: 0, none: 0, noneBad: 0, empty: 0, emptyBad: 0, unset: 0, unsetBad: 0, again: 0, againBad: 0 };
for (let h = 0; h < 12; h++) {
  const sc = singles[Math.floor(h * singles.length / 12)];
  const m = M.prepare(E, prep(sc.plan)), c = F.compile(m, actions), P = m.P, T = m.ctx.totalYears;
  const spend = E.spendTargetAtAge(m.ctx, m.ctx.ageSelf0);
  for (let k = 0; k < 300; k++) {
    const t = Math.floor(rand() * (T + 1)), ai = Math.floor(rand() * actions.length);
    const pen = rand() < 0.1 ? 0 : spend * Math.exp(rand() * 5 - 1), isa = spend * Math.exp(rand() * 4 - 2), tax = spend * Math.exp(rand() * 4 - 2);
    const u = [0, 0.2, 0.45, 0.72, 0.95, 1][Math.floor(rand() * 6)];   // 0.95: a force larger than the allowance left
    const s = Float64Array.from([pen, isa, tax, 0.25, u * P.lsa, 0]);
    const tf = P.lsa * (0.005 + 0.1 * rand());
    const base = run(c, t, ai, s, 0), f = run(c, t, ai, s, tf);
    const access = c.yr.access[t] === 1, retired = c.yr.working[t] !== 1;
    // B. the four cases where the force must do nothing, and unset
    const same = (a, b) => a.x.every((v, i) => Object.is(v, b.x[i])) && Object.is(a.tax, b.tax) && Object.is(a.unmet, b.unmet);
    const u0 = run(c, t, ai, s, 0); B.unset++; if (!same(base, u0)) B.unsetBad++;
    if (!access || !retired) { B.pre++; if (!same(base, f) || f.left !== 0) B.preBad++; continue; }
    if (base.x[4] >= P.lsa - 1e-9) { B.none++; if (!same(base, f)) B.noneBad++; continue; }
    if (!(base.x[0] > 0)) { B.empty++; if (!same(base, f)) B.emptyBad++; continue; }
    // A. a live force: the allowance it can use, from the unforced year's end (the forced draw comes after the move's own draws)
    n++;
    const room = P.lsa - base.x[4], want = Math.min(tf, room), gross = Math.min(base.x[0], want / P.pclsProp), tfGot = Math.min(gross * P.pclsProp, room);
    // a year with a CGT bill: its settlement (step 7c, after the force) may draw the pension in one run and not the other, as
    // the forced draw's proceeds can pay it - counted apart from the exact allowance and pension checks
    if (base.cgt > 0 || f.cgt > 0) cgtApart++;
    else { worstTF = Math.max(worstTF, Math.abs((f.x[4] - base.x[4]) - tfGot)); worstPen = Math.max(worstPen, Math.abs((base.x[0] - f.x[0]) - gross)); }
    // the pots' total: the forced draw moves money from the pension to the ISA and GIA, less only the extra tax
    const tot = x => x[0] + x[1] + x[2];
    if (Math.abs(f.unmet - base.unmet) < 1e-6) worstWealth = Math.max(worstWealth, Math.abs((tot(base.x) - tot(f.x)) - (f.tax - base.tax)));
    if (f.left === 0) cleared++;
    if (Math.abs(f.forced - gross) < 1e-6) recorded++;
    if (f.x[4] - base.x[4] > 1) moved++;
    // the flag cleared: a second year run with it as left equals the unforced year
    const again = run(c, t, ai, s, f.left); B.again++; if (!same(base, again)) B.againBad++;
  }
}
ok(`live forces tested: ${n} (over 500)`, n > 500);
ok(`the tax-free used rises by exactly the force (within 1e-6; ${cgtApart} years with a CGT bill apart): worst ${worstTF.toExponential(2)}`, worstTF < 1e-6 && cgtApart < 0.5 * n);
ok(`the pension falls by the force over the lump-sum share (within 1e-6): worst ${worstPen.toExponential(2)}`, worstPen < 1e-6);
ok(`nothing lost but the extra tax (the pots' total, within 1e-6): worst ${worstWealth.toExponential(2)}`, worstWealth < 1e-6);
ok(`the force moved the allowance on most live years: ${moved} of ${n}`, moved > 0.9 * n);
ok(`the flag cleared after the year: ${cleared} of ${n}`, cleared === n);
ok(`c.forced records the gross: ${recorded} of ${n}`, recorded === n);
console.log('=========== B. WHERE THE FORCE MUST DO NOTHING ===========');
ok(`before access or while working: ${B.pre} positions, ${B.preBad} changed`, B.pre > 50 && B.preBad === 0);
ok(`no allowance left: ${B.none} positions, ${B.noneBad} changed`, B.none > 50 && B.noneBad === 0);
ok(`an empty pension: ${B.empty} positions, ${B.emptyBad} changed`, B.empty > 20 && B.emptyBad === 0);
ok(`unset, the flow twice the same to the bit: ${B.unset} positions, ${B.unsetBad} differ`, B.unset > 1000 && B.unsetBad === 0);
ok(`the year after, with the flag as the force left it, equals the unforced year: ${B.again} positions, ${B.againBad} differ`, B.again > 500 && B.againBad === 0);
console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
if (fail) process.exit(1);
