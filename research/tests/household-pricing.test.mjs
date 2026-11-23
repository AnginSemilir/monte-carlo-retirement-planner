/*
 * THE HOUSEHOLD PLAN'S PRICE OF A PARTNER'S INCOME (research/solver/PRICING-FIX.md, candidate A; D143; the couples trade's
 * THE PRICING, results-couples-trade.txt). The household plan (src/solver/household.js householdPlanFor) taxes the
 * household's year on one schedule whose allowance and bands are k times one person's; at the form 'pensionsPA' the partner's
 * state pension and taxable incomes are moved onto the household person and taxed on that schedule, where the engine taxes
 * each person on their own income against their own allowance. At the form 'pensionsPAown' (candidate A) the partner's fixed
 * taxable income (their state pension and other taxable income, not an income typed as earnings) is taxed alone at one
 * person's rules, stacked on their taxable pay and earnings that year as the engine stacks it, and handed to the household
 * person net, tax-free.
 * The class: the library's 210 couples re-held 90/10 and 10/90 (every wrapper alike, so k is 10/9, below 1.2, as on the
 * couples trade's Y90 and E95 units; a partner's state pension), each in seven variants: as entered (both people's fixed
 * income within one allowance: the library's couples hold no other income); the partner given a DB pension of 15,000 a year
 * from the state pension age (their own income above one allowance); both given one; the partner given a DB pension of
 * 30,000 a year from their age now with the plan valued in July (plan year 0 on its fraction; the engine counts an income
 * from its owner's retirement at the earliest, so where the first person retires first the household's own floor would
 * count it earlier); the same with the partner retiring now (the pension paid from plan year 0, on its fraction); the
 * partner's DB pension of 15,000 with 8,000 a year of earnings for five years from the state pension age (an income typed as
 * earnings, which stays on the household person); and the partner working to two years past the state pension age (their
 * state pension on their pay). A household plan refused for its shape is left out.
 * Each plan year, year 0 on its fraction, the fixed incomes alone, no draw:
 *   1. as now ('pensionsPA'), in a year both are retired, the household plan's tax on its fixed taxable income (its scaled
 *      rules, the plan's own config) above the engine's tax on the two people's fixed incomes (each against their own
 *      allowance) in some year: the defect (the S037 class);
 *   2. under 'pensionsPAown', in every plan year: the household's fixed income (taxable and tax-free) as now less the
 *      partner's own tax on their fixed income at one person's rules, stacked on their taxable pay and earnings that year;
 *      its taxable part as now less the partner's fixed income; and the two household plans the same but for their incomes;
 *      each branch reached (a partner taxed on their own income, plan year 0 on a fraction under one, a year the partner
 *      works with such an income, a year with their earnings);
 *   3. under 'pensionsPAown', in every year both are retired: the household's tax on its fixed taxable income, plus the
 *      partner's own tax, less the engine's tax on the two people's fixed incomes, is what stays on the household's schedule
 *      (the first person's fixed income and the partner's earnings) taxed on its rules less on each person's own, to a penny;
 *      nought in every such year where the partner has no earnings and the first person's fixed income is within one
 *      allowance (some such years reached);
 *   4. as now ('pensionsPA'), in every plan year: the household plan's fixed income, less the later retiree's take-home, the
 *      engine's (the two people's fixed incomes, each counted from its owner's retirement at the earliest), to a penny; some
 *      years reached where the household's first retirement comes before an income's owner's and the income would start
 *      before that owner retires.
 * Plants (--planted runs each and wants exactly its checks to fail): 'partsp' (src/solver/household.js: the form read as
 * 'pensionsPA' for the partner's income, as before: checks 2 and 3); 'incfloor' (src/solver/household.js: each income moved
 * without its owner's floor, as before 23 Nov: checks 2 and 4).
 *   node research/tests/household-pricing.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { householdPlanFor, pensionsSplit, HOUSE } from '../../src/solver/household.js';
import { householdPlan } from '../../src/solverCouple.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['partsp', ['2', '3']], ['incfloor', ['2', '4']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, HOUSEHOLD_PRICING_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
HOUSE.plant = process.env.HOUSEHOLD_PRICING_PLANT || '';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const gbp = x => `£${(Math.round(x * 100) / 100).toLocaleString('en-GB')}`;
const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const fracOf = (ctx, t) => (t === 0 ? ctx.yf : 1);
/* a person's fixed income in plan year t as the engine reads it, on the year's fraction: `fixed` their state pension from
   the state pension age and each other taxable income not typed as earnings, `earn` those typed as earnings, `free` the
   tax-free ones */
