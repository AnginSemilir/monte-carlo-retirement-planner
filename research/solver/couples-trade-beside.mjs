/*
 * THE COUPLES TRADE, BESIDE THE READ (post hoc, EXPLORATORY, deciding nothing; written after the read, for the reviewer at the
 * read's findings 1 to 3, reviews/2026-11-23-read-couples-trade.md): figures over the stored arrays of results/couples-trade-7002
 * and APP's run re-run by the engine on the same paths of seed 7002 for its year-by-year demand (no solve; each re-run held to the
 * stored APP on every path). Printed to results-couples-trade-beside.txt.
 *   A. Where the controls' share is decided: the paths ROUTE keeps and L loses (APP losing them too), and of those the paths on
 *      which APP ran out before the plan's final year (its fail year below T); on those, APP's level (its demand over the year's
 *      scheduled target, and over the year's fraction in plan year 0) in the three years before its fail year and in every year
 *      after it, and the spending delivered and unmet a path under APP, ROUTE and L. The share with APP's early ruins set aside:
 *      L's surviving paths less APP's, over ROUTE's less APP's, over the paths on which APP did not run out before the final year.
 *   B. PA2 against ROUTE: survival (paths lost and saved, whole paths), and lifetime tax on the four units the pricing names.
 *   REG=1 node research/solver/couples-trade-beside.mjs > research/solver/results-couples-trade-beside.txt
 */
import * as E from '../engine.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { readOpenPanel } from './couples-open-panel.mjs';
import { runRec, UNITS, CONTROLS, SEED, OUT_DEFAULT } from './audit-couples-trade.mjs';
import { loadDir, TRADE_UNITS, PRICING_UNITS } from './reduce-couples-trade.mjs';

if (process.env.REG !== '1') { console.error('couples-trade-beside: the registered panel, REG=1'); process.exit(2); }
const panel = Object.fromEntries(readOpenPanel().map(u => [u.id, u])), byId = Object.fromEntries(loadDir(OUT_DEFAULT).map(u => [u.id, u]));
const gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`, f3 = x => (Number.isFinite(x) ? x.toFixed(3) : 'n/a'), mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
console.log('THE COUPLES TRADE, BESIDE THE READ: post hoc, EXPLORATORY, deciding nothing (results-couples-trade.txt is the read)');
console.log(`APP re-run by the engine on seed ${SEED}'s paths for its year-by-year demand; no solve.`);
console.log('');
console.log('A. Where each unit\'s share is decided (the controls, then S037\'s units)');
for (const id of [...CONTROLS, ...TRADE_UNITS, 'S037-G12P']) {
  const u = byId[id], A = u.arms.APP, R = u.arms.ROUTE, L = u.arms.L, n = u.N;
  const { a } = solverPlanOf(panel[id].plan, 'own'), ctx = E.buildContext(E.resolveMpaa(a.planState)), T = ctx.totalYears, Y = T + 1;
  const paths = E.pathsForSeed(SEED, n, T).map(zs => Float64Array.from(zs)), lv = new Float64Array(n * Y);
  let same = 0;
  for (let k = 0; k < n; k++) {
    const rec = { demand: new Float64Array(Y), age: new Float64Array(Y) }, r = runRec(ctx, paths[k], rec);
    for (let t = 0; t < Y; t++) { const s = E.spendTargetAtAge(ctx, rec.age[t]) * (t === 0 ? ctx.yf : 1); lv[k * Y + t] = s > 0 ? rec.demand[t] / s : NaN; }
    if ((r.survived ? 1 : 0) === A.survived[k] && r.failYear === A.failYear[k] && r.tax === A.tax[k] && r.delivered === A.delivered[k] && r.unmet === A.unmet[k]) same++;
  }
  const early = k => !A.survived[k] && A.failYear[k] < T;
  const set = []; for (let k = 0; k < n; k++) if (R.survived[k] && !L.survived[k] && !A.survived[k]) set.push(k);
  const ran = set.filter(early), before = [], after = [];
  for (const k of ran) { const fy = A.failYear[k]; for (let t = Math.max(0, fy - 3); t < fy; t++) before.push(lv[k * Y + t]); for (let t = fy + 1; t < Y; t++) after.push(lv[k * Y + t]); }
  let l = 0, rr = 0; for (let k = 0; k < n; k++) if (!early(k)) { l += L.survived[k] - A.survived[k]; rr += R.survived[k] - A.survived[k]; }
  console.log(`  ${id.padEnd(10)} APP's re-run the stored on ${same} of ${n} paths. ROUTE keeps and L loses ${set.length} paths; APP ran out before the final year on ${ran.length} of them${ran.length ? `: APP's level ${f3(mean(before))} in the three years before its fail year, ${f3(mean(after))} in the ${after.length} years after; a path, APP delivered ${gbp(mean(ran.map(k => A.delivered[k])))} and left ${gbp(mean(ran.map(k => A.unmet[k])))} unmet, ROUTE delivered ${gbp(mean(ran.map(k => R.delivered[k])))}, L ${gbp(mean(ran.map(k => L.delivered[k])))}` : ''}. With APP's early ruins set aside (${Array.from({ length: n }, (_, k) => k).filter(early).length} paths), L keeps ${f3(rr > 0 ? l / rr : NaN)} (${l} of ${rr} paths net)`);
}
console.log('');
console.log('B. PA2 against ROUTE (whole paths; the arm\'s survival beside D34, which the read prints)');
let below = 0;
for (const id of UNITS) {
  const u = byId[id], Q = u.arms.PA2, R = u.arms.ROUTE; let lost = 0, saved = 0;
  for (let k = 0; k < u.N; k++) { if (R.survived[k] && !Q.survived[k]) lost++; else if (!R.survived[k] && Q.survived[k]) saved++; }
  if (saved - lost < 0) below++;
  console.log(`  ${id.padEnd(10)} PA2 loses ${lost} and saves ${saved} of ${u.N} against ROUTE (net ${saved - lost})`);
}
console.log(`  PA2 below ROUTE on ${below} of ${UNITS.length} units`);
{ let lost = 0, saved = 0; for (const id of PRICING_UNITS) { const u = byId[id]; for (let k = 0; k < u.N; k++) { if (u.arms.ROUTE.survived[k] && !u.arms.PA2.survived[k]) lost++; else if (!u.arms.ROUTE.survived[k] && u.arms.PA2.survived[k]) saved++; } }
  console.log(`  on the four the pricing names together: PA2 loses ${lost} and saves ${saved} of ${4 * byId[PRICING_UNITS[0]].N} unit-paths against ROUTE`); }
for (const id of PRICING_UNITS) { const u = byId[id]; console.log(`  ${id.padEnd(10)} lifetime tax a path: ROUTE ${gbp(mean(Array.from(u.arms.ROUTE.tax)))}, PA2 ${gbp(mean(Array.from(u.arms.PA2.tax)))}`); }
