/*
 * THE HOUSEHOLD PLAN TAKES THE SHAPES IT REFUSED (research/solver/STEP4-SHAPES.md; COUPLES-OPEN.md step 4; D139, D141). Each
 * shape householdPlanFor (src/solver/household.js) refused is taken only where opts.takeShapes names it, off unless named:
 *   1. the option names a shape the plan has not: the household plan is the one built without the option, byte for byte, on
 *      every library couple, as handed over and on its mirror (the option changes nothing where its shape is absent);
 *   2. the shape 'growth' (the two people's contributions to one wrapper growing at different rates): on the library's couples
 *      who both work at the start, given each person's S&S ISA contribution at their own growth (the first person's rising 3% a
 *      year, the partner's flat) and the same of their pensions: refused without the option; with it, in every plan year
 *      before the first retirement the household's contribution to each wrapper (its context's contribAtYear) the couple's two
 *      people's added (theirs), to a penny, and from the first retirement the household's own none and the later retiree's
 *      deposits the couple's later retiree's contributions, to a penny; some plans of each wrapper reached;
 *   3. the shape 'year0' (a later retiree paid or saving in plan year 0): on the library's couples whose first person is
 *      retired at the start and whose partner works on, the partner given a salary of 30,000 (at the first person's salary
 *      growth), a pension contribution of 3,000 and an S&S ISA contribution of 2,000, the plan valued in July: refused without
 *      the option; with it, in plan year 0 the household's take-home income on the year's fraction the engine's own working
 *      take-home that year (E.stepYear's workingTakeHome on the couple), and that year's deposits the couple's contributions
 *      as the engine pro-rates them (contribAtYear x the fraction), to a penny; from plan year 1, each year's deposits the
 *      couple's contributions whole;
 *   4. the shape 'cashisa' (a cash ISA subscription): on the library's couples who both work at the start, each person given a
 *      cash ISA subscription of 2,000 a year, and again unevenly, the first person 15,000 and the partner 5,000 (above the
 *      first person's own cash ISA cap where the engine caps an under-65's, below the household's doubled one): refused
 *      without the option; with it, the household's subscription the two
 *      added and, in every plan year before the first retirement, the household's cash contribution the couple's two people's
 *      added (their cash ISA money folded in, as the engine folds it), to a penny; and each such year the household's
 *      subscription, priced by the engine's own allowances (its cash ISA cap at the first person's age, its ISA allowance
 *      less that year's ISA contributions), equal to the two people's own added wherever no one person's own limit binds;
 *      the years where one binds counted (some reached) and sized, and beside them, the later retiree's subscriptions after the
 *      first retirement, which the household plan does not make (their money lands in its cash; whether the engine's year-end
 *      step shelters it within the household's own cap is not measured here).
 * Plants (--planted runs each and wants exactly its checks to fail): 'shapesched' (src/solver/household.js: the schedule the
 * first person's contributions alone: checks 2 and 4, the shape 'cashisa' carrying its cash on the same schedule); 'year0whole' (the year-0 deposits at the whole year's contribution: check 3);
 * 'cashisasum' (the household's subscription the first person's alone: check 4).
 *   node research/tests/household-shapes.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { householdPlanFor, HOUSE } from '../../src/solver/household.js';
import { householdPlan } from '../../src/solverCouple.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['shapesched', ['2', '4']], ['year0whole', ['3']], ['cashisasum', ['4']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, HOUSEHOLD_SHAPES_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
HOUSE.plant = process.env.HOUSEHOLD_SHAPES_PLANT || '';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const gbp = x => `£${(Math.round(x * 100) / 100).toLocaleString('en-GB')}`;
const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const built = (p, opts) => { try { return householdPlanFor(E, p, opts); } catch (e) { if (/^householdPlanFor: /.test(e.message)) return null; throw e; } };
const couples = buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple');
const ALL = { takeShapes: true };

// 1. the option changes nothing where its shape is absent
{ let n = 0, bad = 0; const first = [];
  for (const c of couples) for (const [order, p0] of [['as handed over', c.plan], ['its mirror', otherOrder(E, c.plan)]]) {
    const hp = householdPlan(E, p0), without = built(hp, { scale: 'pensionsPA' });
    if (!without) continue;
    n++; const withAll = built(hp, { scale: 'pensionsPA', ...ALL });
    if (JSON.stringify(withAll) !== JSON.stringify(without)) { bad++; if (first.length < 3) first.push(`${c.id} (${order})`); }
  }
  ok('1. the option names every shape, on a plan with none of them: the household plan the one built without the option, byte for byte, on every library couple as handed over and on its mirror',
    n > 0 && bad === 0, `${n} household plans, ${bad} differing${first.length ? ` (${first.join('; ')})` : ''}`); }

// 2. the shape 'growth': each person's contribution to a wrapper at their own growth
const CATS = { isa: 'S&S ISAs', pen: 'Pensions' };
const withGrowths = (plan, cat) => {
  const p = structuredClone(plan);
  for (const a of p.accounts) if (a.category === CATS[cat]) {
    const mine = a.owner === 'Myself';
    a.contrib = Math.max(E.num(a.contrib, 0), mine ? 3000 : 2000);
    a.growth = mine ? 3 : 0;
  }
  return p;
};
{ let refusedBefore = 0, taken = 0, years = 0, off = 0, worst = 0, lateBad = 0; const reach = { isa: 0, pen: 0 }; const first = [];
  for (const c of couples) for (const cat of Object.keys(CATS)) {
    const hp = householdPlan(E, withGrowths(c.plan, cat)), cctx = ctxOf(hp);
    const age0 = k => (k === 'self' ? cctx.ageSelf0 : cctx.agePart0), owner = k => cctx.owners.find(o => o.key === k);
    const working = (k, t) => age0(k) + t < owner(k).retireAge;
    if (!(working('self', 0) && working('part', 0))) continue;
    const before = built(hp, { scale: 'pensionsPA' }), after = built(hp, { scale: 'pensionsPA', takeShapes: ['growth'] });
    if (!before) refusedBefore++;
    if (!after) continue;
    taken++; if (!before) reach[cat]++;
    const hctx = ctxOf(after), T = cctx.totalYears;
    let tR = 0; while (tR <= T && working('self', tR) && working('part', tR)) tR++;
    const hAcc = hctx.accounts.find(a => a.cat === cat), cAccs = cctx.accounts.filter(a => a.cat === cat);
    for (let t = 0; t <= T; t++) {
      years++;
      const theirs = cAccs.reduce((s, a) => s + (working(a.owner, t) ? E.contribAtYear(a, t) : 0), 0);
      if (t < tR) {
        const ours = hAcc ? E.contribAtYear(hAcc, t) : 0, gap = ours - theirs;
        if (Math.abs(gap) > 0.005) { off++; worst = Math.max(worst, Math.abs(gap)); if (first.length < 3) first.push(`${c.id} ${cat} year ${t}: the household ${gbp(ours)}, the couple ${gbp(theirs)}`); }
      } else {
        // from the first retirement: the household person is retired (no contribution of its own); the later retiree's as deposits
        const year = cctx.baseYear + t, dep = (after.oneOffContributions || []).filter(x => x.year === year && x.category === CATS[cat] && /^dep_house_/.test(x.id)).reduce((s, x) => s + x.amount, 0);
        if (Math.abs(dep - theirs) > 0.005) { lateBad++; if (first.length < 3) first.push(`${c.id} ${cat} year ${t}: the deposits ${gbp(dep)}, the later retiree's ${gbp(theirs)}`); }
      }
    }
  }
  ok('2. the shape \'growth\': refused without the option; with it, each plan year before the first retirement the household\'s contribution to the wrapper the couple\'s two people\'s added, and from the first retirement the later retiree\'s as deposits, to a penny; plans of each wrapper reached',
    taken > 0 && refusedBefore > 0 && off === 0 && lateBad === 0 && reach.isa > 0 && reach.pen > 0,
    `${taken} plans taken (${refusedBefore} refused without the option; reached: S&S ISA ${reach.isa}, pension ${reach.pen}), ${years} plan years: ${off} years apart before the first retirement (the most ${gbp(worst)}), ${lateBad} after it${first.length ? ` (${first.join('; ')})` : ''}`); }

// 3. the shape 'year0': a later retiree paid and saving in plan year 0, the plan valued in July
const PEN = 'Pensions', ISA = 'S&S ISAs';
const laterInYear0 = plan => {
  const p = structuredClone(plan), d = p.demographics;
  d.salaryPart = 30000; d.salaryGrowthPart = d.salaryGrowthSelf;
  for (const a of p.accounts) if (a.owner === 'Partner' && (a.category === PEN || a.category === ISA)) { a.contrib = a.category === PEN ? 3000 : 2000; a.growth = 0; }
  p.config = { ...p.config, valuationDate: String((p.config && p.config.valuationDate) || '2026-01-01').slice(0, 4) + '-07-02' };
  return p;
};
{ let refusedBefore = 0, taken = 0, y0 = 0, homeBad = 0, depBad = 0, laterBad = 0, worst = 0, part = 0; const fracs = [], first = [];
  for (const c of couples) {
    const hp = householdPlan(E, laterInYear0(c.plan)), cctx = ctxOf(hp);
    const age0 = k => (k === 'self' ? cctx.ageSelf0 : cctx.agePart0), owner = k => cctx.owners.find(o => o.key === k);
    const working = (k, t) => age0(k) + t < owner(k).retireAge;
    if (working('self', 0) || !working('part', 0)) continue;
    const before = built(hp, { scale: 'pensionsPA' }), after = built(hp, { scale: 'pensionsPA', takeShapes: ['year0'] });
    if (!before) refusedBefore++;
    if (!after || before) continue;
    taken++;
    const f = cctx.yf, T = cctx.totalYears;
    fracs.push(f); if (f < 1) part++;
    // the engine's own working take-home in plan year 0 (E.stepYear on the couple, a path of nought)
    const row = E.stepYear(cctx, E.freshState(cctx), 0, { z: 0, zPath: 0 });
    const ours = (after.otherIncomes || []).filter(i => /^inc_house_takehome_part_0$/.test(i.id)).reduce((x, i) => x + Number(i.amount), 0) * f;
    y0++; const gap = ours - row.workingTakeHome;
    if (Math.abs(gap) > 0.005) { homeBad++; worst = Math.max(worst, Math.abs(gap)); if (first.length < 3) first.push(`${c.id}: the household's year-0 take-home ${gbp(ours)}, the engine's ${gbp(row.workingTakeHome)}`); }
    for (let t = 0; t <= T; t++) {
      if (!working('part', t)) continue;
      const year = cctx.baseYear + t, dep = (after.oneOffContributions || []).filter(x => x.year === year && /^dep_house_/.test(x.id)).reduce((x, d) => x + d.amount, 0);
      const theirs = cctx.accounts.filter(a => a.owner === 'part').reduce((x, a) => x + E.contribAtYear(a, t), 0) * (t === 0 ? f : 1);
      if (Math.abs(dep - theirs) > 0.005) { if (t === 0) depBad++; else laterBad++; if (first.length < 3) first.push(`${c.id} year ${t}: the deposits ${gbp(dep)}, the couple's ${gbp(theirs)}`); }
    }
  }
  ok('3. the shape \'year0\': refused without the option; with it, the household\'s year-0 take-home on the year\'s fraction the engine\'s own working take-home, and its year-0 deposits the couple\'s contributions as the engine pro-rates them, to a penny; the years after whole',
    taken > 0 && refusedBefore > 0 && part > 0 && homeBad === 0 && depBad === 0 && laterBad === 0,
    `${taken} plans taken (${refusedBefore} refused without the option), ${part} of them with plan year 0 a fraction under one (${fracs.length ? `${Math.min(...fracs).toFixed(4)} to ${Math.max(...fracs).toFixed(4)}` : 'none'}): year-0 take-home ${homeBad} apart (the most ${gbp(worst)}), year-0 deposits ${depBad} apart, later years ${laterBad} apart${first.length ? ` (${first.join('; ')})` : ''}`); }

// 4. the shape 'cashisa': each person's cash ISA subscription
const CASHISA = 'Cash ISA', SUBS = [['even', 2000, 2000], ['uneven', 15000, 5000]];
const withSubs = (plan, mine, theirs) => { const p = structuredClone(plan); for (const a of p.accounts) if (a.category === CASHISA) a.contrib = a.owner === 'Myself' ? mine : theirs; return p; };
{ let refusedBefore = 0, taken = 0, inputBad = 0, flowYears = 0, flowBad = 0, years = 0, apartFree = 0, binds = 0, apartBinds = 0, worstBind = 0, later = 0, laterAmt = 0; const first = [];
  for (const c of couples) for (const [, mine, theirs] of SUBS) {
    const hp = householdPlan(E, withSubs(c.plan, mine, theirs)), cctx = ctxOf(hp);
    const age0 = k => (k === 'self' ? cctx.ageSelf0 : cctx.agePart0), owner = k => cctx.owners.find(o => o.key === k);
    const working = (k, t) => age0(k) + t < owner(k).retireAge;
    if (!(working('self', 0) && working('part', 0)) || !(owner('self').cashIsaContrib > 0 && owner('part').cashIsaContrib > 0)) continue;
    const before = built(hp, { scale: 'pensionsPA' }), after = built(hp, { scale: 'pensionsPA', takeShapes: ['cashisa'] });
    if (!before) refusedBefore++;
    if (!after || before) continue;
    taken++;
    const hctx = ctxOf(after), T = cctx.totalYears, ho = hctx.owners.find(o => o.key === 'self');
    const sumSub = owner('self').cashIsaContrib + owner('part').cashIsaContrib;
    if (Math.abs(ho.cashIsaContrib - sumSub) > 0.005) { inputBad++; if (first.length < 3) first.push(`${c.id}: the household's subscription ${gbp(ho.cashIsaContrib)}, the two ${gbp(sumSub)}`); }
    let tR = 0; while (tR <= T && working('self', tR) && working('part', tR)) tR++;
    const hCash = hctx.accounts.find(a => a.cat === 'cash'), hIsa = hctx.accounts.filter(a => a.cat === 'isa');
    for (let t = 0; t <= T; t++) {
      const f = t === 0 ? cctx.yf : 1, year = cctx.baseYear + t;
      if (t >= tR) { for (const k of ['self', 'part']) if (working(k, t) && owner(k).cashIsaContrib > 0) { later++; laterAmt += owner(k).cashIsaContrib * f; } continue; }
      // the money flows: the household's cash contribution the couple's two (their cash ISA money folded in)
      flowYears++;
      const theirs = cctx.accounts.filter(a => a.cat === 'cash').reduce((x, a) => x + E.contribAtYear(a, t), 0), ours = hCash ? E.contribAtYear(hCash, t) : 0;
      if (Math.abs(ours - theirs) > 0.005) { flowBad++; if (first.length < 3) first.push(`${c.id} year ${t}: the household's cash contribution ${gbp(ours)}, the couple's ${gbp(theirs)}`); }
      // the subscription each priced by the engine's own allowances (its cash ISA cap at the person's own age, the ISA allowance
      // less that year's ISA contributions), the path's cash left out (it binds only where cash runs short)
      years++;
      const roomOf = (P, age, isaUsed) => Math.min(P.cashIsaCapAt(age, year), Math.max(0, P.isaAllowance - isaUsed));
      let sumK = 0, bound = false;
      for (const k of ['self', 'part']) {
        const isaUsed = cctx.accounts.filter(a => a.cat === 'isa' && a.owner === k).reduce((x, a) => x + E.contribAtYear(a, t) * f, 0);
        const want = owner(k).cashIsaContrib * f, room = roomOf(cctx.P, age0(k) + t, isaUsed);
        if (want > room + 1e-9) bound = true;
        sumK += Math.min(want, room);
      }
      const hIsaUsed = hIsa.reduce((x, a) => x + E.contribAtYear(a, t) * f, 0), hWant = ho.cashIsaContrib * f, hRoom = roomOf(hctx.P, hctx.ageSelf0 + t, hIsaUsed);
      if (hWant > hRoom + 1e-9) bound = true;
      const gap = Math.min(hWant, hRoom) - sumK;
      if (bound) { binds++; if (Math.abs(gap) > 0.005) { apartBinds++; worstBind = Math.max(worstBind, Math.abs(gap)); } }
      else if (Math.abs(gap) > 0.005) { apartFree++; if (first.length < 3) first.push(`${c.id} year ${t}: no limit binds, the household subscribes ${gbp(Math.min(hWant, hRoom))}, the two ${gbp(sumK)}`); }
    }
  }
  ok('4. the shape \'cashisa\': refused without the option; with it, the household\'s subscription the two added, its cash contribution the couple\'s two each year before the first retirement, and its subscription the two people\'s own wherever no one person\'s limit binds; the years a limit binds and the later retiree\'s subscriptions after the first retirement counted',
    taken > 0 && refusedBefore > 0 && inputBad === 0 && flowBad === 0 && apartFree === 0 && years > binds && binds > 0,
    `${taken} plans taken (${refusedBefore} refused without the option): subscriptions summed apart on ${inputBad}; ${flowYears} working years, the cash contribution apart on ${flowBad}; the subscription apart on ${apartFree} of the ${years - binds} years where no limit binds; a limit binds in ${binds} years, the subscription apart in ${apartBinds} of them (the most ${gbp(worstBind)}); beside: the later retiree's subscriptions after the first retirement, ${later} years, ${gbp(laterAmt)} in all, not made by the household plan${first.length ? ` (${first.join('; ')})` : ''}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
