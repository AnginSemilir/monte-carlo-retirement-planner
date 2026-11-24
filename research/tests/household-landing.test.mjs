/*
 * THE LATER RETIREE'S SAVING, AND DATED SCHEDULES, IN THE HOUSEHOLD PLAN (the reviewer on step 4's change of default,
 * research/solver/reviews/2026-11-23-default-step4-shapes.md, findings 1 and 6; CHECKLIST 7: each a defect on main since
 * D136, fixed with a test of its class, src/solver/household.js householdPlanFor and the engine's one-off deposit ledger,
 * src/App.jsx buildContext). The household plan writes the later retiree's contributions from the first retirement as dated
 * deposits of the household person; the engine claimed each against that person's pension room (its no-earnings limit, its
 * MPAA once it draws, nothing from the first person's 75) and sent the rest to the GIA, where the couple's own run lands the
 * same money whole, as a regular contribution, which no allowance caps. Since the fix those deposits are marked
 * `asContribution` and land whole, claiming no room. And where two people's accounts of one wrapper carry dated schedules
 * (contribByYear, the app's phased strategy), the merged account kept the first account's schedule alone; it now carries the
 * two added year by year.
 *   1. what lands: on the library's couples made into later-retiree shapes (the first person retired and the partner still
 *      paid and saving, from plan year 0 and from a later year; the partner saving above the household's doubled MPAA with
 *      the first person drawing; the first person past 75; the plan's own Auto windfall in a year the partner saves), each
 *      handed to the household cut as the page hands it (its mirror where the elder is entered second): every contribution of
 *      the later retiree's the household plan lists lands whole in its wrapper in its year in the household plan's own engine
 *      context (buildContext's ledger: direct, its whole amount, none to the GIA, none staged), and in every plan year the
 *      household's contributions into each wrapper (its regular contribution while it works, then those deposits) are the
 *      couple's two people's (each person's regular contribution while they work, plan year 0 on its fraction), to a penny;
 *   2. dated schedules: on the library's couples with both people paying into their pensions and ISAs on dated schedules
 *      (the same growth field, different growth fields, one dated and the other flat, one dated and the other not paying), the
 *      household's contribution to each wrapper in every plan year before the first retirement is the couple's two added, to
 *      a penny;
 *   3. a plan with neither shape is the code before's: on every panel run on the household route and the library's couples,
 *      both ways round, the household plan differs from its build under both plants together (the code before) by the later
 *      retiree's deposits' mark alone;
 *   4. each check shown failing on its plant (src/solver/household.js HOUSE.plant): 'roomclaim' (the deposits unmarked, claimed
 *      against the household person's room as before) fails check 1; 'firstsched' (the first account's schedule kept) fails
 *      check 2.
 *   node research/tests/household-landing.test.mjs
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { householdCut, householdPlan } from '../../src/solverCouple.js';
import { householdPlanFor, HOUSE } from '../../src/solver/household.js';
import { APP_COUPLE } from '../../src/solverSettings.js';
import { swapOf } from '../../src/couplesSwitch.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readOpenPanel } from '../solver/couples-open-panel.mjs';
import { readHspPanel } from '../solver/household-hsp-panel.mjs';
import { readShapesPanel } from '../solver/shapes-panel.mjs';
import { fileURLToPath } from 'node:url';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const lib = buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple');
const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
const CATS = ['pen', 'isa', 'other', 'cash'];
const setAcct = (p, id, patch) => { const a = p.accounts.find(x => x.id === id); if (!a) return false; Object.assign(a, patch); return true; };
const demo = (p, patch) => Object.assign(p.demographics, patch);
const ageOf = (p, k) => E.num(k === 'self' ? p.demographics.currentAgeSelf : p.demographics.currentAgePart, 40);

/* the page's cut of a plan: the household plan and the couple's own plan it was cut from, or null where it refuses the shape */
function cutOf(plan) {
  const handed = swapOf(plan) ? otherOrder(E, plan) : plan;
  try { const c = householdCut(E, M, handed, APP_COUPLE.household); return { hplan: c.hplan, couple: c.household }; }
  catch (e) { if (/^householdPlanFor: (?!opts\.|no group)/.test(e.message)) return null; throw e; }
}
/* check 1 on one plan: each listed later-retiree deposit's landing, and the household's contributions against the couple's */
function landing(plan) {
  const c = cutOf(plan); if (!c) return null;
  const hctx = ctxOf(c.hplan), cctx = ctxOf(c.couple), T = cctx.totalYears;
  const deps = (c.hplan.oneOffContributions || []).filter(x => /^dep_house_/.test(x.id));
  let short = 0, shortBy = 0; const first = [];
  const landed = {};   // `${cat}|${t}` -> the later retiree's deposits landed in that wrapper that year
  for (const d of deps) {
    const s = hctx.oneOffStaging.get(d.id), cat = Object.keys(E.CATEGORY_LABEL).find(k => E.CATEGORY_LABEL[k] === d.category), t = E.num(d.year, NaN) - hctx.baseYear;
    const into = s ? (s.direct ? s.amount : s.H0) : 0;
    if (!s || !s.direct || Math.abs(into - d.amount) > 0.005) { short++; shortBy += d.amount - into; if (first.length < 2) first.push(`${d.id} £${Math.round(into)} of £${Math.round(d.amount)}`); }
    landed[`${cat}|${t}`] = (landed[`${cat}|${t}`] || 0) + into;
  }
  // the regular contributions each context lands: an owner's while they work, plan year 0 on its fraction (engine step 2)
  const regular = (ctx, cat, t) => ctx.accounts.filter(a => a.cat === cat && ctx.owners.find(o => o.key === a.owner) && (ctx.owners.find(o => o.key === a.owner).age0 + t) < ctx.owners.find(o => o.key === a.owner).retireAge)
    .reduce((x, a) => x + E.contribAtYear(a, t) * (t === 0 ? ctx.yf : 1), 0);
  let apart = 0, worst = 0, years = 0;
  for (let t = 0; t <= T; t++) for (const cat of CATS) {
    const hh = regular(hctx, cat, t) + (landed[`${cat}|${t}`] || 0), cp = regular(cctx, cat, t);
    if (hh || cp) years++;
    const gap = Math.abs(hh - cp); if (gap > 0.005) { apart++; worst = Math.max(worst, gap); }
  }
  return { deps: deps.length, short, shortBy, first, apart, worst, years };
}
/* the later-retiree shapes made on a library couple's plan */
function laterShapes(base) {
  const a = ageOf(base, 'self'), b = ageOf(base, 'part'), out = [];
  const mk = (label, f) => { const p = structuredClone(base); if (f(p) !== false) out.push([label, p]); };
  // the first person retired, the partner paid and saving: from plan year 0 ('year0'), and from a later year
  mk('year0: the first person retired, the partner paid and saving', p => { demo(p, { retireAgeSelf: a, retireAgePart: b + 4, salaryPart: 30000 }); setAcct(p, 'pen_part', { contrib: 4000, growth: 0 }); setAcct(p, 'isa_part', { contrib: 2000, growth: 0 }); });
  mk('later: both working, the first person retiring in two years, the partner in six', p => { demo(p, { retireAgeSelf: a + 2, retireAgePart: b + 6, salarySelf: 25000, salaryPart: 30000, salaryGrowthSelf: 0, salaryGrowthPart: 0 }); setAcct(p, 'pen_part', { contrib: 5000, growth: 2 }); setAcct(p, 'pen_self', { contrib: 0 }); });
  // the partner saving above the household's doubled MPAA, the first person drawing from now
  mk('above the MPAA: the first person 66 drawing, the partner 58 paid £120,000 paying £35,000', p => { demo(p, { currentAgeSelf: 66, retireAgeSelf: 66, currentAgePart: 58, retireAgePart: 63, salaryPart: 120000, terminalAge: 95 }); setAcct(p, 'pen_part', { contrib: 35000, growth: 0 }); });
  // the first person past 75, a younger partner paying into a pension
  mk('past 75: the first person 76, the partner 62 paid £40,000 paying £5,000', p => { demo(p, { currentAgeSelf: 76, retireAgeSelf: 66, currentAgePart: 62, retireAgePart: 66, salaryPart: 40000, terminalAge: 100 }); setAcct(p, 'pen_part', { contrib: 5000, growth: 0 }); });
  // the plan's own Auto windfall in a year the partner saves
  mk('a windfall: the first person retired, the partner saving, an Auto deposit of £81,000 in plan year 2', p => {
    demo(p, { retireAgeSelf: a, retireAgePart: b + 6, salaryPart: 45000 }); setAcct(p, 'pen_part', { contrib: 8000, growth: 0 });
    p.oneOffContributions = [...(p.oneOffContributions || []), { id: 'dep_landing_windfall', year: E.num(p.baseYear, new Date().getFullYear()) + 2, owner: 'Myself', category: 'Auto (policy decides)', amount: 81000, transferredFrom: 'External', desc: 'a windfall (household-landing.test.mjs)' }];
  });
  return out;
}
function landingBattery(cs) {
  const per = {}; let plans = 0, refused = 0;
  for (const c of cs) for (const [label, p] of laterShapes(c.plan)) {
    const r = landing(p); if (!r) { refused++; continue; } plans++;
    const k = label.split(':')[0], x = per[k] || (per[k] = { plans: 0, deps: 0, short: 0, shortBy: 0, apart: 0, worst: 0, years: 0, first: [] });
    x.plans++; x.deps += r.deps; x.short += r.short; x.shortBy += r.shortBy; x.apart += r.apart; x.worst = Math.max(x.worst, r.worst); x.years += r.years; if (x.first.length < 2) x.first.push(...r.first.map(f => `${c.id} ${f}`));
  }
  return { per, plans, refused };
}
const landingHolds = B => B.plans > 0 && Object.values(B.per).every(x => x.deps > 0 && x.short === 0 && x.apart === 0);
const landingSaid = B => `${B.plans} plans (${B.refused} refused for another shape): ${Object.entries(B.per).map(([k, x]) => `${k} ${x.plans} plans, ${x.deps} deposits, ${x.short} short by £${Math.round(x.shortBy)}, ${x.apart} of ${x.years} wrapper-years apart (worst £${x.worst.toFixed(2)})`).join('; ')}`;

