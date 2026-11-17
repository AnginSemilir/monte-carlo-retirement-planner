/*
 * ONE PLAN FOR THE WHOLE HOUSEHOLD, DESIGN A (research/solver/household.mjs; research/solver/HOUSEHOLD.md, D113). The full tier:
 * a research option, off in code, that nothing in the app imports. Five checks:
 *   1. the household plan as built on S327F (a younger couple: both paid, the first retiring three plan years before the
 *      partner): each wrapper's balance the two people's, every per-person allowance doubled, the partner's state pension
 *      in the first person's ages, the later retiree's take-home (the engine's own sum) and contributions in exactly the
 *      three years between the two retirements, the household working on both people's pay until the first retirement;
 *   2. the merged position: each wrapper's pots, the basis, the tax-free cash and the cash ISA added;
 *   3. THE PLAN'S FIDELITY: on six of the panel's couples, the household plan run under the app's own rules (arm A's policy,
 *      as the couple's) against the couple run under the same rules, 300 paths of seed 99001: survival within 2 points and
 *      the median end wealth within 15% on each; each plant fails it on some couple (the partner's state pension dropped,
 *      the later retiree's take-home dropped, the allowances left single, the partner's pots left out);
 *   4. the household's rollout at a smoke's settings (6 points, the light lattice) on S061-dbpart: both people take the same
 *      move, and the engine under the household policy and the exact model's path agree on every one of 20 paths;
 *   5. the refusals: two people's accounts of one wrapper at different risks; a later retiree paid in plan year 0.
 * Measured first by the probe behind check 3 (17 Nov, EXPLORATORY): the largest gaps unplanted 1.3 points of survival
 * (S061-dbpart) and 13.6% of median end wealth (S227-90), every plant past one bar or the other on some couple.
 *   node research/tests/household.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { householdPlanFor, mergedState, solveHousehold, chooseHousehold, runHouseholdPolicy, withHousehold, HOUSE, DOUBLED } from '../solver/household.mjs';
import { solveForApp } from '../../src/solverApp.js';
import { readPanel, appPlan } from '../solver/couple-panel.mjs';
import { readSharePanel } from '../solver/share-rules-panel.mjs';
import { PANEL_FILE, solverPlan } from '../solver/audit-couples.mjs';
import { armA } from '../solver/select-phase4.mjs';
import { runPath } from '../solver/audit-phase4.mjs';

const results = [];
const check = (label, ok, detail = '') => { results.push(ok); console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `: ${detail}` : ''}`); };
const P = readPanel(PANEL_FILE), S = readSharePanel();
const planOf = id => (P.find(x => x.id === id) || {}).plan || (S.find(x => x.id === id) || {}).plan;
// a couple's plan as the audits solve it: arm A's policy on the plan prepared for the solver (audit-couples.mjs solverPlan)
const couplePlan = id => { const plan = planOf(id), a = armA(appPlan(plan), { tournament: false }); return solverPlan('CANDC', plan, { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy }, 0.02); };
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
console.log('ONE PLAN FOR THE WHOLE HOUSEHOLD (design A): household.test.mjs');

// 1. the household plan as built on S327F
{
  const plan = planOf('S327F'), d = plan.demographics, hp = householdPlanFor(E, plan), ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(plan)));
  const sum = label => plan.accounts.filter(a => a.category === label).reduce((s, a) => s + E.num(a.balance, 0), 0);
  const bal = label => hp.accounts.filter(a => a.category === label).reduce((s, a) => s + E.num(a.balance, 0), 0);
  const labels = [...new Set(plan.accounts.map(a => a.category))];
  check('each wrapper one account, its balance the two people\'s', labels.every(l => hp.accounts.filter(a => a.category === l).length === 1 && near(bal(l), sum(l))), labels.map(l => `${l} ${bal(l)}`).join(', '));
  const cfg = { ...E.DEFAULT_CONFIG, ...(plan.config || {}) };
  const notDoubled = DOUBLED.filter(k => !(k in E.DEFAULT_CONFIG) || (k !== 'pensionNoEarningsLimit' && !near(hp.config[k], 2 * E.num(cfg[k], 0))));
  check('every per-person allowance doubled (the no-earnings limit at least doubled)', notDoubled.length === 0 && hp.config.pensionNoEarningsLimit >= 2 * E.num(cfg.pensionNoEarningsLimit, 0), notDoubled.join(' ') || `${DOUBLED.length} names`);
  const gap = ctx.ageSelf0 - ctx.agePart0, sp = hp.otherIncomes.find(i => i.id === 'inc_house_sp_part');
  check('the partner\'s state pension from the state pension age in the first person\'s ages', !!sp && sp.startAge === ctx.spa + gap && sp.amount === E.num(d.statePensionPart, 0) && sp.incomeType === 'otherTaxable', sp ? `from ${sp.startAge}, ${sp.amount}` : 'none');
  // the first person retires at 52 in plan year 15, the partner at 52 in plan year 18: the gap is plan years 15, 16, 17
  const years = hp.otherIncomes.filter(i => /^inc_house_takehome_/.test(i.id)).map(i => i.startAge - ctx.ageSelf0);
  const o = ctx.owners.find(x => x.key === 'part'), t = 16, pay = E.salaryAtYear(o, t), accts = ctx.accounts.filter(a => a.owner === 'part');
  const pen = accts.find(a => a.cat === 'pen'), pc = E.contribAtYear(pen, t), others = accts.filter(a => a !== pen).reduce((s, a) => s + E.contribAtYear(a, t), 0);
  const want = pay - E.calculateUKTaxAndNIC(pay, ctx.P, o.selfEmployed) - E.netCostOfPensionContrib(pc, pay, ctx.P, o.selfEmployed) - others;
  const got = hp.otherIncomes.find(i => i.id === `inc_house_takehome_part_${t}`);
  check('the later retiree\'s take-home as tax-free income in plan years 15 to 17 alone, the engine\'s own sum', years.join(',') === '15,16,17' && !!got && near(got.amount, want) && got.incomeType === 'taxFree', `years ${years.join(',')}; year 16 ${got ? Math.round(got.amount) : '-'} against ${Math.round(want)}`);
  const deps = hp.oneOffContributions.filter(c => /^dep_house_/.test(c.id)), penDeps = deps.filter(c => c.category === 'Pensions').map(c => c.year - ctx.baseYear);
  check('the later retiree\'s contributions as External deposits in the same three years', penDeps.join(',') === '15,16,17' && deps.every(c => c.transferredFrom === 'External' && c.owner === 'Myself') && near(deps.find(c => c.category === 'Pensions' && c.year === ctx.baseYear + 16).amount, pc), `pension in plan years ${penDeps.join(',')}`);
  const h = hp.demographics;
  check('the household works on both people\'s pay until the first retirement', h.planningMode === 'single' && h.retireAgeSelf === ctx.ageSelf0 + 15 && h.salarySelf === E.num(d.salarySelf, 0) + E.num(d.salaryPart, 0), `retires at ${h.retireAgeSelf}, pay ${h.salarySelf}`);
}

// 2. the merged position
{
  const plan = couplePlan('S205');
  const m = M.prepare(E, plan), hm = M.prepare(E, E.resolveMpaa(E.normalizePlan(householdPlanFor(E, plan)))), idOf = {};
  for (const a of hm.ctx.accounts) idOf[a.cat] = a.id;
  const st = M.initialState(m); st.basis = { self: 1000, part: 250 }; st.cumPcls = { self: 30, part: 70 }; st.cashIsa = { self: 5, part: 6 };
  const cp = { m, hm, idOf }, g = mergedState(cp, st);
  const sums = {}; for (const a of m.ctx.accounts) sums[a.cat] = (sums[a.cat] || 0) + (st.pots[a.id] || 0);
  const ok = Object.entries(sums).every(([c, v]) => near(g.pots[idOf[c]], v)) && g.basis.self === 1250 && g.cumPcls.self === 100 && g.cashIsa.self === 11;
  HOUSE.plant = 'nopartpots'; const gp = mergedState(cp, st); HOUSE.plant = '';
  check('each wrapper\'s pots, the basis, the tax-free cash and the cash ISA added; the plant leaves the partner out', ok && gp.basis.self === 1000 && !near(gp.pots[idOf.pen], sums.pen), Object.entries(sums).map(([c, v]) => `${c} ${Math.round(v)}`).join(', '));
}

// 3. the plan's fidelity under the app's own rules
{
  const UNITS = ['S205', 'S061-dbpart', 'S327F', 'S227-90', 'S149', 'S023-db'], N = 300;
  const gaps = (plant) => {
    HOUSE.plant = plant;
    const out = [];
    for (const id of UNITS) {
      const a = armA(appPlan(planOf(id)), { tournament: false }), cpl = E.resolveMpaa(a.planState);
      const cC = E.buildContext(cpl), cH = E.buildContext(E.resolveMpaa(E.normalizePlan(householdPlanFor(E, cpl)))), T = cC.totalYears;
      if (cH.totalYears !== T) { out.push({ id, ds: Infinity, dw: Infinity }); continue; }
      let sC = 0, sH = 0; const wC = [], wH = [];
      for (const zs of E.pathsForSeed(99001, N, T)) { const rc = runPath(cC, zs, false), rh = runPath(cH, zs, false); sC += rc.survived ? 1 : 0; sH += rh.survived ? 1 : 0; wC.push(rc.wealth); wH.push(rh.wealth); }
      const med = xs => { const s = [...xs].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
      out.push({ id, ds: 100 * (sH - sC) / N, dw: med(wH) / med(wC) - 1 });
    }
    HOUSE.plant = '';
    return out;
  };
  const fits = g => Math.abs(g.ds) <= 2 && Math.abs(g.dw) <= 0.15, show = gs => gs.map(g => `${g.id} ${g.ds >= 0 ? '+' : ''}${g.ds.toFixed(1)} pts ${(100 * g.dw).toFixed(1)}%`).join('; ');
  const clean = gaps('');
  check('the household plan tracks the couple under the app\'s rules on all six (survival within 2 points, median end wealth within 15%)', clean.every(fits), show(clean));
  for (const plant of ['nopartsp', 'notakehome', 'singleband', 'nopartpots']) {
    const g = gaps(plant);
    check(`the plant '${plant}' fails it on some couple`, g.some(x => !fits(x)), show(g.filter(x => !fits(x))) || 'none');
  }
}

// 4. the household's rollout at a smoke's settings
{
  const plan = couplePlan('S061-dbpart');
  const light = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
  const cp = solveHousehold(E, M, plan, { solveOne: (p, o) => solveForApp(E, M, p, { points: 6, ageWith: o.partnerAge0, research: { tieAboveCap: undefined, ...light } }), tieJoint: 1e-4, holdPast: 2 });
  const j0 = chooseHousehold(cp, M.initialState(cp.m), 0);
  check('both people take the household\'s move', JSON.stringify(j0.perOwner.self) === JSON.stringify(j0.perOwner.part) && j0.perOwner.self.steps === j0.steps, `split ${j0.split}, level ${j0.spendLevel}`);
  const ctx = E.buildContext(withHousehold(cp.plan, cp)), T = ctx.totalYears;
  let agree = 0, n = 0;
  for (const zs of E.pathsForSeed(99002, 20, T)) { const r = runPath(ctx, zs, false), x = runHouseholdPolicy(cp, zs); n++; if (r.survived === x.survived) agree++; }
  check('the engine under the household policy and the exact model\'s path agree on every path', agree === n, `${agree} of ${n}`);
}

// 5. the refusals
{
  const p1 = JSON.parse(JSON.stringify(planOf('S205'))); p1.accounts.find(a => a.owner === 'Partner' && a.category === 'Pensions').risk = 'Medium Risk';
  let t1 = ''; try { householdPlanFor(E, p1); } catch (e) { t1 = e.message; }
  const p2 = JSON.parse(JSON.stringify(planOf('S205'))); p2.demographics.retireAgeSelf = 55; p2.demographics.currentAgeSelf = 56; p2.demographics.salaryPart = 30000;
  let t2 = ''; try { householdPlanFor(E, p2); } catch (e) { t2 = e.message; }
  check('refused: two risks in one wrapper; a later retiree paid in plan year 0', /different risks/.test(t1) && /plan year 0/.test(t2), `${t1 ? 'risks refused' : 'risks taken'}; ${t2 ? 'year 0 refused' : 'year 0 taken'}`);
}

const bad = results.filter(ok => !ok).length;
console.log(bad ? `FAILED: ${bad} of ${results.length} checks` : `ALL PASS: ${results.length} checks`);
process.exit(bad ? 1 : 0);
