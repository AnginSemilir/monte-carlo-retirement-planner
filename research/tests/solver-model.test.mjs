/*
 * GATE 1: THE REDUCED MODEL IS THE ENGINE'S YEAR, REARRANGED.
 *
 * `src/solver/model.js` exists so a solver can call a year tens of millions of times and so that the
 * decision arrives as an argument instead of being looked up. Neither of those is a licence to compute
 * a different year. The four pots are kept per owner, every tax figure is the engine's own function,
 * and the order of the year is the engine's order, so under a FIXED action the two must agree to the
 * pound. Anything else is a bug, not a tolerance.
 *
 * That is deliberately stricter than the solver plan's first draft, which allowed 1.5% per wrapper. The
 * approximations that plan had in mind - cash merged into the taxable pot, the gain fraction in three
 * buckets, returns as five nodes - are properties of the solver's GRID, not of the year, so they belong
 * in the grid and are measured there on their own. Keeping this gate exact is what makes it a bug
 * detector: if the model ever drifts from `stepYear`, this test says so on the year it first differs.
 *
 * What is checked: the five named policies and a set of orders outside them, across a spread of the
 * scenario library and both planning modes; the lump sum, the harvest at both ceilings, one-off costs
 * and deposits, and the CGT path; the refusals for the two rules the model does not carry; and the
 * gain-fraction invariant the grid will later lean on.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const GIA = 'Other Investments (e.g. GIA)';

/*
 * The engine is the reference. Compare every wrapper and every flow figure, year by year, and report the
 * worst absolute difference in pounds: a relative tolerance would hide a large error on a small pot and
 * flag rounding on a large one.
 */
const FIELDS = ['pensions', 'isas', 'other', 'cash', 'totalCombined', 'taxPaid', 'cgtPaid', 'drawdownPensions', 'harvested', 'targetSpend', 'netDrawdown', 'unmetDemand'];
function compare(plan, action = null) {
  const prepared = E.resolveMpaa(plan);
  const m = M.prepare(E, prepared);
  const eng = E.simulateDeterministic(prepared, 'expected');
  const red = M.runFixed(m, action || M.actionFromContext(m.ctx));
  if (eng.length !== red.length) return { worst: Infinity, where: `row count ${eng.length} vs ${red.length}` };
  let worst = 0, where = '';
  for (let t = 0; t < eng.length; t++) {
    for (const k of FIELDS) {
      const d = Math.abs(E.num(eng[t][k], 0) - E.num(red[t][k], 0));
      if (d > worst) { worst = d; where = `${k} in ${eng[t].year}: ${Math.round(E.num(eng[t][k], 0))} vs ${Math.round(E.num(red[t][k], 0))}`; }
    }
    if ((eng[t].preNmpaInsolvent ? 1 : 0) !== (red[t].preNmpaInsolvent ? 1 : 0)) return { worst: Infinity, where: `insolvency flag differs in ${eng[t].year}` };
  }
  return { worst, where };
}
// a pound of slack for floating-point association, nothing more
const EXACT = 1.0;

const library = buildScenarios();
const spread = (n) => { const out = []; for (let i = 0; i < n; i++) out.push(library[Math.floor(i * library.length / n)]); return out; };
const off = (p) => { const q = JSON.parse(JSON.stringify(p)); q.config = { ...q.config, guardrails: false, lookaheadYears: 0 }; return q; };

console.log('=========== A. THE FIVE NAMED POLICIES, ACROSS THE LIBRARY ===========');
{
  const names = Object.keys(E.DECUMULATION_POLICIES);
  ok('A0  the app ships the five policies this gate covers', names.length === 5, names.join(', '));
  const picked = spread(40);
  let worst = 0, where = '', n = 0;
  for (const sc of picked) {
    for (const key of names) {
      const plan = off(sc.plan);
      plan.spending = { ...plan.spending, decumulationPolicy: key };
      const r = compare(plan);
      n++;
      if (r.worst > worst) { worst = r.worst; where = `${sc.id} ${key}: ${r.where}`; }
    }
  }
  ok(`A1  ${n} household-policy pairs agree with the engine to the pound`, worst <= EXACT, `worst £${worst.toFixed(2)}${worst > EXACT ? ' at ' + where : ''}`);
}

console.log('=========== B. COUPLES, AND THE SPLIT ACROSS TWO PEOPLE ===========');
{
  const couples = library.filter(s => s.plan.demographics.planningMode !== 'single');
  ok('B0  the library has couples to test', couples.length > 20, `${couples.length}`);
  let worst = 0, where = '';
  for (let i = 0; i < 20; i++) {
    const sc = couples[Math.floor(i * couples.length / 20)];
    const r = compare(off(sc.plan));
    if (r.worst > worst) { worst = r.worst; where = `${sc.id}: ${r.where}`; }
  }
  ok('B1  twenty couples agree to the pound', worst <= EXACT, `worst £${worst.toFixed(2)}${worst > EXACT ? ' at ' + where : ''}`);
}