/* check 2: both people on dated schedules */
function datedShapes(base) {
  const a = ageOf(base, 'self'), b = ageOf(base, 'part'), out = [];
  const sched = (x0, step) => Array.from({ length: 12 }, (_, i) => x0 + step * i);
  const both = p => demo(p, { retireAgeSelf: a + 5, retireAgePart: b + 7, salarySelf: 40000, salaryPart: 30000, salaryGrowthSelf: 0, salaryGrowthPart: 0 });
  const mk = (label, pen, isa) => { const p = structuredClone(base); both(p); for (const [id, q] of [...pen, ...isa]) setAcct(p, id, q); out.push([label, p]); };
  mk('the same growth field', [['pen_self', { contrib: 5000, growth: 0, contribByYear: sched(5000, 1000) }], ['pen_part', { contrib: 3000, growth: 0, contribByYear: sched(3000, 0) }]], [['isa_self', { contrib: 2000, growth: 0, contribByYear: sched(2000, 500) }], ['isa_part', { contrib: 1000, growth: 0, contribByYear: sched(1000, 250) }]]);
  mk('different growth fields', [['pen_self', { contrib: 5000, growth: 0, contribByYear: sched(5000, 1000) }], ['pen_part', { contrib: 3000, growth: 2, contribByYear: sched(3000, 0) }]], []);
  mk('the first dated, the partner flat', [['pen_self', { contrib: 5000, growth: 0, contribByYear: sched(5000, 1000) }], ['pen_part', { contrib: 3000, growth: 0 }]], []);
  mk('the partner dated, the first flat', [['pen_self', { contrib: 5000, growth: 0 }], ['pen_part', { contrib: 3000, growth: 0, contribByYear: sched(3000, 500) }]], []);
  mk('the partner dated, the first not paying', [['pen_self', { contrib: 0, growth: 0 }], ['pen_part', { contrib: 3000, growth: 0, contribByYear: sched(3000, 500) }]], []);
  return out;
}
function datedBattery(cs) {
  let plans = 0, refused = 0, apart = 0, years = 0, worst = 0; const first = [];
  for (const c of cs) for (const [label, p] of datedShapes(c.plan)) {
    const cut = cutOf(p); if (!cut) { refused++; continue; } plans++;
    const hctx = ctxOf(cut.hplan), cctx = ctxOf(cut.couple), T = cctx.totalYears;
    const own = k => cctx.owners.find(o => o.key === k), working = (k, t) => own(k).age0 + t < own(k).retireAge;
    let tR = 0; while (tR <= T && working('self', tR) && working('part', tR)) tR++;
    for (let t = 0; t < Math.min(tR, T + 1); t++) for (const cat of ['pen', 'isa']) {
      const hh = hctx.accounts.filter(a => a.cat === cat).reduce((x, a) => x + E.contribAtYear(a, t), 0), cp = cctx.accounts.filter(a => a.cat === cat).reduce((x, a) => x + E.contribAtYear(a, t), 0);
      years++; const gap = Math.abs(hh - cp);
      if (gap > 0.005) { apart++; worst = Math.max(worst, gap); if (first.length < 2) first.push(`${c.id} '${label}' ${cat} year ${t}: household £${hh}, couple £${cp}`); }
    }
  }
  return { plans, refused, apart, years, worst, first };
}
const datedHolds = B => B.plans > 0 && B.years > 0 && B.apart === 0;
const datedSaid = B => `${B.plans} plans (${B.refused} refused for another shape), ${B.apart} of ${B.years} wrapper-years before the first retirement apart (worst £${B.worst.toFixed(2)})${B.first.length ? `: ${B.first.join('; ')}` : ''}`;

