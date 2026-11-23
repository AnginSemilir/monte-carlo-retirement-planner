/*
 * THE PRICING FIX, BESIDE THE READ (written after the read of 23 Nov, deciding nothing; PRICING-FIX.md, results-pricing-fix.txt).
 * From the read's own unit files (results/pricing-fix-7002), FIX against ROUTE:
 *   A. each unit's survival change in points with its interval by path, and the pooled change over the fourteen, over the
 *      thirteen without S191-90, and over S037's ten (the controls and S191-90 out);
 *   B. where the paths FIX loses fail: the plan year of each lost path's failure under FIX (its quartiles), beside the plan
 *      year of ROUTE's own failures on the paths it loses to FIX and of the paths both lose, and the last plan year any arm
 *      fails in; and the kind of each lost path's failure, read directly against the unit's own context (the household cut's,
 *      as the reviewer at the read took it: its minimum pot, solvencyFloor, and its last plan year, totalYears): spending
 *      unmet, or none unmet with the end pot below the minimum pot in the last plan year, or neither (REG=1: the units' plans
 *      from audit-pricing-fix.mjs unitsOf; the reviewer at the read, MINOR 4);
 *   C. on the paths FIX loses, FIX less ROUTE in lifetime spending delivered, lifetime tax and the end pot, a path;
 *   D. lifetime tax a path, FIX less ROUTE, each unit, and on the paths both keep;
 *   E. beside, the couples trade's PA2 (the household plan at the form 'pensions', the allowance two people's) against ROUTE on
 *      the same thirteen units and paths, from the trade's own unit files (results/couples-trade-7002), beside FIX against
 *      ROUTE: each unit's paths lost and saved, the totals and the pooled survival change by path (the reviewer at the read,
 *      finding 1), and the kind of each of PA2's lost paths' failures, read as section B reads FIX's (the reviewer's second
 *      look, MINOR 3);
 *   F. each unit's holdings in its taxable accounts (the GIA and cash), each person's, from the couple's plan as the solvers
 *      take it (the reviewer's second look, MINOR 1: both arms give the household two people's savings and dividend
 *      allowances, starting-rate band and CGT exempt amount, which the engine applies per person).
 *   REG=1 node research/solver/pricing-fix-beside.mjs [dir] > research/solver/results-pricing-fix-beside.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { householdCut } from '../../src/solverCouple.js';
import { solverPlanOf } from './shapes-panel.mjs';
import { FORM } from './couples-open-panel.mjs';
import { unitsOf } from './audit-pricing-fix.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDir } from './reduce-pricing-fix.mjs';
import { loadDir as loadTrade } from './reduce-couples-trade.mjs';
import { survivalItem } from './reduce-phase4.mjs';
import { UNITS, S191 } from './audit-pricing-fix.mjs';
import { S037_UNITS } from './audit-couples-trade.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] || join(HERE, 'results', 'pricing-fix-7002');
const units = loadDir(dir), byId = Object.fromEntries(units.map(u => [u.id, u])), n = units[0].N;
const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : 'n/a'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : 'n/a');
const sg = (x, f = f3) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${f(x)}` : 'n/a');
const gbp = x => (Number.isFinite(x) ? `${x < 0 ? '-' : '+'}£${Math.round(Math.abs(x)).toLocaleString('en-GB')}` : 'n/a');
const q = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const quart = a => (a.length ? `${q(a, 0.25)} / ${q(a, 0.5)} / ${q(a, 0.75)}` : 'none');
const mean = a => (a.length ? a.reduce((t, x) => t + x, 0) / a.length : NaN);
const pool = ids => survivalItem(ids.map(id => [byId[id].arms.FIX, byId[id].arms.ROUTE]), n);
const out = [];
out.push(`THE PRICING FIX, BESIDE THE READ (written after the read, deciding nothing): ${units.length} units, ${n} paths of seed ${units[0].seed}, code ${units[0].stamp.code}, audit ${units[0].stamp.audit}`);
out.push('');
out.push('A. FIX less ROUTE, survival in points (interval by path):');
for (const id of UNITS) { const s = survivalItem([[byId[id].arms.FIX, byId[id].arms.ROUTE]], n); out.push(`  ${id.padEnd(10)} ${sg(s.d)} (${sg(s.lo)} to ${sg(s.hi)})`); }
for (const [name, ids] of [['the fourteen', UNITS], ['the thirteen without S191-90', UNITS.filter(id => id !== S191)], ['S037\'s ten', S037_UNITS]]) { const p = pool(ids); out.push(`  pooled over ${name}: ${sg(p.d)} (${sg(p.lo)} to ${sg(p.hi)}, se ${f3(p.se)})`); }
out.push('');
out.push('B. Where the lost paths fail (plan years; quartiles 25% / 50% / 75%): the paths FIX loses (ROUTE keeps), FIX\'s failure year; the paths FIX saves, ROUTE\'s; the paths both lose, FIX\'s; and the last plan year any arm fails in:');
const allLost = [];
for (const id of UNITS) {
  const R = byId[id].arms.ROUTE, X = byId[id].arms.FIX, A = byId[id].arms.APP, lost = [], saved = [], both = [];
  let last = -1;
  for (let i = 0; i < n; i++) {
    for (const Z of [R, X, A]) if (!Z.survived[i]) last = Math.max(last, Z.failYear[i]);
    if (R.survived[i] && !X.survived[i]) lost.push(X.failYear[i]);
    else if (!R.survived[i] && X.survived[i]) saved.push(R.failYear[i]);
    else if (!R.survived[i] && !X.survived[i]) both.push(X.failYear[i]);
  }
  allLost.push(...lost.map(y => ({ id, y, last })));
  out.push(`  ${id.padEnd(10)} lost ${String(lost.length).padStart(2)}: ${quart(lost)} (the earliest ${lost.length ? Math.min(...lost) : 'none'}); saved ${saved.length}: ${quart(saved)}; both lose ${both.length}: ${quart(both)}; the last failure year ${last}`);
}
{ const rel = allLost.map(x => x.y / Math.max(1, x.last)), early = allLost.filter(x => x.y < x.last).length;
  out.push(`  every lost path, its failure year over its unit's last failure year: ${quart(rel.map(r => Math.round(100 * r) / 100))} (${allLost.length} paths); failing before their unit's last failure year: ${early}`); }
/* the kind of failure on the paths FIX loses, read against each unit's own context (the household cut's: its minimum pot and its
   last plan year): spending unmet (the money short in some year), or none unmet and the end pot below the minimum pot in the
   last plan year, or neither */