const fixedOf = (ctx, key, t) => {
  const age = (key === 'self' ? ctx.ageSelf0 : ctx.agePart0) + t, o = ctx.owners.find(x => x.key === key), f = fracOf(ctx, t);
  let fixed = age >= ctx.spa ? o.statePension : 0, earn = 0, free = 0;
  for (const inc of ctx.otherIncomes) if (inc.owner === key && age >= inc.startAge && age <= inc.endAge) { if (inc.taxFree) free += inc.amount; else if (inc.isEarnings) earn += inc.amount; else fixed += inc.amount; }
  return { fixed: fixed * f, earn: earn * f, free: free * f, taxable: (fixed + earn) * f, all: (fixed + earn + free) * f };
};
/* a person's taxable pay in plan year t as the engine takes it (after a sacrifice into their pension), on its fraction */
const payOf = (ctx, key, t) => {
  const o = ctx.owners.find(x => x.key === key), age = (key === 'self' ? ctx.ageSelf0 : ctx.agePart0) + t;
  if (!(age < o.retireAge)) return 0;
  const pen = ctx.accounts.find(a => a.owner === key && a.cat === 'pen');
  return E.taxablePayOf(E.salaryAtYear(o, t), pen ? E.contribAtYear(pen, t) : 0, ctx.P, o.selfEmployed) * fracOf(ctx, t);
};
const reheld = (plan, f) => { const re = structuredClone(plan), tot = {};
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); tot[k] = (tot[k] || 0) + (Number(a.balance) || 0); }
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); if (/_self$/.test(a.id)) a.balance = tot[k] * f; else if (/_part$/.test(a.id)) a.balance = tot[k] * (1 - f); }
  return re; };
