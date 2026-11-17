/*
 * THE COUPLE'S TAX BESIDE THE HOUSEHOLD PLAN'S BANDS, AND ITS TAX-FREE CASH (EXPLORATORY, written after the read, deciding
 * nothing; its words and its second set of paths from the reviewer at the read, reviews/2026-11-17-read-household.md
 * findings 1, 4 and 5). Sizes, not a decomposition of the loss: nothing here runs the household table with any part taken
 * away, so nothing here says why a path is lost.
 *
 * On each unit, on the couple's own path under HS5, every plan year's incomes as the engine recorded them in its row (each
 * person's taxable pay, other taxable income with the state pension in it, taxable pension drawn, savings interest and
 * dividends) are taxed twice: each person on their own bands, as the engine taxes them (P.personTax less the tax on pay,
 * held to the row's incomeTaxSelf and incomeTaxPart to a pound in every year, or the script stops); and the two people's
 * added together on the household plan's bands (householdPlanFor's doubled allowance and bands). The difference is "the
 * bands' part, on the couple's taxable incomes". It is not quite how the household table's model prices the year. It
 * leaves out the household plan's own tax-free cash (its cap doubled: the table reads the two people's tax-free cash taken
 * as one figure against twice a person's cap), whose sizes are printed beside it. And in the plan years when the later
 * retiree still works after the first retirement, it stacks the couple's draws over that person's pay, where the household
 * plan carries the pay as tax-free take-home.
 *
 * Printed, on the paths HS5 loses and K2 keeps, and on the first 1,000 paths both keep: the couple's income tax a path, the
 * same incomes on the household plan's bands, the bands' part, capital gains tax; the tax-free cash taken over the plan, the
 * couple's and the household plan's on its own plan (CEIL) on the same paths, and how many paths the first person reaches
 * their own cap on; each person's taxable pension drawn a spending year; and, on the lost paths, how they fail: at the
 * minimum pot at the plan's end (how far below it, the mean) or a year short (each ends with nothing).
 *   node research/solver/household-tax-why.mjs <unit id>
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveHousehold, withHouseholdSingle, twoBands } from './household.mjs';
import { withTable } from '../../src/solver/bridge.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { UNITS, unitPlans, householdSolveOne, JOINT, TOPK, SEED, N, PTS } from './audit-household.mjs';
import { armOf } from './reduce-household.mjs';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), KEPT = 1000;
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
const lost = [], kept = [];
for (let k = 0; k < N; k++) { if (A.K2.survived[k] && !A.HS5.survived[k]) lost.push(k); else if (A.K2.survived[k] && A.HS5.survived[k] && kept.length < KEPT) kept.push(k); }
const bill = (P, pay, nonSavings, interest, dividends) => P.personTax({ nonSavings: pay + nonSavings, interest, dividends }).total - (pay > 0 ? E.incomeTax(pay, P) : 0);
let bad = 0, rows = 0, worst = 0;
const runOf = (ctx, zs) => { const st = E.freshState(ctx), zPath = zs.length > T + 1 ? zs[T + 1] : 0, out = []; for (let t = 0; t <= T; t++) out.push(E.stepYear(ctx, st, t, { z: zs[t], zPath })); return { rows: out, st }; };
function over(idx) {
  const S = { couple: 0, house: 0, cgt: 0, penSelf: 0, penPart: 0, years: 0, pclsCouple: 0, pclsCeil: 0, atCap: 0 };
  for (const k of idx) {
    const r = runOf(ctxHS, paths[k]);
    for (const x of r.rows) {
      const ns = { self: x.otherTaxableSelf + x.taxablePensionSelf, part: x.otherTaxablePart + x.taxablePensionPart };
      const self = bill(PC, x.taxablePaySelf, ns.self, x.savingsInterestSelf, x.giaDividendsSelf), partner = bill(PC, x.taxablePayPart, ns.part, x.savingsInterestPart, x.giaDividendsPart);
      const gap = Math.max(Math.abs(self - x.incomeTaxSelf), Math.abs(partner - x.incomeTaxPart));
      rows++; if (gap > 1) { bad++; worst = Math.max(worst, gap); }
      S.couple += x.incomeTaxSelf + x.incomeTaxPart; S.cgt += x.cgtPaid || 0;
      S.house += bill(PH, x.taxablePaySelf + x.taxablePayPart, ns.self + ns.part, x.savingsInterestSelf + x.savingsInterestPart, x.giaDividendsSelf + x.giaDividendsPart);
      if (x.targetSpend > 0) { S.penSelf += x.taxablePensionSelf; S.penPart += x.taxablePensionPart; S.years++; }
    }
    S.pclsCouple += r.st.cumPcls.self + r.st.cumPcls.part; if (r.st.cumPcls.self >= PC.lsa - 1) S.atCap++;
    S.pclsCeil += runOf(ctxCE, paths[k]).st.cumPcls.self;
  }
  return S;
}
const SL = over(lost), SK = over(kept);
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;
console.log(`THE COUPLE'S TAX BESIDE THE HOUSEHOLD PLAN'S BANDS, AND ITS TAX-FREE CASH (EXPLORATORY, after the read, deciding nothing; sizes, not a decomposition of the loss): ${id} (${u.group}), seed ${SEED}, the couple's own path under HS5; the household table the run's; the minimum pot ${gbp(floor)}; a person's tax-free cash cap ${gbp(PC.lsa)}, the household plan's ${gbp(PH.lsa)}`);
if (bad) { console.log(`  STOP: each person's tax as recomputed differs from the engine's row by more than £1 in ${bad} of ${rows} plan years (the largest ${gbp(worst)}): nothing is printed`); process.exit(1); }
console.log(`  the check: each person's income tax recomputed on their own bands equals the engine's row to a pound in all ${rows} plan years`);
for (const [name, S, n] of [[`the ${lost.length} paths HS5 loses and K2 keeps`, SL, lost.length], [`the first ${kept.length} paths both keep`, SK, kept.length]]) {
  console.log(`  on ${name}, the mean a path:`);
  console.log(`    income tax over the plan: the couple, each on their own bands, ${gbp(S.couple / n)}; the same taxable incomes on the household plan's bands ${gbp(S.house / n)}; the bands' part ${gbp((S.couple - S.house) / n)}; capital gains tax beside it ${gbp(S.cgt / n)}`);
  console.log(`    tax-free cash taken over the plan: the couple ${gbp(S.pclsCouple / n)}, the household plan on its own plan (CEIL) ${gbp(S.pclsCeil / n)}; the first person at their own cap at the end on ${S.atCap} of ${n} paths`);
  console.log(`    taxable pension drawn in a spending year: the first person ${gbp(S.penSelf / S.years)}, the partner ${gbp(S.penPart / S.years)}`);
}
let fl = 0, sh = 0, below = 0;
for (const k of lost) { if (A.HS5.failYear[k] === T && A.HS5.unmet[k] <= 1) { fl++; below += floor - A.HS5.pot[k]; } else sh++; }
console.log(`  how the ${lost.length} lost paths fail: ${fl} at the minimum pot at the plan's end, below it by ${gbp(fl ? below / fl : 0)} on average; ${sh} a year short, each ending with nothing`);
