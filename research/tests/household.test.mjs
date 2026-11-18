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
 *      the review's results-tiebreak-count.txt (S327F 342 of 1,220 decisions; S061-dbpart 674 of 700);
 *   7. the household plan's capital gains band (PRESCRIPTIVE-PLAN.md step 2, twoBands; every context or model of a household
 *      plan here built inside it), each check shown failing on its plant: (a) on the six fidelity units the household
 *      plan's band twice a person's in the couple's model ('cgtband'); (b) the engine's default basic band limit the same
 *      before and after solveHousehold and householdContext, a throwing solve among them ('nofinally': a twoBands without
 *      its finally, on a throwing fn); (c) a couple's M.prepare and E.buildContext, called after solveHousehold, carry a
 *      person's band (the same plant); (d) the solver's code id 603eeb595679 (nothing under src/ and not the engine edited);
 *   8. THE TWIN (PRESCRIPTIVE-PLAN.md step 3): on check 3's six units, the couple made of the first person twice (built as the
 *      review's scripts/twin-trace.mjs builds it), under arm A's policy, 100 paths of seed 99001, the household plan
 *      (through householdContext) against the couple, year by year: (1) on S205, S061-dbpart, S327F, S227-90 and S023-db
 *      the household plan's mean capital gains tax over the plan within 3% of the couple's (or £50, where that is more) and
 *      its mean income tax (with the tax on interest and dividends) within 0.1%; (2) on S205, its one-off cost taken out of
 *      the plan arm A's policy was picked on and the policy held (D124), every wrapper within a pound in every plan year on
 *      every path; (3) S149 named the one exception, with its size (D124; trace 2, below), held to no bar; the plants
 *      'cgtband' (bar 1 failing on S327F, S227-90 and S023-db) and 'singleband' (bars 1 and 2). The bars are the review's
 *      (results-twin-trace.txt before the band's mend, results-twin-trace-mended.txt after, seed 99002); a twin outside a bar
 *      here that the review's seed put inside is printed as a STOP, and the bar is not moved. On seed 99001 S205's twin with
 *      its cost parts on 2 of 100 paths (the couple's dividend tax £3 over the household plan's in one late year), the STOP
 *      the maintainer ruled on (D124).
 *      Why the twins part once the band is right (trace 1, twin-why.mjs, results-twin-why.txt): the engine takes a one-off cost
 *      person by person, the first person first (App.jsx stepYear's one-off cost block: at each step of the cost's order the
 *      first person's pot before the partner's), so the two twins hold and draw unequal amounts from the cost's year on (on
 *      all six, their wealth first parts in plan year 3, the cost's, on every path; with the costs taken out and arm A's
 *      policy held, the twins are equal in every year of every path). Their unequal holdings then leave one twin's
 *      allowance part unused where the household plan has both people's: S205's two paths apart on seed 99001 are the
 *      couple's dividend tax £3 over the household plan's in one late year (with the costs taken out, 0 of 100 apart).
 *      S149 (trace 2): the figure that parts first in its cost's year is the capital gains tax on the cost's sale (seed
 *      99002 path 17: the couple £1,210, the household plan £670, the gain realised £9,724 in both): the couple takes the
 *      cost from the first twin's taxable account, so the gain falls on one person's exempt amount where the household plan
 *      has two. The cause is the engine's cost order against design A's doubled exempt amount: neither householdPlanFor's
 *      construction nor arm A's rule, the plan's two branches; with the maintainer, S149 held to no bar meanwhile.
 *   9. the decomposition's option (D129 (1); HOUSEHOLD-DECOMP.md; householdPlanFor's opts.single), on S061-dbpart, each
 *      check shown failing on its plant: (a) each group leaves exactly its allowances at one person's (the bands: the
 *      personal allowance, the taper's threshold, the UK and Scottish band limits; the cap: the tax-free cash cap), every
 *      other entry design A's; empty or unset, the plan design A's byte for byte; an unknown group, or a list that is not
 *      one, refused ('singlenone': the option read as empty); (b) solved at check 4's settings, the household table with the
 *      bands single carries one person's capital gains band, with the cap single two people's, the engine's default basic
 *      band the same after each ('singlecgt': the bands single, the solve inside twoBands, which solveHousehold's own check
 *      then refuses).
 * Measured first by the probe behind check 3 (17 Nov, EXPLORATORY): the largest gaps unplanted 1.3 points of survival
 * (S061-dbpart) and 13.6% of median end wealth (S227-90), every plant past one bar or the other on some couple.
 *   node research/tests/household.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { householdPlanFor, mergedState, solveHousehold, chooseHousehold, runHouseholdPolicy, withHousehold, chooseHouseholdSingle, runHouseholdSinglePolicy, withHouseholdSingle, householdValue, twoBands, householdContext, HOUSE, DOUBLED, SINGLE_GROUPS } from '../solver/household.mjs';
