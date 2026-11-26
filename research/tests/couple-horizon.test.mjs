/*
 * A COUPLE'S HORIZON IN WHOLE PLAN YEARS (the reviewer on D104 (1)'s change of default, MINOR 2; src/solver/couple.js
 * singlePlanFor and src/coupleOrder.js otherOrder). The engine counts a plan's years as the years between the first person's
 * age and the end age, rounded (App.jsx buildContext). A couple's cut gives each person an end age, and its mirror gives the
 * new first person one; set by the sum of the ages, a fractional first age (60.5 and 62.1, to 95) left one person's table,
 * or the mirror, a year short, and the couple's solve failed. Each now carries the couple's whole years.
 *   1. the cut: over a grid of couples with fractional ages (the first person from 50 to 70 in tenths of a year, the partner
 *      at six gaps either side, three end ages), kept to those whose plan as entered runs within the 120 years a plan as
 *      entered stops at (src/couplesSwitch.js horizonFits; since D150 a couple past it is cut on its mirror, which keeps the
 *      plan's years: research/tests/couple-past120.test.mjs), each person's plan as the page cuts it (src/solverCouple.js
 *      couplePlans) runs the couple's years;
 *   2. the mirror: over the same grid, the mirror (otherOrder) runs the couple's years;
 *   3. whole ages: on the library's 210 couples, as entered and mirrored, each person's cut plan and the mirror are the code
 *      before's to the bit (the two plants together are the code before);
 *   4. the last year (the reviewer's second round on D104 (1)'s change of default, finding 1: the end age written as the first
 *      age plus the whole years moved an open band's and an open income's last year where the years end in .5 or more,
 *      because the engine reads a blank end as the end age itself, unrounded): over the same grid, each couple given a band
 *      and an income of each person's with no end age, the mirror and each person's cut plan (by the page's route) read the
 *      band and each income in the same plan years as the plan as entered, every year to the last; the grid holds couples
 *      whose last year falls past the end age, or the check could not see it.
 * Plants (--planted runs each and wants exactly its check to fail): 'rawyears' (couple.js COUPLE.plant: the cut's end age
 * the moved one as it falls, as before) fails check 1; 'mirrorsum' (coupleOrder.js PLANT: the mirror's, as before) fails
 * check 2; 'wholeend' (both: the person's age plus the whole years, the first form of the fix) and 'incomeopen' (both: an
 * open income left blank whatever the plan as entered reads) fail check 4.
 *   node research/tests/couple-horizon.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import * as CPL from '../../src/solver/couple.js';
import * as ORD from '../../src/coupleOrder.js';
import { couplePlans } from '../../src/solverCouple.js';
import { horizonFits } from '../../src/couplesSwitch.js';
import { couplesOf } from '../solver/couple-panel.mjs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['rawyears', ['1']], ['mirrorsum', ['2']], ['wholeend', ['4']], ['incomeopen', ['4']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, COUPLE_HORIZON_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { console.log(r.stdout + r.stderr); bad++; }
  }
  process.exit(bad ? 1 : 0);
}
const PLANT = process.env.COUPLE_HORIZON_PLANT || '';
if (PLANT === 'rawyears') CPL.COUPLE.plant = 'rawyears';
if (PLANT === 'mirrorsum') ORD.PLANT.rule = 'mirrorsum';
if (PLANT === 'wholeend' || PLANT === 'incomeopen') { CPL.COUPLE.plant = PLANT; ORD.PLANT.rule = PLANT; }
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-horizon: a couple's horizon in whole plan years${PLANT ? `; planted: ${PLANT}` : ''}`);
const yearsOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p))).totalYears;
const library = couplesOf(), base = E.normalizePlan(library[0].plan);

// the grid: the first person from 50 to 70 in tenths, the partner at six gaps, three end ages, kept to what a plan as entered runs
// within 120 (past it, since D150, the mirror: couple-past120.test.mjs)
const GAPS = [-7.6, -3, -0.4, 0.4, 3, 7.6], ENDS = [90, 95, 100.5], grid = [];
for (let i = 0; i <= 200; i++) for (const g of GAPS) for (const T of ENDS) {
  const a = Math.round((50 + i / 10) * 10) / 10, p = JSON.parse(JSON.stringify(base));
  p.demographics = { ...p.demographics, currentAgeSelf: a, currentAgePart: Math.round((a + g) * 10) / 10, terminalAge: T };
  const q = E.normalizePlan(p);
  if (horizonFits(q)) grid.push(q);
}

// ---- 1. the cut ----
{
  let short = 0; const first = [];
  for (const p of grid) {
    const Y = yearsOf(p), cut = couplePlans(E, p, { shareRule: 'pots' }), ys = [yearsOf(cut.plans.self), yearsOf(cut.plans.part)];
    if (ys.some(y => y !== Y)) { short++; if (first.length < 3) first.push(`${p.demographics.currentAgeSelf} and ${p.demographics.currentAgePart} to ${p.demographics.terminalAge}: the couple ${Y} years, the people ${ys.join(' and ')}`); }
  }
  ok(1, `the cut: over ${grid.length} couples with fractional ages, each person's plan runs the couple's years`, grid.length > 3000 && short === 0, short ? `${short} not (${first.join('; ')})` : 'every one');
}

// ---- 2. the mirror ----
{
  let short = 0; const first = [];
  for (const p of grid) {
    const Y = yearsOf(p), y = yearsOf(ORD.otherOrder(E, p));
    if (y !== Y) { short++; if (first.length < 3) first.push(`${p.demographics.currentAgeSelf} and ${p.demographics.currentAgePart} to ${p.demographics.terminalAge}: ${Y} years as entered, ${y} mirrored`); }
  }
  ok(2, `the mirror: over the same ${grid.length} couples, the mirror runs the couple's years`, grid.length > 3000 && short === 0, short ? `${short} not (${first.join('; ')})` : 'every one');
}

// ---- 3. whole ages: the code before's to the bit ----
{
  const digestOf = () => {
    const h = createHash('sha256');
    for (const s of library) {
      const p = E.normalizePlan(s.plan), q = ORD.otherOrder(E, p);
      for (const x of [p, q]) { const cut = couplePlans(E, x, { shareRule: 'pots' }); h.update(JSON.stringify([s.id, cut.plans, cut.ageWith])); }
      h.update(JSON.stringify(q));
    }
    return h.digest('hex');
  };
  const plants = [CPL.COUPLE.plant, ORD.PLANT.rule], now = digestOf();
  CPL.COUPLE.plant = 'rawyears'; ORD.PLANT.rule = 'mirrorsum';
  const before = digestOf();
  [CPL.COUPLE.plant, ORD.PLANT.rule] = plants;
  const whole = library.every(s => { const d = E.normalizePlan(s.plan).demographics; return Number.isInteger(Number(d.currentAgeSelf)) && Number.isInteger(Number(d.currentAgePart)); });
  ok(3, `whole ages: the library's ${library.length} couples, as entered and mirrored, cut and mirrored as the code before (every one of whole ages)`, whole && now === before, `${now.slice(0, 16)} against the code before's ${before.slice(0, 16)}`);
}

// ---- 4. the last year ----
{
  const ctxOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p)));
  const withOpen = p => {
    const q = JSON.parse(JSON.stringify(p)), a = Number(q.demographics.currentAgeSelf), tgt = Number(q.spending.targetSpend);
    q.spending.spendBands = [{ id: 'b1', fromAge: Math.ceil(a) + 10, toAge: '', amount: Math.round(0.8 * tgt) }];
    q.otherIncomes = [{ id: 'x1', name: 'DB', owner: 'Myself', startAge: 66, endAge: '', amount: 5000, incomeType: 'otherTaxable', notes: '' },
      { id: 'x2', name: 'DB2', owner: 'Partner', startAge: 67, endAge: '', amount: 4000, incomeType: 'otherTaxable', notes: '' }];
    return E.normalizePlan(q);
  };
  const paid = (c, w, t) => c.otherIncomes.filter(i => i.owner === w).map(i => { const age = (w === 'self' ? c.ageSelf0 : c.agePart0) + t; return age >= i.startAge && age <= i.endAge ? i.amount : 0; }).join();
  const off = { mirror: [], cut: [] }; let past = 0;
  for (const p0 of grid) {
    const p = withOpen(p0), h = ctxOf(p), Y = h.totalYears, name = `${h.ageSelf0} and ${h.agePart0} to ${h.terminalAge}`;
    if (h.ageSelf0 + Y > h.terminalAge) past++;
    // the mirror against the plan as entered, each person in the other's place
    const m = ctxOf(ORD.otherOrder(E, p));
    for (let t = 0; t <= Y; t++) {
      if (E.spendTargetAtAge(h, h.ageSelf0 + t) !== E.spendTargetAtAge(m, m.ageSelf0 + t)) { off.mirror.push(`${name}: the band in plan year ${t}`); break; }
      if (paid(h, 'self', t) !== paid(m, 'part', t) || paid(h, 'part', t) !== paid(m, 'self', t)) { off.mirror.push(`${name}: an income in plan year ${t}`); break; }
    }
    // each person's cut plan by the page's route against the household's year
    const cp = couplePlans(E, p, { shareRule: 'pots' }), hh = ctxOf(cp.household);
    for (const w of ['self', 'part']) {
      const q = ctxOf(cp.plans[w]), share = w === 'self' ? cp.share : 1 - cp.share;
      for (let t = 0; t <= Y; t++) {
        if (E.spendTargetAtAge(q, q.ageSelf0 + t) !== Math.round(share * E.spendTargetAtAge(hh, hh.ageSelf0 + t))) { off.cut.push(`${name}, ${w}: the band in plan year ${t}`); break; }
        if (paid(hh, w, t) !== paid(q, 'self', t)) { off.cut.push(`${name}, ${w}: an income in plan year ${t}`); break; }
      }
    }
  }
  const all = [...off.mirror, ...off.cut];
  ok(4, `the last year: over the ${grid.length} couples, each with an open band and an open income each, the mirror and each person's cut plan read the band and the incomes in the plan as entered's years (${past} couples' last year past the end age)`,
    past > 500 && !all.length, all.length ? `${off.mirror.length} mirrors and ${off.cut.length} cut plans off (${all.slice(0, 3).join('; ')})` : 'every one, every plan year');
}

console.log(`\ncouple-horizon: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
