/*
 * THE PRICING FIX, BESIDE THE READ (written after the read of 23 Nov, deciding nothing; PRICING-FIX.md, results-pricing-fix.txt).
 * From the read's own unit files (results/pricing-fix-7002), FIX against ROUTE:
 *   A. each unit's survival change in points with its interval by path, and the pooled change over the fourteen, over the
 *      thirteen without S191-90, and over S037's ten (the controls and S191-90 out);
 *   B. where the paths FIX loses fail: the plan year of each lost path's failure under FIX (its quartiles), beside the plan
 *      year of ROUTE's own failures on the paths it loses to FIX and of the paths both lose; and the lost paths' failure
 *      years against each unit's horizon (the last plan year any arm fails in, or the unit's years with a demand);
 *   C. on the paths FIX loses, FIX less ROUTE in lifetime spending delivered, lifetime tax and the end pot, a path;
 *   D. lifetime tax a path, FIX less ROUTE, each unit, and on the paths both keep.
 *   node research/solver/pricing-fix-beside.mjs [dir] > research/solver/results-pricing-fix-beside.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDir } from './reduce-pricing-fix.mjs';
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
/* the kind of failure on the paths FIX loses: spending unmet (the money ran out in some year) or none unmet and the end pot below
   the minimum pot (runRec: failYear the plan's last year); the plan's last year from the paths that keep (the most years run) */
{ let unmet = 0, floor = 0, total = 0; const by = [];
  for (const id of UNITS) {
    const R = byId[id].arms.ROUTE, X = byId[id].arms.FIX; let u = 0, f = 0;
    for (let i = 0; i < n; i++) if (R.survived[i] && !X.survived[i]) { total++; if (X.unmet[i] > 1) { unmet++; u++; } else { floor++; f++; } }
    if (u + f) by.push(`${id} ${f} at the minimum pot, ${u} with spending unmet`);
  }
  out.push(`  the kind of failure on the ${total} paths FIX loses: ${floor} with no spending unmet (the end pot below the minimum pot), ${unmet} with spending unmet (${by.join('; ')})`); }
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
console.log(out.join('\n'));
