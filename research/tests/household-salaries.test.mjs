/*
 * COUPLES-ANY.md B AND C: A COUPLE WHOSE TWO SALARIES GROW AT DIFFERENT RATES, AND A COUPLE NEITHER OF WHOM RETIRES WITHIN
 * THE PLAN, ON THE HOUSEHOLD ROUTE. The household plan's salary
 * becomes a dated schedule (src/solver/household.js householdPlanFor, the shape 'salaries'), the two people's salaries added
 * year by year, each at its own growth, in every plan year before the first retirement and nought after; the engine's
 * salaryAtYear reads it (src/App.jsx, the owner's salaryByYear, which normalizePlan keeps), and the forward run
 * (src/solver/fast.js compile) and the exact model ask the engine for it. Off in code: nothing in the app names the shape.
 * On the library's couples, both paid, their salaries' growths planted apart:
 *   1. the schedule: the household plan's salary in each plan year, as its engine reads it, is the couple's two salaries
 *      added before the first retirement, to a penny, and nought from it; and its relevant earnings likewise;
 *   2. in step: the forward run's taxable pay in each working year (compile's yr.pay) is the engine's (its row's
 *      taxablePaySelf, the plan's own rules), to a penny;
 *   3. identity: on every library couple as entered and on its mirror, the household plan built with the shape named is the
 *      one built without it, byte for byte (the growths alike, or one person unpaid, no schedule); a plan without a
 *      schedule reads its salary as before (salaryAtYear against its own formula, over every owner of every library plan);
 *   4. nobody retiring (C, the shape 'noretire'): on the library's couples planted so that neither retires within the plan,
 *      both paid, the household plan works to the plan's end: its retirement past the plan's last year, its salary the two
 *      added and its contributions to the pension, the ISA and the taxable account the couple's two added in every plan
 *      year, to a penny, with no take-home income and no later retiree's deposit; and the single solver solves one such
 *      household plan (light settings), the engine running it on 20 paths.
 * Plants (HOUSEHOLD_SALARIES_PLANT; --planted): 'salsched1' (the schedule the first person's salary alone) fails checks 1
 * and 4 (whose couples' growths are set apart too);
 * 'nosched' (the forward run reading the salary and its growth, not the schedule) fails check 2; 'noretireend' (the
 * household's retirement in the plan's last year) fails check 4.
 *   node research/tests/household-salaries.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { compile, SALARY } from '../../src/solver/fast.js';
import { buildActions } from '../../src/solver/solve.js';
import { householdPlanFor, HOUSE, TAKE_SHAPES, SALARY_SHAPES } from '../../src/solver/household.js';
import { householdPlan } from '../../src/solverCouple.js';
import { solveForApp } from '../../src/solverApp.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PLANTS = { salsched1: ['1', '4'], nosched: ['2'], noretireend: ['4'] };
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of Object.entries(PLANTS)) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, HOUSEHOLD_SALARIES_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  console.log(bad ? `PLANTED: ${bad} plant(s) not failing exactly their checks` : 'PLANTED: EACH PLANT FAILS EXACTLY ITS OWN CHECKS');
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.HOUSEHOLD_SALARIES_PLANT || '';
if (PLANT === 'nosched') SALARY.plant = PLANT; else HOUSE.plant = PLANT;

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const PENNY = 0.01, TAKES = [...TAKE_SHAPES, ...SALARY_SHAPES], FORM = 'pensionsPA';
const library = buildScenarios(), couples = library.filter(s => s.plan.demographics.planningMode === 'couple');
const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const built = (p, opts) => { try { return householdPlanFor(E, p, opts); } catch (e) { if (/^householdPlanFor: /.test(e.message)) return null; throw e; } };
/* both paid, the growths set apart; a couple that already pays both keeps its salaries, the others are given the library's
   own of the first person */
const GROWTHS = [[2, 0], [0, 3], [-1, 2], [1.5, -0.5]];
const apart = (plan, i) => {
  const p = structuredClone(plan), d = p.demographics, [gs, gp] = GROWTHS[i % GROWTHS.length];
  const base = E.num(d.salarySelf, 0) > 0 ? E.num(d.salarySelf, 0) : 40000;
  d.salarySelf = base; d.salaryPart = E.num(d.salaryPart, 0) > 0 ? E.num(d.salaryPart, 0) : Math.round(base * 0.8);
  d.salaryGrowthSelf = gs; d.salaryGrowthPart = gp;
  return p;
};

