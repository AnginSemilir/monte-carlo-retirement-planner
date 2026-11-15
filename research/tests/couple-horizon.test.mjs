/*
 * A COUPLE'S HORIZON IN WHOLE PLAN YEARS (the reviewer on D104 (1)'s change of default, MINOR 2; src/solver/couple.js
 * singlePlanFor and src/coupleOrder.js otherOrder). The engine counts a plan's years as the years between the first person's
 * age and the end age, rounded (App.jsx buildContext). A couple's cut gives each person an end age, and its mirror gives the
 * new first person one; set by the sum of the ages, a fractional first age (60.5 and 62.1, to 95) left one person's table,
 * or the mirror, a year short, and the couple's solve failed. Each now carries the couple's whole years.
 *   1. the cut: over a grid of couples with fractional ages (the first person from 50 to 70 in tenths of a year, the partner
 *      at six gaps either side, three end ages), kept to those the guard's age cap lets run (src/couplesSwitch.js
 *      horizonFits), each person's plan as the page cuts it (src/solverCouple.js couplePlans) runs the couple's years;
 *   2. the mirror: over the same grid, the mirror (otherOrder) runs the couple's years;
 *   3. whole ages: on the library's 210 couples, as entered and mirrored, each person's cut plan and the mirror are the code
 *      before's to the bit (the two plants together are the code before).
 * Plants (--planted runs each and wants exactly its check to fail): 'rawyears' (couple.js COUPLE.plant: the cut's years
 * unrounded, as before) fails check 1; 'mirrorsum' (coupleOrder.js PLANT: the mirror's end age by the sum of the ages, as
 * before) fails check 2.
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
  for (const [plant, want] of [['rawyears', ['1']], ['mirrorsum', ['2']]]) {
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
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
console.log(`couple-horizon: a couple's horizon in whole plan years${PLANT ? `; planted: ${PLANT}` : ''}`);
const yearsOf = p => E.buildContext(E.resolveMpaa(E.normalizePlan(p))).totalYears;
const library = couplesOf(), base = E.normalizePlan(library[0].plan);

// the grid: the first person from 50 to 70 in tenths, the partner at six gaps, three end ages, kept to what the age cap runs
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

console.log(`\ncouple-horizon: ${passed} passed, ${failed} failed${PLANT ? ` (planted: ${PLANT})` : ''}`);
process.exit(failed ? 1 : 0);
