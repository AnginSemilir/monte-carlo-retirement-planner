/*
 * WHERE THE COUPLE'S TAX PARTS FROM THE HOUSEHOLD PLAN'S (EXPLORATORY, written after the read, deciding nothing). The
 * lead test's units to place lose paths the household table, run on its own single plan (CEIL), keeps
 * (household-ceil-check.mjs), and the couple pays far more tax over the plan than CEIL does. This decomposes that on the
 * couple's own path under HS5, so the two are not compared across paths that have parted: on each path HS5 loses and K2
 * keeps, every plan year's incomes as the engine recorded them in its row (each person's taxable pay, state pension and
 * other taxable income (the row's otherTaxable, the state pension in it), taxable pension drawn, savings interest and
 * dividends) are taxed twice: each person on their own
 * bands, as the engine taxes them (P.personTax less the tax on pay, held to the row's incomeTaxSelf and incomeTaxPart to a
 * pound in every year, or the script stops), and the two people's added together on the household plan's bands
 * (householdPlanFor's doubled allowance and bands, the household context's P), as the household table's model taxes one
 * person holding both. The difference is the income tax the household table's model leaves out on the draws the couple
 * actually made. Printed per unit: its sum over the plan, the mean over those paths, beside the couple's income tax and
 * capital gains tax, and how far below the minimum pot those paths end; and where it falls, the first person's taxable
 * pension drawn and the partner's.
 *   node research/solver/household-tax-why.mjs <unit id>
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveHousehold, withHouseholdSingle, twoBands } from './household.mjs';
import { withTable } from '../../src/solver/bridge.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { UNITS, unitPlans, householdSolveOne, JOINT, TOPK, SEED, N, PTS } from './audit-household.mjs';
import { runPath } from './audit-phase4.mjs';
import { armOf } from './reduce-household.mjs';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const id = process.argv[2], u = UNITS.find(x => x.id === id);
if (!u) { console.error(`household-tax-why: ${id} is not one of the lead test's units`); process.exit(2); }
const file = JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', `household-${SEED}`, `${id}.json.gz`))).toString());
const A = Object.fromEntries(['K2', 'HS5'].map(k => [k, armOf(file.arms[k])]));
const { hp, aDemo } = unitPlans(u);
const house = solveHousehold(E, M, hp, { solveOne: householdSolveOne(PTS), topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
const dig = await digestOf(tablesOf(house.H));
if (dig !== file.digests.before.household) { console.error(`household-tax-why: ${id}: the household table is not the run's`); process.exit(3); }
const hs5 = { ...house, split: 'best5', counts: { decisions: 0, far: 0, down: 0 } };
const ctxHS = E.buildContext(withHouseholdSingle({ ...house.plan, demographics: { ...house.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, hs5));
const ctxCE = twoBands(E, () => E.buildContext(withTable(house.hplan, house.H)));
const T = ctxHS.totalYears, PC = ctxHS.P, PH = ctxCE.P, floor = ctxHS.solvencyFloor;
const paths = E.pathsForSeed(SEED, N, T).map(zs => Float64Array.from(zs));
const idx = []; for (let k = 0; k < N; k++) if (A.K2.survived[k] && !A.HS5.survived[k]) idx.push(k);
const bill = (P, pay, nonSavings, interest, dividends) => P.personTax({ nonSavings: pay + nonSavings, interest, dividends }).total - (pay > 0 ? E.incomeTax(pay, P) : 0);
const S = { couple: 0, house: 0, cgt: 0, penSelf: 0, penPart: 0, years: 0, short: 0, bad: 0, rows: 0, worst: 0 };
for (const k of idx) {
  const st = E.freshState(ctxHS), zs = paths[k], zPath = zs.length > T + 1 ? zs[T + 1] : 0;
  let last = null;
  for (let t = 0; t <= T; t++) {
    const r = E.stepYear(ctxHS, st, t, { z: zs[t], zPath });
    // the row's otherTaxable is the year's taxable income before any pension draw: other taxable incomes and the state pension
    const ns = { self: r.taxablePaySelf + r.otherTaxableSelf + r.taxablePensionSelf, part: r.taxablePayPart + r.otherTaxablePart + r.taxablePensionPart };
    // each person on their own bands, held to the row (the decomposition is only as good as this check)
    const own = { self: bill(PC, r.taxablePaySelf, ns.self - r.taxablePaySelf, r.savingsInterestSelf, r.giaDividendsSelf), part: bill(PC, r.taxablePayPart, ns.part - r.taxablePayPart, r.savingsInterestPart, r.giaDividendsPart) };
    const gap = Math.max(Math.abs(own.self - r.incomeTaxSelf), Math.abs(own.part - r.incomeTaxPart));
    S.rows++; if (gap > 1) { S.bad++; S.worst = Math.max(S.worst, gap); }
    const together = bill(PH, r.taxablePaySelf + r.taxablePayPart, ns.self + ns.part - r.taxablePaySelf - r.taxablePayPart, r.savingsInterestSelf + r.savingsInterestPart, r.giaDividendsSelf + r.giaDividendsPart);
    S.couple += r.incomeTaxSelf + r.incomeTaxPart; S.house += together; S.cgt += r.cgtPaid || 0;
    if (r.targetSpend > 0) { S.penSelf += r.taxablePensionSelf; S.penPart += r.taxablePensionPart; S.years++; }
    last = r;
  }
  S.short += Math.max(0, floor - Math.max(0, last.totalCombined));
}
const gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`, n = idx.length;
console.log(`WHERE THE COUPLE'S TAX PARTS FROM THE HOUSEHOLD PLAN'S (EXPLORATORY, after the read, deciding nothing): ${id} (${u.group}), seed ${SEED}, on the ${n} paths HS5 loses and K2 keeps, the couple's own path under HS5; the household table the run's; the minimum pot ${gbp(floor)}`);
if (S.bad) { console.log(`  STOP: each person's tax as recomputed differs from the engine's row by more than £1 in ${S.bad} of ${S.rows} plan years (the largest ${gbp(S.worst)}): no decomposition is printed`); process.exit(1); }
console.log(`  the check: each person's income tax recomputed on their own bands equals the engine's row to a pound in all ${S.rows} plan years`);
console.log(`  income tax over the plan, the mean a path: the couple, each on their own bands, ${gbp(S.couple / n)}; the same incomes added and taxed on the household plan's bands ${gbp(S.house / n)}; left out by the household plan's model ${gbp((S.couple - S.house) / n)} a path; capital gains tax beside it ${gbp(S.cgt / n)} a path`);
console.log(`  those paths end below the minimum pot by ${gbp(S.short / n)} a path on average (a path that ends above it counted as nought)`);
console.log(`  taxable pension drawn in a spending year, the mean: the first person ${gbp(S.penSelf / S.years)}, the partner ${gbp(S.penPart / S.years)}`);