import { codeId } from '../solver/code-id.mjs';
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
  const m = M.prepare(E, plan), hm = twoBands(E, () => M.prepare(E, E.resolveMpaa(E.normalizePlan(householdPlanFor(E, plan))))), idOf = {};
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
      const cC = E.buildContext(cpl), cH = householdContext(E, E.resolveMpaa(E.normalizePlan(householdPlanFor(E, cpl)))), T = cC.totalYears;
      if (cH.totalYears !== T) { out.push({ id, ds: Infinity, dw: Infinity }); continue; }
      let sC = 0, sH = 0, tC = 0, tH = 0; const wC = [], wH = [];
      for (const zs of E.pathsForSeed(99001, N, T)) { const rc = runPath(cC, zs, false), rh = runPath(cH, zs, false); sC += rc.survived ? 1 : 0; sH += rh.survived ? 1 : 0; wC.push(rc.wealth); wH.push(rh.wealth); tC += rc.tax; tH += rh.tax; }
      const med = xs => { const s = [...xs].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
      out.push({ id, ds: 100 * (sH - sC) / N, dw: med(wH) / med(wC) - 1, dt: (tH - tC) / N });
    }
    HOUSE.plant = '';
    return out;
  };
  const fits = g => Math.abs(g.ds) <= 2 && Math.abs(g.dw) <= 0.15, show = gs => gs.map(g => `${g.id} ${g.ds >= 0 ? '+' : ''}${g.ds.toFixed(1)} pts ${(100 * g.dw).toFixed(1)}%`).join('; ');
  const clean = gaps('');
  check('the household plan tracks the couple under the app\'s rules on all six (survival within 2 points, median end wealth within 15%)', clean.every(fits), show(clean));
  // beside the bars (PRESCRIPTIVE-PLAN.md step 3): each unit's mean lifetime tax, the household plan's less the couple's. Two
  // differences are expected, the review's figures on seed 99002 beside them: on S061-dbpart the partner's DB pension is taxed
  // against the first person's spare allowance (-£23,637, design A's allowance bias, lasting the plan); on S227-90 arm A's
  // bracket-fill rule fills two bands from the merged pension, where in the couple the partner's band is soon empty
  // (+£88,329, a rule that reads the bands as its target). The bars are not changed.
  console.log(`  info (3) the mean lifetime tax, the household plan's less the couple's: ${clean.map(g => `${g.id} ${g.dt >= 0 ? '+' : '-'}£${Math.abs(Math.round(g.dt)).toLocaleString('en-GB')}`).join('; ')}`);
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