const DB = 15000, EARN = 8000;
const income = (id, owner, startAge, endAge, amount, incomeType) => ({ id, name: `${id} (the pricing test)`, owner, startAge, endAge, amount, incomeType, notes: '' });
const spaOf = p => E.num(p.demographics.statePensionAge, 68);
const VARIANTS = [
  ['as entered', p => p],
  ['the partner\'s DB pension', p => { p.otherIncomes = [...(p.otherIncomes || []), income('inc_db_part', 'Partner', spaOf(p), '', DB, 'otherTaxable')]; return p; }],
  ['both given a DB pension', p => { p.otherIncomes = [...(p.otherIncomes || []), income('inc_db_self', 'Myself', spaOf(p), '', DB, 'otherTaxable'), income('inc_db_part', 'Partner', spaOf(p), '', DB, 'otherTaxable')]; return p; }],
  ['the partner\'s DB pension from now, valued in July', p => { p.otherIncomes = [...(p.otherIncomes || []), income('inc_db_part', 'Partner', E.num(p.demographics.currentAgePart, 0), '', 2 * DB, 'otherTaxable')];
    p.config = { ...p.config, valuationDate: String((p.config && p.config.valuationDate) || '2026-01-01').slice(0, 4) + '-07-02' }; return p; }],
  ['the partner retiring now, their DB pension from now, valued in July', p => { const now = E.num(p.demographics.currentAgePart, 0);
    p.demographics = { ...p.demographics, retireAgePart: now }; p.otherIncomes = [...(p.otherIncomes || []), income('inc_db_part', 'Partner', now, '', 2 * DB, 'otherTaxable')];
    p.config = { ...p.config, valuationDate: String((p.config && p.config.valuationDate) || '2026-01-01').slice(0, 4) + '-07-02' }; return p; }],
  ['the partner\'s DB pension and earnings', p => { p.otherIncomes = [...(p.otherIncomes || []), income('inc_db_part', 'Partner', spaOf(p), '', DB, 'otherTaxable'), income('inc_earn_part', 'Partner', spaOf(p), spaOf(p) + 4, EARN, 'earnings')]; return p; }],
  ['the partner working past the state pension age', p => { p.demographics = { ...p.demographics, retireAgePart: spaOf(p) + 2 }; return p; }]
];
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple');
const cls = [], refused = {};
for (const c of couples) for (const f of [0.9, 0.1]) for (const [name, make] of VARIANTS) {
  const hp = householdPlan(E, make(reheld(c.plan, f))), k = pensionsSplit(E, hp).k;
  if (!(k < 1.2 && E.num(hp.demographics.statePensionPart, 0) > 0)) continue;
  try { cls.push({ id: `${c.id} held ${Math.round(100 * f)}/${Math.round(100 * (1 - f))}, ${name}`, variant: name, hp, now: householdPlanFor(E, hp, { scale: 'pensionsPA' }), own: householdPlanFor(E, hp, { scale: 'pensionsPAown' }) }); }
  catch (e) { if (!/^householdPlanFor: /.test(e.message)) throw e; refused[name] = (refused[name] || 0) + 1; }
}
let years = 0, retiredYears = 0, over = 0, worstOver = 0, cashBad = 0, worstCash = 0, taxableBad = 0, restBad = 0, resBad = 0, worstRes = 0, within = 0, withinBad = 0, timeBad = 0, floorBinds = 0;
const reach = { partTaxed: 0, yearZeroFrac: 0, partWorks: 0, partEarns: 0, selfAbove: 0 }; const first = [], firstTime = [];
for (const u of cls) {
  const cctx = ctxOf(u.hp), nctx = ctxOf(u.now), octx = ctxOf(u.own), T = cctx.totalYears;
  const strip = p => JSON.stringify({ ...p, otherIncomes: null });
  if (strip(u.now) !== strip(u.own)) { restBad++; if (first.length < 3) first.push(`${u.id}: the two household plans differ beyond their incomes`); }
  const retired = t => cctx.owners.every(o => (o.key === 'self' ? cctx.ageSelf0 : cctx.agePart0) + t >= o.retireAge);
  const ageA = cctx.ageSelf0, takeHome = t => u.now.otherIncomes.filter(i => /^inc_house_takehome_/.test(i.id) && Number(i.startAge) === ageA + t).reduce((x, i) => x + Number(i.amount), 0) * fracOf(nctx, t);
  // the years the household's first retirement comes before an income's owner's and the income would start before then
  const firstRetire = Math.min(...cctx.owners.map(o => o.retireAge - (o.key === 'self' ? cctx.ageSelf0 : cctx.agePart0)));
  for (const i of u.hp.otherIncomes || []) { const o = cctx.owners.find(x => x.key === (i.owner === 'Partner' ? 'part' : 'self')), age0 = o.key === 'self' ? cctx.ageSelf0 : cctx.agePart0;
    if (E.num(i.startAge, 0) < o.retireAge && firstRetire < o.retireAge - age0) floorBinds++; }
  for (let t = 0; t <= T; t++) {
    const A = fixedOf(cctx, 'self', t), B = fixedOf(cctx, 'part', t), N = fixedOf(nctx, 'self', t), O = fixedOf(octx, 'self', t);
    const payB = payOf(cctx, 'part', t), base = payB + B.earn, partTax = E.incomeTax(base + B.fixed, cctx.P) - E.incomeTax(base, cctx.P);
    years++;
    if (partTax > 0.005) { reach.partTaxed++; if (t === 0 && cctx.yf < 1) reach.yearZeroFrac++; if (payB > 0) reach.partWorks++; }
    if (B.earn > 0 && B.fixed > 0) reach.partEarns++;
    // 2. the cash as now less the partner's own tax; the taxable part as now less the partner's fixed income
    const cash = O.all - (N.all - partTax), taxable = O.taxable - (N.taxable - B.fixed);
    if (Math.abs(cash) > 0.005) { cashBad++; worstCash = Math.max(worstCash, Math.abs(cash)); if (first.length < 3) first.push(`${u.id} year ${t}: the cash off by ${gbp(cash)}`); }
    if (Math.abs(taxable) > 0.005) { taxableBad++; if (first.length < 3) first.push(`${u.id} year ${t}: the taxable income off by ${gbp(taxable)}`); }
    // 4. as now, the household's fixed income less the take-home the engine's, year by year
    const timing = (N.all - takeHome(t)) - (A.all + B.all);
    if (Math.abs(timing) > 0.005) { timeBad++; if (firstTime.length < 3) firstTime.push(`${u.id} year ${t}: the household plan ${gbp(N.all - takeHome(t))}, the engine ${gbp(A.all + B.all)}`); }
    if (!retired(t)) continue;
    retiredYears++; if (A.taxable > E.num(cctx.P.pa, 0)) reach.selfAbove++;
    const engine = E.incomeTax(A.taxable, cctx.P) + E.incomeTax(B.taxable, cctx.P);
    // 1. as now, above the engine's
    const tNow = E.incomeTax(N.taxable, nctx.P);
    if (tNow - engine > 0.005) { over++; worstOver = Math.max(worstOver, tNow - engine); }
    // 3. under A: what stays on the household's schedule, on its rules less on each person's own
    const tOwn = E.incomeTax(O.taxable, octx.P), stays = E.incomeTax(A.taxable + B.earn, octx.P) - E.incomeTax(A.taxable, cctx.P) - E.incomeTax(B.earn, cctx.P);
    const residual = (tOwn + partTax - engine) - stays;
    if (Math.abs(residual) > 0.005) { resBad++; worstRes = Math.max(worstRes, Math.abs(residual)); if (first.length < 3) first.push(`${u.id} year ${t}: the household's tax off by ${gbp(residual)}`); }
    if (B.earn === 0 && A.taxable <= E.num(cctx.P.pa, 0)) { within++; if (Math.abs(tOwn + partTax - engine) > 0.005) withinBad++; }
  }
}
const byVariant = VARIANTS.map(([v]) => `${v} ${cls.filter(u => u.variant === v).length}${refused[v] ? ` (${refused[v]} refused for their shape)` : ''}`).join('; ');
console.log(`the class: ${cls.length} household plans of the library's ${couples.length} couples re-held 90/10 and 10/90 (k below 1.2, a partner's state pension): ${byVariant}; ${years} plan years, ${retiredYears} with both retired`);
console.log(`reached: the partner taxed on their own fixed income in ${reach.partTaxed} years, ${reach.yearZeroFrac} of them plan year 0 on a fraction under one and ${reach.partWorks} with the partner working; the partner's earnings beside their fixed income in ${reach.partEarns}; the first person's fixed income above one allowance, both retired, in ${reach.selfAbove}`);
ok('1. as now (\'pensionsPA\'), the household plan taxes the fixed incomes above the engine\'s two-person tax in some year both are retired (the defect)', cls.length > 0 && over > 0,
  `${over} of ${retiredYears} years above it, the most ${gbp(worstOver)} a year`);