const some = lib.filter((_, i) => i % 7 === 0), few = lib.filter((_, i) => i % 21 === 0);
const L = landingBattery(some);
ok('1. the later retiree\'s saving lands in the household plan as in the couple: every listed deposit whole in its wrapper in its year, and the household\'s contributions to each wrapper in every year the couple\'s two people\'s', landingHolds(L), landingSaid(L));
const D = datedBattery(some);
ok('2. dated schedules: the household\'s contribution to each wrapper in every year before the first retirement the couple\'s two added', datedHolds(D), datedSaid(D));
// 3. a plan with neither shape: the code before's but for the deposits' mark
{ const SETS = [['the registered couples panel', () => readOpenPanel(fileURLToPath(new URL('../solver/couples-open-registered-panel.json', import.meta.url))).map(u => u.plan)], ['the dress rehearsal\'s panel', () => readOpenPanel(fileURLToPath(new URL('../solver/couples-open-panel.json', import.meta.url))).map(u => u.plan)], ['step 8\'s panel', () => readHspPanel().map(u => u.plan)], ['step 5\'s shapes', () => readShapesPanel().map(u => u.plan)], ['the library\'s couples', () => lib.map(s => s.plan)]];
  const build = (hp, plant) => { HOUSE.plant = plant; try { return JSON.stringify(householdPlanFor(E, hp, { scale: APP_COUPLE.household, takeShapes: APP_COUPLE.takeShapes })); } catch (e) { if (/^householdPlanFor: /.test(e.message)) return `REFUSED ${e.message}`; throw e; } finally { HOUSE.plant = ''; } };
  let n = 0, same = 0, markOnly = 0, other = 0; const first = [];
  for (const [name, plansOf] of SETS) for (const plan of plansOf()) for (const p of [plan, otherOrder(E, plan)]) {
    const hp = householdPlan(E, p), now = build(hp, ''), before = build(hp, 'roomclaim,firstsched'); n++;
    if (now === before) same++; else if (now.replace(/,"asContribution":true/g, '') === before && /"id":"dep_house_[^"]*"[^}]*"asContribution":true/.test(now)) markOnly++; else { other++; if (first.length < 3) first.push(name); }
  }
  ok('3. a plan with neither shape is the code before\'s but for the later retiree\'s deposits\' mark, on every panel and the library, both ways round', other === 0 && n > 0, `${n} household plans: the same ${same}, the deposits' mark alone ${markOnly}, otherwise ${other}${first.length ? ` (${first.join(', ')})` : ''}`); }
// 4. the plants
{ HOUSE.plant = 'roomclaim'; const Lp = landingBattery(few); HOUSE.plant = 'firstsched'; const Dp = datedBattery(few); HOUSE.plant = '';
  ok('4. each check shown failing on its plant: \'roomclaim\' (the deposits claimed against the household person\'s room) fails check 1, \'firstsched\' (the first account\'s schedule kept) fails check 2', !landingHolds(Lp) && !datedHolds(Dp), `under 'roomclaim': ${landingSaid(Lp)}; under 'firstsched': ${datedSaid(Dp)}`); }
console.log(fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`);
process.exit(fail ? 1 : 0);