console.log('=========== C. THE LEVERS, ONE AT A TIME ===========');
{
  const base = {
    demographics: {
      planningMode: 'single', currentAgeSelf: 55, retireAgeSelf: 60, salarySelf: 70000,
      employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: 92
    },
    spending: { targetSpend: 38000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 700000, contrib: 14000, growth: 3, risk: 'High Risk' },
      { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 120000, contrib: 8000, growth: 3, risk: 'Medium/High Risk' },
      { id: 'other_self', owner: 'Myself', category: GIA, balance: 90000, contrib: 0, growth: 0, risk: 'Medium Risk', unrealisedGain: 38000 },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 35000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
    ],
    otherIncomes: [], oneOffContributions: [], oneOffCosts: [],
    config: { valuationDate: '2026-03-01', guardrails: false, lookaheadYears: 0 }
  };
  const mk = (o = {}) => E.normalizePlan({
    ...base,
    demographics: { ...base.demographics, ...(o.demographics || {}) },
    spending: { ...base.spending, ...(o.spending || {}) },
    oneOffCosts: o.oneOffCosts || [], oneOffContributions: o.oneOffContributions || [],
    config: { ...base.config, ...(o.config || {}) }
  });
  const each = (label, plan, action = null) => { const r = compare(plan, action); ok(label, r.worst <= EXACT, `worst £${r.worst.toFixed(2)}${r.worst > EXACT ? ' at ' + r.where : ''}`); };

  each('C1  the whole tax-free lump sum on first access', mk({ spending: { drawdownStrategy: 'Full 25% Lump Sum' } }));
  each('C2  the harvest to the personal allowance', mk({ config: { harvestPersonalAllowance: true, harvestCeiling: 'pa' } }));
  each('C3  the harvest to the basic-rate limit', mk({ config: { harvestPersonalAllowance: true, harvestCeiling: 'basic' } }));
  each('C4  a one-off cost large enough to reach the pension', mk({ oneOffCosts: [{ id: 'c', date: '2038-06-01', year: 2038, owner: 'Myself', amount: 250000, desc: 'x' }] }));
  each('C5  a one-off deposit into the GIA, which lands at cost', mk({ oneOffContributions: [{ id: 'd', date: '2030-06-01', year: 2030, owner: 'Myself', category: GIA, amount: 80000, transferredFrom: 'External' }] }));
  each('C6  a deposit funded from another pot of the household\'s own', mk({ oneOffContributions: [{ id: 'd', date: '2030-06-01', year: 2030, owner: 'Myself', category: 'Pensions', amount: 40000, transferredFrom: 'S&S ISAs' }] }));
  each('C7  a Scottish taxpayer', mk({ config: { taxRegion: 'scotland' } }));
  each('C8  spend bands that change the target mid-plan', mk({ spending: { spendBands: [{ id: 'b', fromAge: 75, toAge: 85, amount: 30000 }] } }));
  each('C9  a plan already in drawdown, with no working years at all', mk({ demographics: { currentAgeSelf: 67, retireAgeSelf: 60 } }));
  each('C10 a pre-access bridge, retiring six years before the pension unlocks', mk({ demographics: { currentAgeSelf: 48, retireAgeSelf: 52 } }));

  /*
   * The orders the solver will actually feed it are not the named five. A custom order goes through the
   * plan's own policyOverride so the engine runs it too, and both sides then see the same action.
   */
  console.log('--- C11-C14: draw orders outside the named five ---');
  const orders = [
    ['isa', 'penPA', 'other', 'cash', 'penBasic', 'penAny'],
    ['penPA', 'penBasic', 'isa', 'cash', 'other', 'penAny'],
    ['other', 'cash', 'penPA', 'isa', 'penBasic', 'penAny'],
    ['penPA', 'other', 'isa', 'cash', 'penBasic', 'penAny']
  ];
  orders.forEach((steps, i) => {
    const plan = mk();
    plan.spending.policyOverride = { steps, harvest: i % 2 === 0, depositOrder: null, costSteps: ['cash', 'other', 'isa', 'penBasic', 'penAny'] };
    const r = compare(E.normalizePlan(plan));
    ok(`C1${i + 1} a draw order outside the named five: ${steps.join(' > ')}`, r.worst <= EXACT, `worst £${r.worst.toFixed(2)}${r.worst > EXACT ? ' at ' + r.where : ''}`);
  });
}

console.log('=========== D. WHAT THE MODEL REFUSES TO CARRY ===========');
{
  const sc = library[100];
  const withGuard = JSON.parse(JSON.stringify(sc.plan)); withGuard.config = { ...withGuard.config, guardrails: true };
  const withLook = JSON.parse(JSON.stringify(sc.plan)); withLook.config = { ...withLook.config, guardrails: false, lookaheadYears: 5 };
  const threw = (p) => { try { M.prepare(E, p); return false; } catch (e) { return /guardrails|lookahead/.test(e.message); } };
  ok('D1  guardrails on is refused, naming the rule', threw(withGuard));
  ok('D2  the cost lookahead on is refused, naming the rule', threw(withLook));
  ok('D3  ...and both are accepted when the caller says it knows', (() => { try { M.prepare(E, withGuard, { allowUnsupported: true }); return true; } catch { return false; } })());
}