// ---- 1 and 2 ----
const c1 = { plans: 0, years: 0, worst: 0, worstAt: '', earnWorst: 0, after: 0, refused: [] }, c2 = { plans: 0, years: 0, worst: 0, worstAt: '' };
const ACTIONS = buildActions({});
for (const [ci, sc] of couples.entries()) {
  if (ci % 3) continue;   // every third library couple
  const p = householdPlan(E, apart(sc.plan, ci)), hp = built(p, { scale: FORM, takeShapes: TAKES });
  if (!hp) { c1.refused.push(sc.id); continue; }
  const cc = ctxOf(p), hc = ctxOf(hp), ho = hc.owners[0], T = hc.totalYears;
  const [os, op] = ['self', 'part'].map(k => cc.owners.find(o => o.key === k));
  let tR = 0; while (tR <= T && cc.ageSelf0 + tR < os.retireAge && cc.agePart0 + tR < op.retireAge) tR++;
  if (!(tR > 0)) continue;
  c1.plans++;
  for (let t = 0; t <= T; t++) {
    const want = t < tR ? E.salaryAtYear(os, t) + E.salaryAtYear(op, t) : 0, got = E.salaryAtYear(ho, t), g = Math.abs(got - want);
    if (g > c1.worst) { c1.worst = g; c1.worstAt = `${sc.id} year ${t}: ${got.toFixed(2)} against ${want.toFixed(2)}`; }
    if (t >= tR && got !== 0) c1.after++;
    if (t < tR) {
      const we = E.relevantEarningsAtYear(cc, os, t) + E.relevantEarningsAtYear(cc, op, t), ge = E.relevantEarningsAtYear(hc, ho, t);
      c1.earnWorst = Math.max(c1.earnWorst, Math.abs(ge - we));
    }
    c1.years++;
  }
  // 2: the forward run's taxable pay against the engine's, the plan's own rules
  const m = M.prepare(E, E.resolveMpaa(E.normalizePlan({ ...hp, config: { ...hp.config, guardrails: false, lookaheadYears: 0 } })));
  const c = compile(m, ACTIONS), rows = E.simulateDeterministic(m.ctx);
  c2.plans++;
  for (let t = 0; t < tR && t <= T; t++) {
    const row = rows[t]; if (!row) continue;
    const g = Math.abs((c.yr.pay[t] || 0) - (row.taxablePaySelf || 0));
    if (g > c2.worst) { c2.worst = g; c2.worstAt = `${sc.id} year ${t}: the forward run ${(c.yr.pay[t] || 0).toFixed(2)}, the engine ${(row.taxablePaySelf || 0).toFixed(2)}`; }
    c2.years++;
  }
}
ok('1. the schedule: the household plan\'s salary in each plan year the couple\'s two salaries added before the first retirement, to a penny, and nought from it, its relevant earnings likewise',
  c1.plans > 0 && c1.worst <= PENNY && c1.earnWorst <= PENNY && c1.after === 0,
  `${c1.plans} couples, ${c1.years} plan years; the largest gap £${c1.worst.toFixed(4)}${c1.worst > PENNY ? ` at ${c1.worstAt}` : ''}, in relevant earnings £${c1.earnWorst.toFixed(4)}; a salary after the first retirement in ${c1.after} years${c1.refused.length ? `; refused for another shape: ${c1.refused.join(', ')}` : ''}`);
ok('2. in step: the forward run\'s taxable pay in each working year the engine\'s, to a penny',
  c2.plans > 0 && c2.years > 0 && c2.worst <= PENNY, `${c2.plans} household plans, ${c2.years} working years; the largest gap £${c2.worst.toFixed(4)}${c2.worst > PENNY ? ` at ${c2.worstAt}` : ''}`);