// 7. the household plan's capital gains band (PRESCRIPTIVE-PLAN.md step 2)
{
  const FID = ['S205', 'S061-dbpart', 'S327F', 'S227-90', 'S149', 'S023-db'];
  const bands = () => FID.map(id => { const cpl = couplePlan(id); return { id, h: householdContext(E, E.resolveMpaa(E.normalizePlan(householdPlanFor(E, cpl)))).P.cgtBandWidth, p: M.prepare(E, cpl).ctx.P.cgtBandWidth }; });
  const twice = bs => bs.every(x => Math.abs(x.h - 2 * x.p) < 1e-6), showB = bs => bs.map(x => `${x.id} ${x.h} against ${x.p}`).join('; ');
  const b = bands(); HOUSE.plant = 'cgtband'; const bz = bands(); HOUSE.plant = '';
  check('(7a) on the six fidelity units, the household plan\'s capital gains band twice a person\'s in the couple\'s model', twice(b), showB(b));
  check('(7a) the plant \'cgtband\' fails it', !twice(bz), showB(bz));
  const light = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
  const one = (p, o) => solveForApp(E, M, p, { points: 6, ageWith: o.partnerAge0, research: { ...light } });
  const plan = couplePlan('S061-dbpart'), d0 = E.DEFAULT_CONFIG.basicBandLimit, p0 = M.prepare(E, plan).ctx.P.cgtBandWidth;
  const throwing = () => { throw new Error('the planted solve'); };
  // (b) and (c), clean: a solve, a context and a throwing solve, the default and a couple's band after each
  const after = [];
  const couple = () => [M.prepare(E, plan).ctx.P.cgtBandWidth, E.buildContext(plan).P.cgtBandWidth];
  solveHousehold(E, M, plan, { solveOne: one }); after.push(['a solve', E.DEFAULT_CONFIG.basicBandLimit, ...couple()]);
  householdContext(E, E.resolveMpaa(E.normalizePlan(householdPlanFor(E, plan)))); after.push(['a context', E.DEFAULT_CONFIG.basicBandLimit, ...couple()]);
  try { solveHousehold(E, M, plan, { solveOne: throwing }); } catch (e) { /* the planted solve's error */ }
  after.push(['a throwing solve', E.DEFAULT_CONFIG.basicBandLimit, ...couple()]);
  // the plant: a twoBands without its finally, on a throwing fn
  HOUSE.plant = 'nofinally';
  try { solveHousehold(E, M, plan, { solveOne: throwing }); } catch (e) { /* as above */ }
  const planted = [E.DEFAULT_CONFIG.basicBandLimit, ...couple()];
  HOUSE.plant = ''; E.DEFAULT_CONFIG.basicBandLimit = d0;
  const showA = xs => xs.map(([w, d, a, c]) => `${w}: the default ${d}, the couple's band ${a} and ${c}`).join('; ');
  check('(7b) the engine\'s default basic band limit the same before and after solveHousehold and householdContext', after.every(x => x[1] === d0), `${d0} before; ${showA(after)}`);
  check('(7b) the plant \'nofinally\' (no finally, a throwing solve) fails it', planted[0] !== d0, `the default after ${planted[0]}`);
  check('(7c) a couple\'s M.prepare and E.buildContext, called after solveHousehold, carry a person\'s band', after.every(x => x[2] === p0 && x[3] === p0), `a person's ${p0}`);
  check('(7c) the same plant fails it', !(planted[1] === p0 && planted[2] === p0), `${planted[1]} and ${planted[2]}`);
  const cid = codeId();
  check('(7d) the solver\'s code id 603eeb595679', !!cid && cid.hash === '603eeb595679', cid ? cid.hash : 'none');
}