console.log('=========== E. THE GAIN FRACTION, WHICH THE GRID WILL LEAN ON ===========');
{
  /*
   * A GIA sale realises gain pro-rata and removes the cost portion from the basis, so the fraction of
   * the holding that is gain does not move. Only a deposit at cost and growth move it. The grid stores
   * that fraction in three buckets, and this is the property that makes the bucket meaningful.
   */
  const plan = E.normalizePlan({
    demographics: { planningMode: 'single', currentAgeSelf: 62, retireAgeSelf: 62, salarySelf: 0, employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58, statePensionSelf: 11500, terminalAge: 80 },
    spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Sequential' },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 200000, contrib: 0, growth: 0, risk: 'Medium Risk' },
      { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 0, contrib: 0, growth: 0, risk: 'Medium Risk' },
      { id: 'other_self', owner: 'Myself', category: GIA, balance: 300000, contrib: 0, growth: 0, risk: 'Medium Risk', unrealisedGain: 120000 },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 0, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
    ],
    otherIncomes: [], oneOffContributions: [], oneOffCosts: [],
    config: { valuationDate: '2026-01-01', guardrails: false, lookaheadYears: 0, cgtEnabled: true }
  });
  const m = M.prepare(E, E.resolveMpaa(plan));
  const state = M.initialState(m);
  const gia = () => state.pots.other_self;
  const frac = () => (gia() > 0 ? (gia() - state.basis.self) / gia() : 0);
  const f0 = frac();
  ok('E1  the opening gain fraction is the entered gain over the balance', Math.abs(f0 - 120000 / 300000) < 1e-9, f0.toFixed(6));
  const rates = { pen_self: 0, isa_self: 0, other_self: 0, cash_self: 0 };
  M.step(m, state, M.actionFromContext(m.ctx), 0, rates);
  const f1 = frac();
  ok('E2  a year of selling from the GIA leaves the fraction where it was', Math.abs(f1 - f0) < 1e-9, `${f0.toFixed(6)} -> ${f1.toFixed(6)}, sold £${Math.round(300000 - gia())}`);
  // growth at a positive rate lifts it, because the basis does not grow
  const before = frac(), bal = gia();
  M.step(m, state, M.actionFromContext(m.ctx), 1, { pen_self: 0, isa_self: 0, other_self: 0.05, cash_self: 0 });
  ok('E3  growth lifts it, because the cost does not grow', frac() > before, `${before.toFixed(6)} -> ${frac().toFixed(6)}`);
  ok('E4  ...and the balance moved, so this is not a no-op', Math.abs(gia() - bal) > 1);
}

console.log('=========== F. THE ACTION VOCABULARY ===========');
{
  const sc = library[7];
  const plan = off(sc.plan);
  plan.spending = { ...plan.spending, decumulationPolicy: 'ISA First' };
  const m = M.prepare(E, E.resolveMpaa(plan));
  const a = M.actionForPolicy(m, 'ISA First');
  ok('F1  a named policy maps to the action the engine would run', a.steps.join(',') === E.DECUMULATION_POLICIES['ISA First'].steps.join(','), a.steps.join(' > '));
  ok('F2  the context action and the named action agree for that plan', M.actionFromContext(m.ctx).steps.join(',') === a.steps.join(','));
  const s0 = M.initialState(m);
  const s1 = M.cloneState(s0);
  M.step(m, s1, a, 0);
  ok('F3  a clone is independent of the state it came from', Object.keys(s0.pots).every(k => s0.pots[k] === m.ctx.acc[k].balance));
}

console.log('=========== G. SPEED, WHICH IS THE POINT OF HAVING IT ===========');
{
  const sc = library[210];
  const plan = E.resolveMpaa(off(sc.plan));
  const m = M.prepare(E, plan);
  const action = M.actionFromContext(m.ctx);
  const reps = 200;
  let t0 = Date.now();
  for (let i = 0; i < reps; i++) E.simulateDeterministic(plan, 'expected');
  const engMs = (Date.now() - t0) / reps;
  t0 = Date.now();
  for (let i = 0; i < reps; i++) M.runFixed(m, action);
  const redMs = (Date.now() - t0) / reps;
  console.log(`      a ${m.ctx.totalYears}-year run: engine ${engMs.toFixed(2)}ms, reduced model ${redMs.toFixed(2)}ms (${(engMs / redMs).toFixed(1)}x)`);
  ok('G1  the reduced model is no slower than the engine', redMs <= engMs * 1.05, `${redMs.toFixed(2)}ms vs ${engMs.toFixed(2)}ms`);
  console.log('      (this is fidelity-first: the tax tables and the flat state that make it fast are');
  console.log('       phase 2\'s work, and this gate is what will prove they changed nothing.)');
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