// ---- 3. identity ----
{ let n = 0, bad = 0, owners = 0, ownBad = 0; const first = [];
  for (const c of couples) for (const [order, p0] of [['as entered', c.plan], ['its mirror', otherOrder(E, c.plan)]]) {
    const hp = householdPlan(E, p0), a = built(hp, { scale: FORM, takeShapes: TAKE_SHAPES });
    if (!a) continue;
    n++; const b = built(hp, { scale: FORM, takeShapes: TAKES });
    if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; if (first.length < 3) first.push(`${c.id} (${order})`); }
  }
  for (const s of library) {
    const ctx = ctxOf(s.plan);
    for (const o of ctx.owners) for (let t = 0; t <= ctx.totalYears; t++) {
      owners++;
      const before = o.salary > 0 ? o.salary * Math.pow(1 + (o.salaryGrowth || 0), t) : 0;
      if (o.salaryByYear || E.salaryAtYear(o, t) !== before) ownBad++;
    }
  }
  ok('3. identity: every library couple\'s household plan, as entered and mirrored, the one built without the shape, byte for byte; every library plan\'s salary, owner by owner and year by year, its own formula\'s',
    n > 0 && bad === 0 && owners > 0 && ownBad === 0, `${n} household plans, ${bad} differing${first.length ? ` (${first.join('; ')})` : ''}; ${owners} owner-years, ${ownBad} read otherwise`); }

// ---- 4. nobody retiring (C) ----
{ const c4 = { plans: 0, years: 0, worst: 0, worstAt: '', retire: 0, extra: 0, refused: [], solved: '' };
  let first = null;
  for (const [ci, sc] of couples.entries()) {
    if (ci % 3 !== 1) continue;
    const p0 = apart(sc.plan, ci), cc0 = ctxOf(p0), T0 = cc0.totalYears;
    p0.demographics.retireAgeSelf = cc0.ageSelf0 + T0 + 5; p0.demographics.retireAgePart = cc0.agePart0 + T0 + 5;
    const p = householdPlan(E, p0), hp = built(p, { scale: FORM, takeShapes: TAKES });
    if (!hp) { c4.refused.push(sc.id); continue; }
    const cc = ctxOf(p), hc = ctxOf(hp), ho = hc.owners[0], T = hc.totalYears;
    c4.plans++; if (!first) first = hp;
    if (!(hc.ageSelf0 + T < ho.retireAge)) c4.retire++;
    if ((hp.otherIncomes || []).some(i => /^inc_house_takehome_/.test(i.id)) || (hp.oneOffContributions || []).some(x => /^dep_house_/.test(x.id))) c4.extra++;
    for (let t = 0; t <= T; t++) {
      const gaps = [['salary', Math.abs(E.salaryAtYear(ho, t) - cc.owners.reduce((x, o) => x + E.salaryAtYear(o, t), 0))]];
      for (const cat of ['pen', 'isa', 'other']) {
        const h = hc.accounts.find(a => a.cat === cat), two = cc.accounts.filter(a => a.cat === cat).reduce((x, a) => x + E.contribAtYear(a, t), 0);
        gaps.push([`${cat} contribution`, Math.abs((h ? E.contribAtYear(h, t) : 0) - two)]);
      }
      for (const [k, g] of gaps) if (g > c4.worst) { c4.worst = g; c4.worstAt = `${sc.id} year ${t}: ${k}`; }
      c4.years++;
    }
  }
  if (first) {
    try {
      const r = solveForApp(E, M, first, { points: 6, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } }), ctx = solvedContext(E, r);
      let n = 0; for (const zs of E.pathsForSeed(99005, 20, ctx.totalYears)) { E.runTrial(ctx, Float64Array.from(zs)); n++; }
      c4.solved = `${r.actions.length} moves, ${n} paths run`;
    } catch (e) { c4.solved = `NOT SOLVED: ${e.message.split('\n')[0]}`; }
  }
  ok('4. nobody retiring: the household plan works to the plan\'s end, its salary and its contributions the couple\'s two added in every plan year, to a penny, no take-home income and no later retiree\'s deposit, and the single solver solves it',
    c4.plans > 0 && c4.retire === 0 && c4.extra === 0 && c4.worst <= PENNY && /moves/.test(c4.solved),
    `${c4.plans} couples, ${c4.years} plan years; retiring within the plan ${c4.retire}, with a take-home income or a later retiree's deposit ${c4.extra}; the largest gap £${c4.worst.toFixed(4)}${c4.worst > PENNY ? ` at ${c4.worstAt}` : ''}; the solve: ${c4.solved || 'none'}${c4.refused.length ? `; refused for another shape: ${c4.refused.join(', ')}` : ''}`); }

console.log(fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`);
process.exit(fail ? 1 : 0);