// 8. the twin (PRESCRIPTIVE-PLAN.md step 3)
{
  const TW = ['S205', 'S061-dbpart', 'S327F', 'S227-90', 'S149', 'S023-db'], HELD = TW.filter(id => id !== 'S149'), N = 100;
  // the review's twin: the first person twice; the partner's own incomes and deposits left out, the first person's deposits halved
  const twinOf = id => {
    const base = JSON.parse(JSON.stringify(planOf(id))), d = base.demographics;
    for (const k of ['currentAge', 'retireAge', 'salary', 'salaryGrowth', 'employment', 'cgtGainsUsed', 'cfBroughtForward', 'mpaaAge', 'statePension']) d[`${k}Part`] = d[`${k}Self`];
    const mine = base.accounts.filter(a => a.owner === 'Myself');
    base.accounts = [...mine, ...mine.map(a => ({ ...a, id: String(a.id).replace(/_self$/, '_part'), owner: 'Partner' }))];
    const inc = (base.otherIncomes || []).filter(i => i.owner === 'Myself');
    base.otherIncomes = [...inc, ...inc.map(i => ({ ...i, id: `${i.id}_p`, owner: 'Partner' }))];
    const dep = (base.oneOffContributions || []).filter(c => (c.owner || 'Myself') === 'Myself');
    base.oneOffContributions = dep.flatMap(c => [{ ...c, amount: Number(c.amount) / 2 }, { ...c, id: `${c.id}_p`, owner: 'Partner', amount: Number(c.amount) / 2 }]);
    return base;
  };
  const cats = (ctx, st) => { const o = { pen: 0, isa: 0, other: 0, cash: 0 }; for (const x of ctx.accounts) o[x.cat] = (o[x.cat] || 0) + (st.pots[x.id] || 0); return o; };
  const twins = (ids = TW, noCost = false) => ids.map(id => {
    const a = armA(appPlan(twinOf(id)), { tournament: false }), cpl = E.resolveMpaa(noCost ? { ...a.planState, oneOffCosts: [] } : a.planState);
    const cC = E.buildContext(cpl), cH = householdContext(E, E.resolveMpaa(E.normalizePlan(householdPlanFor(E, cpl)))), T = cC.totalYears;
    const tot = { C: { income: 0, cgt: 0 }, H: { income: 0, cgt: 0 } };
    let apart = 0, endGap = 0;
    for (const zs of E.pathsForSeed(99001, N, T)) {
      const sC = E.freshState(cC), sH = E.freshState(cH), zPath = zs.length > T + 1 ? zs[T + 1] : 0;
      let seen = false, rC, rH;
      for (let t = 0; t <= T; t++) {
        rC = E.stepYear(cC, sC, t, { z: zs[t], zPath }); rH = E.stepYear(cH, sH, t, { z: zs[t], zPath });
        tot.C.income += rC.taxPaid; tot.C.cgt += rC.cgtPaid || 0; tot.H.income += rH.taxPaid; tot.H.cgt += rH.cgtPaid || 0;
        if (!seen) { const a1 = cats(cC, sC), a2 = cats(cH, sH); if (Object.keys(a1).some(k => Math.abs(a1[k] - a2[k]) > 1)) { seen = true; apart++; } }
      }
      endGap = Math.max(endGap, Math.abs(rC.totalCombined - rH.totalCombined));
    }
    const m = x => x / N;
    return { id, label: a.label, cgtC: m(tot.C.cgt), cgtH: m(tot.H.cgt), incC: m(tot.C.income), incH: m(tot.H.income), apart, endGap };
  });
  const gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;
  const bar1 = x => Math.abs(x.cgtH - x.cgtC) <= Math.max(0.03 * x.cgtC, 50) && Math.abs(x.incH - x.incC) <= 0.001 * x.incC;
  const show = x => `${x.id} (${x.label}): capital gains tax ${gbp(x.cgtH)} against ${gbp(x.cgtC)}, income tax ${gbp(x.incH)} against ${gbp(x.incC)}; apart on ${x.apart} of ${N} paths, the largest gap in end wealth ${gbp(x.endGap)}`;
  const tw = twins(), held = tw.filter(x => HELD.includes(x.id));
  check('(8) the twin, bar 1: the household plan\'s capital gains tax within 3% (or £50) and income tax within 0.1% of the couple\'s on S205, S061-dbpart, S327F, S227-90 and S023-db', held.every(bar1), held.map(show).join('; '));
  const [s205] = twins(['S205'], true);
  check('(8) the twin, bar 2: on S205, its one-off cost taken out and arm A\'s policy held (D124), every wrapper within a pound in every plan year on every path', s205.apart === 0, show(s205));
  const s149 = tw.find(x => x.id === 'S149');
  console.log(`  info (8) the twin, S149, the one exception (D124: its cost's gain on one twin's exempt amount, the engine's cost order against design A's doubled exempt amount): ${show(s149)}; capital gains tax ${(100 * (s149.cgtH / s149.cgtC - 1)).toFixed(1)}% and income tax ${(100 * (s149.incH / s149.incC - 1)).toFixed(2)}% the couple's`);
  // bar 5: on the review's seed (results-twin-trace-mended.txt) every held twin was inside bar 1 and S205 inside bar 2, so a
  // twin outside either here is a STOP for the maintainer; the bar is not moved
  const outside = held.filter(x => !bar1(x));
  if (outside.length) console.log(`  STOP (8) the twin outside bar 1 on seed 99001 where the review's seed put it inside: ${outside.map(show).join('; ')}`);
  if (s205.apart > 0) console.log(`  STOP (8) the twin outside bar 2 on seed 99001 where the review's seed put it inside (0 of 100 paths apart there): ${show(s205)}`);
  { HOUSE.plant = 'singleband'; const [z] = twins(['S205'], true); HOUSE.plant = ''; check('(8) the plant \'singleband\' fails bar 2', z.apart > 0, show(z)); }
  for (const [plant, must] of [['cgtband', ['S327F', 'S227-90', 'S023-db']], ['singleband', null]]) {
    HOUSE.plant = plant; const tp = twins().filter(x => HELD.includes(x.id)); HOUSE.plant = '';
    const failing = tp.filter(x => !bar1(x)).map(x => x.id);
    check(`(8) the plant '${plant}' fails bar 1${must ? ` on ${must.join(', ')}` : ''}`, must ? must.every(id => failing.includes(id)) : failing.length > 0, tp.filter(x => !bar1(x)).map(show).join('; ') || 'none');
  }
}