if (process.env.REG !== '1') { console.error('pricing-fix-beside: runs on the registered panel, REG=1'); process.exit(2); }
const unitCtx = (() => { const plans = Object.fromEntries(unitsOf().map(u => [u.id, u])), out = {};
  for (const id of UNITS) { const { hp } = solverPlanOf(plans[id].plan, 'own'), ctx = E.buildContext(E.resolveMpaa(householdCut(E, M, hp, FORM).household)); out[id] = { hp, floor: ctx.solvencyFloor, T: ctx.totalYears }; }
  return out; })();
/* the kind of each lost path's failure: spending unmet, or none unmet and the end pot below the minimum pot in the last plan
   year, or neither */
const kindsOf = (id, P, B) => { const { floor, T } = unitCtx[id], k = { unmet: 0, floor: 0, neither: 0, unmetYears: [] };
  for (let i = 0; i < n; i++) if (B.survived[i] && !P.survived[i]) { if (P.unmet[i] > 1) { k.unmet++; k.unmetYears.push(P.failYear[i]); } else if (P.pot[i] < floor && P.failYear[i] === T) k.floor++; else k.neither++; }
  return k; };
{ let unmet = 0, atFloor = 0, neither = 0, total = 0; const by = [];
  for (const id of UNITS) {
    const { floor, T } = unitCtx[id], R = byId[id].arms.ROUTE, X = byId[id].arms.FIX, unmetYears = [];
    let u = 0, f = 0, o = 0;
    for (let i = 0; i < n; i++) if (R.survived[i] && !X.survived[i]) {
      total++;
      if (X.unmet[i] > 1) { unmet++; u++; unmetYears.push(X.failYear[i]); }
      else if (X.pot[i] < floor && X.failYear[i] === T) { atFloor++; f++; }
      else { neither++; o++; }
    }
    by.push(`${id} (the minimum pot £${Math.round(floor).toLocaleString('en-GB')}, the last plan year ${T}): ${f} at the minimum pot, ${u} with spending unmet${u ? ` (in plan years ${[...new Set(unmetYears)].sort((a, b) => a - b).join(', ')})` : ''}, ${o} neither`);
  }
  out.push(`  the kind of failure on the ${total} paths FIX loses: ${atFloor} with no spending unmet and the end pot below the minimum pot in the last plan year, ${unmet} with spending unmet, ${neither} neither`);
  for (const b of by) out.push(`    ${b}`); }