ok('2. under \'pensionsPAown\', in every plan year, the household\'s fixed income as now less the partner\'s own tax on their fixed income, stacked on their taxable pay and earnings; its taxable part as now less the partner\'s fixed income; the two plans the same but for their incomes; each branch reached',
  years > 0 && cashBad === 0 && taxableBad === 0 && restBad === 0 && Object.values(reach).every(n => n > 0),
  `${cashBad} years off in cash (the most ${gbp(worstCash)}), ${taxableBad} in taxable income, plans differing beyond their incomes ${restBad}${first.length ? ` (${first.join('; ')})` : ''}`);
ok('3. under \'pensionsPAown\', in every year both are retired, the household\'s tax plus the partner\'s own, less the engine\'s, is what stays on the household\'s schedule on its rules less on each person\'s own; nought where the partner has no earnings and the first person\'s fixed income is within one allowance',
  retiredYears > 0 && resBad === 0 && within > 0 && withinBad === 0, `${resBad} years off (the most ${gbp(worstRes)}); ${within} years with no earnings and the first person within one allowance, ${withinBad} of them not nought`);
ok('4. as now (\'pensionsPA\'), in every plan year, the household plan\'s fixed income less the later retiree\'s take-home the engine\'s, each income from its owner\'s retirement at the earliest; some incomes reached that would start before their owner retires, after the household\'s first retirement',
  years > 0 && timeBad === 0 && floorBinds > 0, `${timeBad} years off${firstTime.length ? ` (${firstTime.join('; ')})` : ''}; ${floorBinds} such incomes`);
console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