// 9. the decomposition's option (D129 (1); householdPlanFor's opts.single)
{
  const plan = couplePlan('S061-dbpart'), cfg = { ...E.DEFAULT_CONFIG, ...(plan.config || {}) }, one = k => E.num(cfg[k], E.DEFAULT_CONFIG[k]);
  // the groups as HOUSEHOLD-DECOMP.md names them, typed here, not read from the code under test
  const WANT = { bands: ['personalAllowance', 'paTaperThreshold', 'basicBandLimit', 'higherBandLimit', 'scotStarterLimit', 'scotBasicLimit', 'scotIntermediateLimit', 'scotHigherLimit', 'scotAdvancedLimit'], cap: ['pclsMaxCap'] };
  const asBuilt = householdPlanFor(E, plan);
  const off = (single, singles) => { const hp = householdPlanFor(E, plan, { single }); return DOUBLED.filter(k => hp.config[k] !== (singles.includes(k) ? one(k) : asBuilt.config[k])).concat(Object.keys(hp.config).filter(k => !DOUBLED.includes(k) && hp.config[k] !== asBuilt.config[k])); };
  const cases = () => ({ bands: off(['bands'], WANT.bands), cap: off(['cap'], WANT.cap), both: off(['bands', 'cap'], [...WANT.bands, ...WANT.cap]) });
  const refusals = () => [['band'], 'bands', [null]].filter(x => { try { householdPlanFor(E, plan, { single: x }); return false; } catch { return true; } }).length;
  const c0 = cases(), r0 = refusals();
  const same = JSON.stringify(householdPlanFor(E, plan, { single: [] })) === JSON.stringify(asBuilt) && JSON.stringify(householdPlanFor(E, plan, {})) === JSON.stringify(asBuilt);
  const groupsOk = JSON.stringify(SINGLE_GROUPS) === JSON.stringify(WANT);
  const showC = c => Object.entries(c).map(([g, ks]) => `${g}: ${ks.length ? ks.join(', ') : 'as wanted'}`).join('; ');
  const fine = c => Object.values(c).every(ks => ks.length === 0);
  check('(9a) opts.single leaves exactly its groups\' allowances at one person\'s, every other entry design A\'s; empty or unset, the plan design A\'s byte for byte; three bad lists refused', groupsOk && fine(c0) && same && r0 === 3 && one('basicBandLimit') !== 2 * one('basicBandLimit'), `${showC(c0)}; empty the same ${same}; refused ${r0} of 3`);
  HOUSE.plant = 'singlenone'; const cz = cases(); HOUSE.plant = '';
  check('(9a) the plant \'singlenone\' fails it', !fine(cz), showC(cz));
  const light = { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } };
  const solveOne = (p, o) => solveForApp(E, M, p, { points: 6, ageWith: o.partnerAge0, research: { ...light } });
  const d0 = E.DEFAULT_CONFIG.basicBandLimit, p0 = M.prepare(E, plan).ctx.P.cgtBandWidth;
  const band = single => { const h = solveHousehold(E, M, plan, { solveOne, single }); return { band: h.H.m.ctx.P.cgtBandWidth, ctx: householdContext(E, h.hplan, single).P.cgtBandWidth, after: E.DEFAULT_CONFIG.basicBandLimit, meta: JSON.stringify(h.meta.single || null) }; };
  const bB = band(['bands']), bC = band(['cap']);
  const ok9b = bB.band === p0 && bB.ctx === p0 && Math.abs(bC.band - 2 * p0) < 1e-6 && Math.abs(bC.ctx - 2 * p0) < 1e-6 && bB.after === d0 && bC.after === d0 && bB.meta === '["bands"]' && bC.meta === '["cap"]';
  check('(9b) solved, the household table with the bands single carries one person\'s capital gains band, with the cap single two people\'s; the engine\'s default the same after each', ok9b, `bands ${bB.band} (its context ${bB.ctx}), cap ${bC.band} (${bC.ctx}), a person's ${p0}; the default after ${bB.after} and ${bC.after}, before ${d0}; meta ${bB.meta} ${bC.meta}`);
  HOUSE.plant = 'singlecgt'; let threw = '';
  try { band(['bands']); } catch (e) { threw = e.message; }
  HOUSE.plant = ''; E.DEFAULT_CONFIG.basicBandLimit = d0;
  check('(9b) the plant \'singlecgt\' (the bands single, the solve inside twoBands) is refused by solveHousehold\'s own check', /not one person's/.test(threw), threw || 'not refused');
}

const bad = results.filter(ok => !ok).length;
console.log(bad ? `FAILED: ${bad} of ${results.length} checks` : `ALL PASS: ${results.length} checks`);
process.exit(bad ? 1 : 0);