out.push('');
out.push('C. On the paths FIX loses, FIX less ROUTE a path: lifetime spending delivered, lifetime tax, the end pot:');
for (const id of UNITS) {
  const R = byId[id].arms.ROUTE, X = byId[id].arms.FIX, idx = [];
  for (let i = 0; i < n; i++) if (R.survived[i] && !X.survived[i]) idx.push(i);
  if (!idx.length) { out.push(`  ${id.padEnd(10)} none lost`); continue; }
  out.push(`  ${id.padEnd(10)} ${idx.length} paths: spending ${gbp(mean(idx.map(i => X.delivered[i] - R.delivered[i])))}, tax ${gbp(mean(idx.map(i => X.tax[i] - R.tax[i])))}, end pot ${gbp(mean(idx.map(i => X.pot[i] - R.pot[i])))}`);
}
out.push('');
out.push('D. Lifetime tax a path, FIX less ROUTE: over every path, and on the paths both keep:');
for (const id of UNITS) {
  const R = byId[id].arms.ROUTE, X = byId[id].arms.FIX, all = [], kept = [];
  for (let i = 0; i < n; i++) { all.push(X.tax[i] - R.tax[i]); if (R.survived[i] && X.survived[i]) kept.push(X.tax[i] - R.tax[i]); }
  out.push(`  ${id.padEnd(10)} every path ${gbp(mean(all))}; the paths both keep ${gbp(mean(kept))}`);
}
out.push('');
out.push('E. Beside, the couples trade\'s PA2 against ROUTE on the same thirteen units and paths (results/couples-trade-7002), and FIX against ROUTE (paths lost / saved of N; survival in points):');
{ const trade = Object.fromEntries(loadTrade(join(HERE, 'results', 'couples-trade-7002')).map(u => [u.id, u])), ids = UNITS.filter(id => id !== S191);
  const ls = (P, B) => { let l = 0, sv = 0; for (let i = 0; i < n; i++) { if (B.survived[i] && !P.survived[i]) l++; else if (P.survived[i] && !B.survived[i]) sv++; } return [l, sv]; };
  let tq = [0, 0], tf = [0, 0];
  for (const id of ids) {
    const t = trade[id]; if (!t || t.N !== n || t.seed !== units[0].seed) { out.push(`  ${id}: the couples trade's unit missing or on other paths`); continue; }
    const q = ls(t.arms.PA2, t.arms.ROUTE), f = ls(byId[id].arms.FIX, byId[id].arms.ROUTE); tq = [tq[0] + q[0], tq[1] + q[1]]; tf = [tf[0] + f[0], tf[1] + f[1]];
    out.push(`  ${id.padEnd(10)} PA2 ${q[0]} / ${q[1]}; FIX ${f[0]} / ${f[1]}`);
  }
  const pq = survivalItem(ids.filter(id => trade[id]).map(id => [trade[id].arms.PA2, trade[id].arms.ROUTE]), n), pf = pool(ids);
  out.push(`  the thirteen: PA2 ${tq[0]} lost, ${tq[1]} saved, pooled ${sg(pq.d)} (${sg(pq.lo)} to ${sg(pq.hi)} by path); FIX ${tf[0]} lost, ${tf[1]} saved, pooled ${sg(pf.d)} (${sg(pf.lo)} to ${sg(pf.hi)} by path)`);
  out.push(`  the couples trade's ROUTE arrays are this read's on all ${n} paths of the thirteen (check 2), so the two arms are compared on the same ROUTE`);
  // the kind of each lost path's failure, PA2's beside FIX's
  const kq = ids.filter(id => trade[id]).map(id => [id, kindsOf(id, trade[id].arms.PA2, trade[id].arms.ROUTE)]), kf = ids.map(id => [id, kindsOf(id, byId[id].arms.FIX, byId[id].arms.ROUTE)]);
  const tot = ks => ks.reduce((a, [, k]) => ({ unmet: a.unmet + k.unmet, floor: a.floor + k.floor, neither: a.neither + k.neither }), { unmet: 0, floor: 0, neither: 0 });
  const tq2 = tot(kq), tf2 = tot(kf);
  out.push(`  the kind of each lost path's failure, read as section B reads it: PA2 ${tq2.floor} below the minimum pot in the last plan year, ${tq2.unmet} with spending unmet, ${tq2.neither} neither; FIX on the thirteen ${tf2.floor}, ${tf2.unmet}, ${tf2.neither}`);
  for (const [id, k] of kq) if (k.unmet || k.neither) out.push(`    PA2 on ${id}: ${k.unmet} with spending unmet (in plan years ${[...new Set(k.unmetYears)].sort((a, b) => a - b).join(', ')} of ${unitCtx[id].T}), ${k.neither} neither`); }
out.push('');
out.push('F. Each unit\'s taxable accounts, each person\'s (the GIA and cash balances in the couple\'s plan as the solvers take it):');
for (const id of UNITS) {
  const hp = unitCtx[id].hp, bal = (cat, owner) => hp.accounts.filter(a => a.category === cat && a.owner === owner).reduce((x, a) => x + (Number(a.balance) || 0), 0);
  const g = o => `GIA ${gbp(bal('Other Investments (e.g. GIA)', o)).replace('+', '')}, cash ${gbp(bal('Cash Savings', o)).replace('+', '')}`;
  out.push(`  ${id.padEnd(10)} the first person ${g('Myself')}; the partner ${g('Partner')}`);
}
console.log(out.join('\n'));
