/*
 * ENGINE PROPERTIES: THE THINGS THAT MUST HOLD FOR EVERY PLAN, NOT JUST THE FIXTURES.
 *
 * The 1,170 assertions under research/tests pin specific answers on specific plans. This asks the
 * questions a fixture cannot: does a rule hold across a battery of households, and does the engine stay
 * sane when handed input a form would never produce but a saved file, an import or a bug easily could.
 *
 *   A  tournament: every strategy costs the same take-home as Current Plan (the sweep of GIA and cash
 *      contributions added on 2026-09-18 was verified on one plan; this is the other eleven)
 *   B  monotonicity: more spend never raises survival; a later retirement never lowers it
 *   C  determinism: the same seed gives the same statistics twice, and a different seed does not
 *   D  tax against HMRC 2025/26 worked examples, rUK and Scotland, plus employee and Class 4 NIC
 *   E  hostile input: blanks, zeros, negatives, absurd magnitudes, strings, inverted ages
 *
 * Run: node research/qa/engine-props.mjs   (after python3 research/build-engine.py)
 */
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const findings = [];
const ok = (n, c, extra = '') => {
  c ? pass++ : fail++;
  console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`);
  if (!c) findings.push(`${n}${extra ? ' — ' + extra : ''}`);
};

const GIA = 'Other Investments (e.g. GIA)';
const acc = (id, owner, category, balance, contrib, risk, extra = {}) => ({ id, owner, category, balance, contrib, growth: 0, risk, ...extra });
const single = (over = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 62, salarySelf: 70000,
    employmentSelf: 'employed', statePensionAge: 67, privatePensionAge: 57,
    statePensionSelf: 12548, terminalAge: 95, ...(over.demographics || {})
  },
  spending: { targetSpend: 40000, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic', ...(over.spending || {}) },
  accounts: over.accounts || [
    acc('pen_self', 'Myself', 'Pensions', 300000, 12000, 'High Risk'),
    acc('isa_self', 'Myself', 'S&S ISAs', 80000, 6000, 'High Risk'),
    acc('other_self', 'Myself', GIA, 40000, 0, 'Medium Risk'),
    acc('cash_self', 'Myself', 'Cash Savings', 20000, 0, 'Cash Equivalents')
  ],
  otherIncomes: over.otherIncomes || [], oneOffContributions: [], oneOffCosts: [],
  config: { valuationDate: '2026-01-01', ...(over.config || {}) }
});
const couple = (over = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'couple', currentAgeSelf: 48, retireAgeSelf: 60, salarySelf: 85000, employmentSelf: 'employed',
    currentAgePart: 46, retireAgePart: 62, salaryPart: 32000, employmentPart: 'employed',
    statePensionAge: 67, privatePensionAge: 57, statePensionSelf: 12548, statePensionPart: 12548, terminalAge: 95,
    ...(over.demographics || {})
  },
  spending: { targetSpend: 52000, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic', ...(over.spending || {}) },
  accounts: over.accounts || [
    acc('pen_self', 'Myself', 'Pensions', 420000, 20000, 'High Risk'),
    acc('isa_self', 'Myself', 'S&S ISAs', 120000, 8000, 'High Risk'),
    acc('other_self', 'Myself', GIA, 150000, 6000, 'Medium Risk'),
    acc('cash_self', 'Myself', 'Cash Savings', 40000, 2400, 'Cash Equivalents'),
    acc('pen_part', 'Partner', 'Pensions', 90000, 4000, 'Medium/High Risk'),
    acc('isa_part', 'Partner', 'S&S ISAs', 30000, 3000, 'High Risk'),
    acc('other_part', 'Partner', GIA, 0, 0, 'Medium Risk'),
    acc('cash_part', 'Partner', 'Cash Savings', 10000, 0, 'Cash Equivalents')
  ],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01', ...(over.config || {}) }
});

/* ------------------------------------------------------------------ A. the tournament's budget */
console.log('=== A. every entrant costs the same take-home ===');
{
  const battery = {
    'single, pension+ISA': single(),
    'single, GIA-only saver': single({ accounts: [
      acc('pen_self', 'Myself', 'Pensions', 300000, 0, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 0, 0, 'High Risk'),
      acc('other_self', 'Myself', GIA, 400000, 12000, 'Medium Risk'), acc('cash_self', 'Myself', 'Cash Savings', 30000, 3000, 'Cash Equivalents')] }),
    'single, no salary': single({ demographics: { salarySelf: '' } }),
    'single, self-employed': single({ demographics: { employmentSelf: 'self-employed' } }),
    'single, phased pension schedule': single({ accounts: [
      acc('pen_self', 'Myself', 'Pensions', 300000, 12000, 'High Risk', { contribByYear: [12000, 14000, 16000, 18000, 20000] }),
      acc('isa_self', 'Myself', 'S&S ISAs', 80000, 6000, 'High Risk'), acc('other_self', 'Myself', GIA, 40000, 0, 'Medium Risk'),
      acc('cash_self', 'Myself', 'Cash Savings', 20000, 0, 'Cash Equivalents')] }),
    'single, retiring at 52 (long bridge)': single({ demographics: { retireAgeSelf: 52 } }),
    'single, over the AA (£70k in)': single({ accounts: [
      acc('pen_self', 'Myself', 'Pensions', 300000, 70000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 80000, 0, 'High Risk'),
      acc('other_self', 'Myself', GIA, 40000, 0, 'Medium Risk'), acc('cash_self', 'Myself', 'Cash Savings', 20000, 0, 'Cash Equivalents')] }),
    'couple, everything': couple(),
    'couple, partner blank salary': couple({ demographics: { salaryPart: '' } }),
    'couple, balanced split': couple(),
    'couple, high earner (tapered AA)': couple({ demographics: { salarySelf: 300000 } })
  };
  for (const [name, plan] of Object.entries(battery)) {
    const balance = name.includes('balanced') ? 'balanced' : 'proportional';
    let t;
    try { t = E.buildTournament(E.resolveMpaa(plan), { emergencyFloor: 25000, scope: 'contributions', balance }); }
    catch (err) { ok(`${name}: builds`, false, String(err && err.message)); continue; }
    const base = E.accumulationOutlay(t.strategies[0].planState);
    const worst = [];
    for (const s of t.strategies.slice(1)) {
      const plans = s.planState ? [s.planState] : (s.candidates || []).map(c => c.planState).filter(Boolean);
      for (const ps of plans) {
        const out = E.accumulationOutlay(ps);
        const rel = base > 0 ? Math.abs(out - base) / base : Math.abs(out - base);
        if (rel > 0.01) worst.push(`${s.name}: £${Math.round(out)} vs £${Math.round(base)}`);
      }
    }
    ok(`${name}: budget £${Math.round(t.meta.netBudget)}, ${t.strategies.length} entrants within 1% of baseline outlay`, worst.length === 0, worst.slice(0, 2).join(' | '));
    ok(`${name}: budget is finite and non-negative`, Number.isFinite(t.meta.netBudget) && t.meta.netBudget >= 0, String(t.meta.netBudget));
  }
}

/* ------------------------------------------------------------------ B. monotonicity */
console.log('\n=== B. monotonicity (1,500 paths, seed 7) ===');
{
  const rate = (plan, spend) => E.monteCarlo(E.resolveMpaa(plan), { trials: 1500, seed: 7, spendOverride: spend }).successRate;
  const p = single();
  const spends = [20000, 30000, 40000, 50000, 60000, 80000];
  const rs = spends.map(s => rate(p, s));
  ok('more spend never raises survival', rs.every((r, i) => i === 0 || r <= rs[i - 1] + 0.05), rs.map(r => r.toFixed(1)).join(' > '));
  const ages = [55, 58, 62, 65, 68];
  const ra = ages.map(a => E.monteCarlo(E.resolveMpaa(single({ demographics: { retireAgeSelf: a } })), { trials: 1500, seed: 7 }).successRate);
  ok('retiring later never lowers survival', ra.every((r, i) => i === 0 || r >= ra[i - 1] - 0.05), ra.map(r => r.toFixed(1)).join(' < '));
  const pots = [100000, 300000, 600000, 1000000].map(b => E.monteCarlo(E.resolveMpaa(single({ accounts: [
    acc('pen_self', 'Myself', 'Pensions', b, 12000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 80000, 6000, 'High Risk'),
    acc('other_self', 'Myself', GIA, 40000, 0, 'Medium Risk'), acc('cash_self', 'Myself', 'Cash Savings', 20000, 0, 'Cash Equivalents')] })), { trials: 1500, seed: 7 }).successRate);
  ok('a bigger pension never lowers survival', pots.every((r, i) => i === 0 || r >= pots[i - 1] - 0.05), pots.map(r => r.toFixed(1)).join(' < '));
  const det = E.simulateDeterministic(E.buildContext(E.resolveMpaa(p)), 'expected');
  ok('the deterministic path has one row per year and no NaN', det.length > 40 && det.every(r => Number.isFinite(r.totalCombined)), `${det.length} rows`);
}

/* ------------------------------------------------------------------ C. determinism */
console.log('\n=== C. determinism ===');
{
  const p = E.resolveMpaa(single());
  const a = E.monteCarlo(p, { trials: 800, seed: 12345 });
  const b = E.monteCarlo(p, { trials: 800, seed: 12345 });
  const c = E.monteCarlo(p, { trials: 800, seed: 12346 });
  ok('same seed, same survival and same median', a.successRate === b.successRate && a.medianTerminal === b.medianTerminal, `${a.successRate} / ${b.successRate}`);
  ok('a different seed gives a different draw', a.medianTerminal !== c.medianTerminal, `${Math.round(a.medianTerminal)} vs ${Math.round(c.medianTerminal)}`);
  // the search set is a genuine prefix of the final set (the safe-spend solver's contract)
  const small = E.monteCarlo(p, { trials: 400, seed: 12345, collectPaths: false });
  ok('a 400-path run is not a different sample from the first 400 of 800', Math.abs(small.successRate - a.successRate) < 6, `${small.successRate.toFixed(1)} vs ${a.successRate.toFixed(1)}`);
  const ctxA = E.buildContext(p), ctxB = E.buildContext(p);
  ok('building a context twice gives the same target spend and years', ctxA.targetSpend === ctxB.targetSpend && ctxA.totalYears === ctxB.totalYears);
}

/* ------------------------------------------------------------------ D. tax against HMRC 2025/26 */
console.log('\n=== D. tax against HMRC 2025/26 ===');
{
  const cfg = E.DEFAULT_CONFIG;
  const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
  // rUK income tax: PA 12,570; 20% to 50,270; 40% to 125,140; 45% above; PA tapers £1 per £2 over £100k
  const cases = [
    [12570, 0], [20000, 1486], [50270, 7540], [60000, 11432], [100000, 27432],
    [110000, 33432], [125140, 42516], [150000, 53703], [200000, 76203]
  ];
  for (const [g, t] of cases) ok(`rUK income tax on £${g.toLocaleString()} = £${t.toLocaleString()}`, near(E.incomeTax(g, cfg), t, 1), `got £${Math.round(E.incomeTax(g, cfg))}`);
  // employee NIC 2025/26: 8% between 12,570 and 50,270, 2% above
  const nic = [[12570, 0], [30000, 1394.4], [50270, 3016], [80000, 3610.6]];
  for (const [g, n] of nic) ok(`Class 1 NIC on £${g.toLocaleString()} = £${n}`, near(E.nicFor(g, cfg), n, 1), `got £${E.nicFor(g, cfg).toFixed(1)}`);
  const c4 = [[30000, 1045.8], [80000, 2856.6]];
  for (const [g, n] of c4) ok(`Class 4 NIC on £${g.toLocaleString()} = £${n}`, near(E.nicFor(g, cfg, true), n, 1), `got £${E.nicFor(g, cfg, true).toFixed(1)}`);
  // Scotland 2025/26: starter 19% to 15,397; basic 20% to 27,491; intermediate 21% to 43,662; higher 42% to 75,000; advanced 45% to 125,140; top 48%
  const scot = { ...cfg, taxRegion: 'scotland' };
  const sc = [[20000, 1486 - 0 + (-(15397 - 12570) * 0.01)], [30000, 3612.61 - 0], [50000, 8043.32], [100000, 29043.32]];
  // computed: 20k -> (15397-12570)*.19 + (20000-15397)*.20 = 537.13 + 920.6 = 1457.73
  const scotCases = [[20000, 1457.73], [30000, 537.13 + 2418.8 + (30000 - 27491) * 0.21], [50000, 537.13 + 2418.8 + 3395.91 + (50000 - 43662) * 0.42], [100000, 537.13 + 2418.8 + 3395.91 + 13161.96 + (100000 - 75000) * 0.45]];
  for (const [g, t] of scotCases) ok(`Scotland income tax on £${g.toLocaleString()} = £${t.toFixed(0)}`, near(E.incomeTax(g, scot), t, 2), `got £${E.incomeTax(g, scot).toFixed(0)}`);
  void sc;
  // relief on a sacrifice: a £10,000 sacrifice at £70,000 saves 40% tax + 2% NIC
  const r = E.calculateMarginalRelief(70000, 10000, cfg);
  ok('salary sacrifice at £70k saves 42%', near(r.reliefRate, 42, 0.5), `${r.reliefRate.toFixed(1)}%`);
  const r2 = E.calculateMarginalRelief(70000, 10000, cfg, true);
  ok('self-employed relief at £70k is income tax only, 40%', near(r2.reliefRate, 40, 0.5), `${r2.reliefRate.toFixed(1)}%`);
  const r3 = E.calculateMarginalRelief(30000, 10000, cfg);
  ok('at £30k an employee saves 28%', near(r3.reliefRate, 28, 0.5), `${r3.reliefRate.toFixed(1)}%`);
}

/* ------------------------------------------------------------------ E. hostile input */
console.log('\n=== E. hostile input ===');
{
  const tryPlan = (label, over, expectRate = true) => {
    let plan, res;
    try { plan = single(over); } catch (err) { ok(`${label}: normalises`, false, String(err && err.message)); return; }
    try { res = E.monteCarlo(E.resolveMpaa(plan), { trials: 200, seed: 1 }); }
    catch (err) { ok(`${label}: simulates without throwing`, false, String(err && err.message).slice(0, 80)); return; }
    const sane = Number.isFinite(res.successRate) && res.successRate >= 0 && res.successRate <= 100 && Number.isFinite(res.medianTerminal);
    ok(`${label}: simulates to a finite rate`, expectRate ? sane : true, `rate ${res.successRate}, median ${Math.round(res.medianTerminal)}`);
  };
  tryPlan('all demographics blank', { demographics: { currentAgeSelf: '', retireAgeSelf: '', salarySelf: '', statePensionSelf: '', terminalAge: '' } });
  tryPlan('retire before current age', { demographics: { currentAgeSelf: 60, retireAgeSelf: 50 } });
  tryPlan('terminal age below retirement', { demographics: { retireAgeSelf: 62, terminalAge: 55 } });
  tryPlan('terminal age equals current age', { demographics: { currentAgeSelf: 45, terminalAge: 45 } });
  tryPlan('negative balances', { accounts: [acc('pen_self', 'Myself', 'Pensions', -300000, -12000, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', -80000, 0, 'High Risk'), acc('other_self', 'Myself', GIA, 0, 0, 'Medium Risk'), acc('cash_self', 'Myself', 'Cash Savings', 0, 0, 'Cash Equivalents')] });
  tryPlan('absurd magnitudes (1e12)', { accounts: [acc('pen_self', 'Myself', 'Pensions', 1e12, 1e9, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 1e12, 0, 'High Risk'), acc('other_self', 'Myself', GIA, 0, 0, 'Medium Risk'), acc('cash_self', 'Myself', 'Cash Savings', 0, 0, 'Cash Equivalents')] });
  tryPlan('strings where numbers go', { demographics: { currentAgeSelf: 'abc', salarySelf: 'lots' }, spending: { targetSpend: 'a bit' } });
  tryPlan('spend of zero', { spending: { targetSpend: 0 } });
  tryPlan('spend far above any pot', { spending: { targetSpend: 5000000 } });
  tryPlan('unknown risk tier', { accounts: [acc('pen_self', 'Myself', 'Pensions', 300000, 12000, 'Crypto Only'), acc('isa_self', 'Myself', 'S&S ISAs', 80000, 6000, 'High Risk'), acc('other_self', 'Myself', GIA, 40000, 0, 'Medium Risk'), acc('cash_self', 'Myself', 'Cash Savings', 20000, 0, 'Cash Equivalents')] });
  tryPlan('config with negative tax rates', { config: { basicTaxRate: -20, personalAllowance: -5000 } });
  tryPlan('age 17 retiring at 18 to 120', { demographics: { currentAgeSelf: 17, retireAgeSelf: 18, terminalAge: 120 } });
  // normalisation of junk shapes
  for (const [label, raw] of [['null', null], ['a string', 'plan'], ['an array', []], ['accounts not an array', { accounts: 'x' }], ['demographics a number', { demographics: 4 }]]) {
    try { const p = E.normalizePlan(raw); ok(`normalizePlan(${label}) returns a plan with accounts`, Array.isArray(p.accounts)); }
    catch (err) { ok(`normalizePlan(${label}) does not throw`, false, String(err && err.message).slice(0, 80)); }
  }
  // the solvers on a plan that cannot succeed
  try {
    const r = E.optimizeSpend(E.resolveMpaa(single({ accounts: [acc('pen_self', 'Myself', 'Pensions', 0, 0, 'High Risk'), acc('isa_self', 'Myself', 'S&S ISAs', 0, 0, 'High Risk'), acc('other_self', 'Myself', GIA, 0, 0, 'Medium Risk'), acc('cash_self', 'Myself', 'Cash Savings', 0, 0, 'Cash Equivalents')] })), { searchTrials: 100, finalTrials: 200 });
    ok('safe spend on an empty plan returns a figure or a note, not a throw', Number.isFinite(r.spend), `spend ${r.spend}, note ${r.stats && r.stats.note}`);
  } catch (err) { ok('safe spend on an empty plan does not throw', false, String(err && err.message).slice(0, 80)); }
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
if (findings.length) { console.log('\nFINDINGS'); findings.forEach(f => console.log(' - ' + f)); }
