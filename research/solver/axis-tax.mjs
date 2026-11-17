/*
 * WHERE IN THE PLAN THE HOUSEHOLD PLAN'S MODEL LEAVES TAX OUT (EXPLORATORY, for AXIS.md, PRESCRIPTIVE-PLAN.md step 6, D121;
 * nothing built, deciding nothing). household-tax-why.mjs's decomposition (results-household-tax-why.txt), split by the
 * axis's window as ANSWERS.md section 3 sets it (the household's first retirement to the younger person's state pension
 * age; axis-size.mjs): on the paths HS5 loses and K2 keeps, on the couple's own path under HS5, each plan year's incomes
 * taxed each person on their own bands (held to the engine's row to a pound, or the script stops) and added together on
 * the household plan's doubled bands; the difference, and each person's taxable pension drawn, summed before the window,
 * in it and after it, the mean a path.
 *   node research/solver/axis-tax.mjs <unit id>
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

const HERE = dirname(fileURLToPath(import.meta.url));
const id = process.argv[2], u = UNITS.find(x => x.id === id);
if (!u) { console.error(`axis-tax: ${id} is not one of the lead test's units`); process.exit(2); }
const file = JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', `household-${SEED}`, `${id}.json.gz`))).toString());
const A = Object.fromEntries(['K2', 'HS5'].map(k => [k, armOf(file.arms[k])]));
const { hp, aDemo } = unitPlans(u);
const house = solveHousehold(E, M, hp, { solveOne: householdSolveOne(PTS), topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
if (await digestOf(tablesOf(house.H)) !== file.digests.before.household) { console.error(`axis-tax: ${id}: the household table is not the run's`); process.exit(3); }
const hs5 = { ...house, split: 'best5', counts: { decisions: 0, far: 0, down: 0 } };
const ctxHS = E.buildContext(withHouseholdSingle({ ...house.plan, demographics: { ...house.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, hs5));
const ctxCE = twoBands(E, () => E.buildContext(withTable(house.hplan, house.H)));
const T = ctxHS.totalYears, PC = ctxHS.P, PH = ctxCE.P;
// the window, as axis-size.mjs reads ANSWERS.md section 3
const own = { self: ctxHS.owners.find(o => o.key === 'self'), part: ctxHS.owners.find(o => o.key === 'part') };
const ageOf = (k, t) => (k === 'self' ? ctxHS.ageSelf0 : ctxHS.agePart0) + t, working = (k, t) => ageOf(k, t) < own[k].retireAge;
let tR = 0; while (tR <= T && working('self', tR) && working('part', tR)) tR++;
const young = ctxHS.ageSelf0 <= ctxHS.agePart0 ? 'self' : 'part';
let tS = 0; while (tS <= T && ageOf(young, tS) < ctxHS.spa) tS++;
const part = t => (t < tR ? 0 : t < tS ? 1 : 2), NAMES = [`before the window (plan years 0 to ${tR - 1})`, `in it (${tR} to ${tS - 1})`, `after it (${tS} to ${T})`];
const paths = E.pathsForSeed(SEED, N, T).map(zs => Float64Array.from(zs));
const idx = []; for (let k = 0; k < N; k++) if (A.K2.survived[k] && !A.HS5.survived[k]) idx.push(k);
const bill = (P, pay, nonSavings, interest, dividends) => P.personTax({ nonSavings: pay + nonSavings, interest, dividends }).total - (pay > 0 ? E.incomeTax(pay, P) : 0);
const S = [0, 1, 2].map(() => ({ out: 0, penSelf: 0, penPart: 0, years: 0 }));
let bad = 0, rows = 0;
for (const k of idx) {
  const st = E.freshState(ctxHS), zs = paths[k], zPath = zs.length > T + 1 ? zs[T + 1] : 0;
  for (let t = 0; t <= T; t++) {
    const r = E.stepYear(ctxHS, st, t, { z: zs[t], zPath });
    const ns = { self: r.otherTaxableSelf + r.taxablePensionSelf, part: r.otherTaxablePart + r.taxablePensionPart };
    const self = bill(PC, r.taxablePaySelf, ns.self, r.savingsInterestSelf, r.giaDividendsSelf), partner = bill(PC, r.taxablePayPart, ns.part, r.savingsInterestPart, r.giaDividendsPart);
    rows++; if (Math.abs(self - r.incomeTaxSelf) > 1 || Math.abs(partner - r.incomeTaxPart) > 1) bad++;
    const together = bill(PH, r.taxablePaySelf + r.taxablePayPart, ns.self + ns.part, r.savingsInterestSelf + r.savingsInterestPart, r.giaDividendsSelf + r.giaDividendsPart);
    const s = S[part(t)]; s.out += r.incomeTaxSelf + r.incomeTaxPart - together; s.penSelf += r.taxablePensionSelf; s.penPart += r.taxablePensionPart; s.years++;
  }
}
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`, n = idx.length;
console.log(`WHERE IN THE PLAN THE HOUSEHOLD PLAN'S MODEL LEAVES TAX OUT (EXPLORATORY, for AXIS.md; nothing built): ${id}, seed ${SEED}, the ${n} paths HS5 loses and K2 keeps, the couple's own path under HS5; the axis's window from the first retirement (plan year ${tR}) to the younger person's state pension age (plan year ${tS})`);
if (bad) { console.log(`  STOP: each person's tax as recomputed differs from the engine's row by more than £1 in ${bad} of ${rows} plan years`); process.exit(1); }
console.log(`  the check: each person's income tax recomputed on their own bands equals the engine's row to a pound in all ${rows} plan years`);
for (let i = 0; i < 3; i++) { const s = S[i]; console.log(`  ${NAMES[i]}: the income tax left out ${gbp(s.out / n)} a path; taxable pension drawn a year, the first person ${gbp(s.years ? s.penSelf / s.years : 0)}, the partner ${gbp(s.years ? s.penPart / s.years : 0)}`); }
