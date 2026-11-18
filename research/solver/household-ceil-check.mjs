/*
 * THE LEAD TEST'S UNITS TO PLACE, CHECKED FOR A FAULT (EXPLORATORY, written after the read, deciding nothing). The read
 * (results-household.txt) sits far from what the review's pilot led us to expect (pooled survival +0.29 against about +1.7),
 * almost all of it one unit the pilot did not run, S191-90 (-20.7 points; the household table's forecast 21.8 points above
 * HS5's survival). PRESCRIPTIVE-PLAN.md step 4: "a read far from that is checked for a fault before it is written up". For
 * each unit the read names to place, this solves the household table again as the audit solves it (its digest held to the
 * unit file's: the same table) and runs it as CEIL, SHAPES.md's arm: the household table on the household's own single plan
 * (bridge.js withTable on householdPlanFor's plan, its context inside twoBands), on the same 4,000 paths of seed 7002. HS5 is
 * run again on its first 200 paths and held to the unit file's arrays (the same arm). Printed: the table's forecast at the
 * start; CEIL's survival and HS5's; CEIL less HS5, paired by path (stats.mjs survivalChange); how each arm's lost paths fail
 * (the minimum pot at the plan's end with every year's spending met, or a year unfunded); on the paths HS5 loses and K2
 * keeps, each arm's end pot and lifetime tax (CEIL, HS5, K2); and on HS5's first three such paths, year by year from the
 * first year the two part, the household's wealth, its tax and its spending under CEIL and under HS5.
 *   node research/solver/household-ceil-check.mjs <unit id>
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveHousehold, withHouseholdSingle, twoBands } from './household.mjs';
import { withTable } from '../../src/solver/bridge.js';
import { tablesOf, digestOf } from '../../src/solverDigest.js';
import { UNITS, unitPlans, householdSolveOne, JOINT, TOPK, SEED, N, PTS } from './audit-household.mjs';
import { runPath } from './audit-phase4.mjs';
import { armOf } from './reduce-household.mjs';
import { survivalChange } from './stats.mjs';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const id = process.argv[2], u = UNITS.find(x => x.id === id);
if (!u) { console.error(`household-ceil-check: ${id} is not one of the lead test's units`); process.exit(2); }
const file = JSON.parse(gunzipSync(readFileSync(join(HERE, 'results', `household-${SEED}`, `${id}.json.gz`))).toString());
const A = Object.fromEntries(['K2', 'HS5'].map(k => [k, armOf(file.arms[k])]));
const { a, hp, aDemo } = unitPlans(u);
const t0 = Date.now();
const house = solveHousehold(E, M, hp, { solveOne: householdSolveOne(PTS), topK: TOPK, tieJoint: JOINT.tieJoint, holdPast: JOINT.holdPast });
const dig = await digestOf(tablesOf(house.H));
if (dig !== file.digests.before.household) { console.error(`household-ceil-check: ${id}: the household table's digest ${dig}, the run's ${file.digests.before.household}`); process.exit(3); }
const hs5 = { ...house, split: 'best5', counts: { decisions: 0, far: 0, down: 0 } };
const ctxHS = E.buildContext(withHouseholdSingle({ ...house.plan, demographics: { ...house.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, hs5));
const ctxCE = twoBands(E, () => E.buildContext(withTable(house.hplan, house.H)));
const T = ctxHS.totalYears;
if (ctxCE.totalYears !== T) { console.error(`household-ceil-check: ${id}: CEIL runs ${ctxCE.totalYears} years, the couple ${T}`); process.exit(3); }
if (ctxCE.solvencyFloor !== ctxHS.solvencyFloor) { console.error(`household-ceil-check: ${id}: the minimum pots differ (${ctxCE.solvencyFloor}, ${ctxHS.solvencyFloor})`); process.exit(3); }
const paths = E.pathsForSeed(SEED, N, T).map(zs => Float64Array.from(zs));
// HS5 again on its first 200 paths: the unit file's arm, path for path
let bad = 0;
for (let k = 0; k < 200; k++) { const r = runPath(ctxHS, paths[k], false); if ((r.survived ? 1 : 0) !== A.HS5.survived[k] || r.wealth !== A.HS5.pot[k] || r.tax !== A.HS5.tax[k]) bad++; }
if (bad) { console.error(`household-ceil-check: ${id}: HS5 run again differs from the unit file on ${bad} of 200 paths`); process.exit(3); }
const C = { survived: new Uint8Array(N), failYear: new Int16Array(N), pot: new Float64Array(N), tax: new Float64Array(N), unmet: new Float64Array(N) };
for (let k = 0; k < N; k++) { const r = runPath(ctxCE, paths[k], false); C.survived[k] = r.survived ? 1 : 0; C.failYear[k] = r.failYear; C.pot[k] = r.wealth; C.tax[k] = r.tax; C.unmet[k] = r.unmet; }
const pct = x => `${(100 * x).toFixed(2)}%`, gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`, pts = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`;
const surv = s => s.reduce((t, v) => t + v, 0) / N;
let saved = 0, lost = 0;
for (let k = 0; k < N; k++) { if (C.survived[k] && !A.HS5.survived[k]) saved++; if (!C.survived[k] && A.HS5.survived[k]) lost++; }
const ch = survivalChange(lost, saved, N);   // (b, c): b the paths the arm in front loses, c those it saves; points
const kinds = (s, fy, un) => { let floor = 0, unfunded = 0; for (let k = 0; k < N; k++) if (!s[k]) { if (fy[k] === T && un[k] <= E.FAIL_TOLERANCE) floor++; else unfunded++; } return `${floor} at the minimum pot at the end, ${unfunded} a year unfunded`; };
console.log(`THE HOUSEHOLD TABLE ON ITS OWN PLAN (CEIL) BESIDE HS5 (EXPLORATORY, after the read, deciding nothing): ${id} (${u.group}), seed ${SEED}, ${N} paths, ${PTS} points; the household table's digest the run's (${dig}); HS5 run again the unit file's on its first 200 paths; the minimum pot ${gbp(ctxHS.solvencyFloor)}; the plan's last year ${T}`);
console.log(`  the household table's forecast at the start ${pct(A.HS5.forecast)}; CEIL ${pct(surv(C.survived))}; HS5 ${pct(surv(A.HS5.survived))}; K2 ${pct(surv(A.K2.survived))}`);
console.log(`  CEIL less HS5, paired by path: ${pts(ch.d)} (${pts(ch.lo)} to ${pts(ch.hi)}) points (${saved} paths CEIL keeps and HS5 loses, ${lost} the other way)`);
console.log(`  how the lost paths fail: CEIL ${kinds(C.survived, C.failYear, C.unmet)}; HS5 ${kinds(A.HS5.survived, A.HS5.failYear, A.HS5.unmet)}; K2 ${kinds(A.K2.survived, A.K2.failYear, A.K2.unmet)}`);
const idx = []; for (let k = 0; k < N; k++) if (A.K2.survived[k] && !A.HS5.survived[k]) idx.push(k);
const med = (arr) => { const s = idx.map(k => arr[k]).sort((p, q) => p - q), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN; };
const meanOn = (arr) => idx.reduce((t, k) => t + arr[k], 0) / idx.length;
const keptC = idx.filter(k => C.survived[k]).length;
console.log(`  on the ${idx.length} paths HS5 loses and K2 keeps: CEIL keeps ${keptC}; the end pot, median CEIL ${gbp(med(C.pot))}, HS5 ${gbp(med(A.HS5.pot))}, K2 ${gbp(med(A.K2.pot))}; lifetime tax, mean CEIL ${gbp(meanOn(C.tax))}, HS5 ${gbp(meanOn(A.HS5.tax))}, K2 ${gbp(meanOn(A.K2.tax))}`);
let tC = 0, tH = 0, tK = 0; for (let k = 0; k < N; k++) { tC += C.tax[k]; tH += A.HS5.tax[k]; tK += A.K2.tax[k]; }
console.log(`  over every path: lifetime tax, mean CEIL ${gbp(tC / N)}, HS5 ${gbp(tH / N)}, K2 ${gbp(tK / N)}`);
// year by year on the first three such paths, from the first year the two part
const rowsOf = (ctx, zs) => { const st = E.freshState(ctx), zPath = zs.length > T + 1 ? zs[T + 1] : 0, out = []; for (let t = 0; t <= T; t++) out.push(E.stepYear(ctx, st, t, { z: zs[t], zPath })); return out; };
for (const k of idx.slice(0, 3)) {
  const rc = rowsOf(ctxCE, paths[k]), rh = rowsOf(ctxHS, paths[k]);
  let t1 = 0; while (t1 <= T && Math.abs(rc[t1].totalCombined - rh[t1].totalCombined) < 1 && Math.abs((rc[t1].taxPaid + (rc[t1].cgtPaid || 0)) - (rh[t1].taxPaid + (rh[t1].cgtPaid || 0))) < 1) t1++;
  let cumC = 0, cumH = 0; for (let t = 0; t < t1; t++) { cumC += rc[t].taxPaid + (rc[t].cgtPaid || 0); cumH += rh[t].taxPaid + (rh[t].cgtPaid || 0); }
  console.log(`  path ${k}: the two first part in plan year ${t1 > T ? 'none' : t1}; at the end CEIL ${gbp(rc[T].totalCombined)}, HS5 ${gbp(rh[T].totalCombined)}; year: wealth CEIL / HS5, tax CEIL / HS5, spending CEIL / HS5`);
  const ys = []; for (let t = t1; t <= T; t++) ys.push(t);
  const show = ys.length > 14 ? [...ys.slice(0, 6), ...ys.slice(-8)] : ys;
  for (const t of show) {
    const xc = rc[t], xh = rh[t];
    console.log(`    ${String(t).padStart(2)}: ${gbp(xc.totalCombined)} / ${gbp(xh.totalCombined)}; ${gbp(xc.taxPaid + (xc.cgtPaid || 0))} / ${gbp(xh.taxPaid + (xh.cgtPaid || 0))}; ${gbp(xc.targetSpend)} / ${gbp(xh.targetSpend)}`);
  }
  let sC = 0, sH = 0, xC = 0, xH = 0; for (let t = 0; t <= T; t++) { sC += rc[t].taxPaid + (rc[t].cgtPaid || 0); sH += rh[t].taxPaid + (rh[t].cgtPaid || 0); xC += rc[t].targetSpend; xH += rh[t].targetSpend; }
  console.log(`    over the plan: tax CEIL ${gbp(sC)}, HS5 ${gbp(sH)} (HS5 less CEIL ${gbp(sH - sC)}); spending CEIL ${gbp(xC)}, HS5 ${gbp(xH)} (HS5 less CEIL ${gbp(xH - xC)})`);
}
console.log(`  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
