/*
 * ONE PLAN FOR THE WHOLE HOUSEHOLD, DESIGN A (research/solver/household.mjs; research/solver/HOUSEHOLD.md, D113). The full tier:
 * a research option, off in code, that nothing in the app imports. Six groups of checks:
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
 *   5. the refusals: two people's accounts of one wrapper at different risks; a later retiree paid in plan year 0;
 *   6. the household's move from the single solver's own chooser (PRESCRIPTIVE-PLAN.md step 1, D117; chooseHouseholdSingle),
 *      at check 4's settings on 20 paths of seed 99002, the household table solved as the candidate stands (its tie-break
 *      above the estate cap on), each check shown failing on its plant: (a) both people take the chooser's move at every
 *      decision (S061-dbpart; 'partnersecond'); (b) the engine under householdSinglePolicy and runHouseholdSinglePolicy
 *      agree on every path, at either split (S061-dbpart; check 4's own form); (c) the move is chooseAction's on the table
 *      as solved, and differs from chooseAction's on a copy with tieAboveCap 0 at 100 decisions or more, every one with the
 *      household above the table's estate cap (S327F, along the even split's path; 'notiebreak'); (d) 'best5' returns the
 *      even split at every decision where no other split scores more than 1e-9 above it, 600 decisions or more of the 700
 *      before the plan's last year (S061-dbpart, along the even split's path; 'tiezero'). The counts the thresholds follow:
 *      the review's results-tiebreak-count.txt (S327F 342 of 1,220 decisions; S061-dbpart 674 of 700).
 * Measured first by the probe behind check 3 (17 Nov, EXPLORATORY): the largest gaps unplanted 1.3 points of survival
 * (S061-dbpart) and 13.6% of median end wealth (S227-90), every plant past one bar or the other on some couple.
 *   node research/tests/household.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { householdPlanFor, mergedState, solveHousehold, chooseHousehold, runHouseholdPolicy, withHousehold, chooseHouseholdSingle, runHouseholdSinglePolicy, withHouseholdSingle, householdValue, HOUSE, DOUBLED } from '../solver/household.mjs';
import { chooseAction } from '../../src/solver/solve.js';
import { vecOf } from '../../src/solver/grid.js';
import { ratesAt } from '../../src/solver/couple.js';
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

// 6. the household's move from the single solver's own chooser (PRESCRIPTIVE-PLAN.md step 1)
{
  const light = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
  const one = (p, o) => solveForApp(E, M, p, { points: 6, ageWith: o.partnerAge0, research: { ...light } });
  const A = solveHousehold(E, M, couplePlan('S061-dbpart'), { solveOne: one }), B = solveHousehold(E, M, couplePlan('S327F'), { solveOne: one });
  const tiered = H => H.c.acts.some(x => (x.tierPen || 0) > 0 || (x.tierIsa || 0) > 0);
  const heldOf = (cp, st) => (tiered(cp.H) ? { pen: (st.tierHeld && st.tierHeld.self && st.tierHeld.self.pen) || 0, isa: (st.tierHeld && st.tierHeld.self && st.tierHeld.self.isa) || 0 } : null);
  // 20 paths of seed 99002 in the exact model under chooseHouseholdSingle, visit(state, t, joint) at each decision before its step
  const walk = (cp, visit) => {
    const T = cp.m.ctx.totalYears;
    for (const zs of E.pathsForSeed(99002, 20, T)) {
      const st = M.initialState(cp.m);
      for (let t = 0; t <= T; t++) { const j = chooseHouseholdSingle(cp, st, t); visit(st, t, j); const row = M.step(cp.m, st, j, t, ratesAt(cp.m, zs, t)); if (row.unmetDemand > 1 || row.preNmpaInsolvent) break; }
    }
  };
  const planted = (plant, fn) => { HOUSE.plant = plant; try { return fn(); } finally { HOUSE.plant = ''; } };
  // (a) both people take the chooser's move
  const takes = cp => {
    let n = 0, bad = 0;
    walk({ ...cp, split: 'best5' }, (st, t, j) => {
      n++;
      const ai = chooseAction(cp.H, vecOf(cp.H.m, mergedState(cp, st)), t, heldOf(cp, st)), a = cp.H.actions[ai];
      const ok = j.ia === ai && j.ib === ai && JSON.stringify(j.perOwner.self) === JSON.stringify(j.perOwner.part) && j.steps === a.steps && j.perOwner.self.steps === a.steps
        && (j.perOwner.self.tierPen || 0) === (tiered(cp.H) ? a.tierPen || 0 : 0) && (j.perOwner.self.tierIsa || 0) === (tiered(cp.H) ? a.tierIsa || 0 : 0) && j.lump === !!a.lump && !!j.harvest === !!a.harvest;
      if (!ok) bad++;
    });
    return { n, bad };
  };
  const ta = takes(A), tp = planted('partnersecond', () => takes(A));
  check('(6a) both people take the single chooser\'s move at every decision (S061-dbpart)', ta.n > 0 && ta.bad === 0, `${ta.n - ta.bad} of ${ta.n}`);
  check('(6a) the plant \'partnersecond\' fails it', tp.bad > 0, `${tp.bad} of ${tp.n} decisions not the chooser's for both`);
  // (b) the engine and the exact model's path agree, at either split
  const agrees = split => { const cp = { ...A, split }, ctx = E.buildContext(withHouseholdSingle(cp.plan, cp)); let n = 0, ok = 0; for (const zs of E.pathsForSeed(99002, 20, ctx.totalYears)) { n++; if (runPath(ctx, zs, false).survived === runHouseholdSinglePolicy(cp, zs).survived) ok++; } return { n, ok }; };
  const ge = agrees('even'), gb = agrees('best5');
  check('(6b) the engine under householdSinglePolicy and runHouseholdSinglePolicy agree on every path (S061-dbpart)', ge.ok === ge.n && gb.ok === gb.n, `even ${ge.ok} of ${ge.n}, best5 ${gb.ok} of ${gb.n}`);
  // (c) the move is the chooser's with its tie-break, which acts above the estate cap and nowhere else
  const tie = cp => {
    const H0 = { ...cp.H, tieAboveCap: 0 }, dt = (cp.H.terminal && cp.H.terminal.deathTax) || 0;
    let n = 0, notChooser = 0, differ = 0, below = 0;
    walk({ ...cp, split: 'even' }, (st, t, j) => {
      n++;
      const s = vecOf(cp.H.m, mergedState(cp, st)), held = heldOf(cp, st), ai = chooseAction(cp.H, s, t, held), a0 = chooseAction(H0, s, t, held);
      if (j.ia !== ai) notChooser++;
      if (j.ia !== a0) { differ++; if (!(Math.max(0, s[0] + s[1] + s[2] - s[0] * dt) > cp.H.estateCap)) below++; }
    });
    return { n, notChooser, differ, below };
  };
  const tc = tie(B), tz = planted('notiebreak', () => tie(B)), tieOk = x => x.notChooser === 0 && x.differ >= 100 && x.below === 0, show = x => `${x.n} decisions, not the chooser's ${x.notChooser}, other than with tieAboveCap 0 at ${x.differ}, of those at or below the cap ${x.below}`;
  check('(6c) the move is chooseAction\'s on the table as solved, other than with tieAboveCap 0 at 100 decisions or more, each above the estate cap (S327F)', B.H.tieAboveCap > 0 && tieOk(tc), `tieAboveCap ${B.H.tieAboveCap}, the cap ${B.H.estateCap}; ${show(tc)}`);
  check('(6c) the plant \'notiebreak\' fails it', !tieOk(tz), show(tz));
  // (d) the best of five keeps the even split wherever nothing beats it by more than 1e-9
  const keeps = cp => {
    const T = cp.m.ctx.totalYears, E5 = { ...cp, split: 'best5' };
    let before = 0, level = 0, wrong = 0;
    walk({ ...cp, split: 'even' }, (st, t, j) => {
      if (t >= T) return;
      before++;
      const v = [0, 0.25, 0.5, 0.75, 1].map(sp => { const x = M.cloneState(st), row = M.step(cp.m, x, { ...j, split: sp }, t, null, true); return row.unmetDemand > 1 || row.preNmpaInsolvent ? -Infinity : householdValue(cp, x, t, null, j.ia); });
      if (v[2] > -Infinity && Math.max(v[0], v[1], v[3], v[4]) <= v[2] + 1e-9) { level++; if (chooseHouseholdSingle(E5, st, t).split !== 0.5) wrong++; }
    });
    return { before, level, wrong };
  };
  const kc = keeps(A), kz = planted('tiezero', () => keeps(A)), keepOk = x => x.wrong === 0 && x.level >= 600, showK = x => `${x.level} of the ${x.before} decisions before the last year with no split above the even one by more than 1e-9; another split returned at ${x.wrong}`;
  check('(6d) \'best5\' returns the even split wherever no other scores more than 1e-9 above it, at 600 decisions or more (S061-dbpart)', keepOk(kc), showK(kc));
  check('(6d) the plant \'tiezero\' fails it', !keepOk(kz), showK(kz));
}

const bad = results.filter(ok => !ok).length;
console.log(bad ? `FAILED: ${bad} of ${results.length} checks` : `ALL PASS: ${results.length} checks`);
process.exit(bad ? 1 : 0);
