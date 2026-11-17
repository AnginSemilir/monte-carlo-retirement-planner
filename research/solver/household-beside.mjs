/*
 * BESIDE THE LEAD TEST'S READ (EXPLORATORY, written after the read, deciding nothing; the read is results-household.txt,
 * made once by reduce-household.mjs). The figures the write-up needs that the reducer does not print, from the same unit
 * files with the reducer's own cells and stats.mjs survivalChange (HS5 less K2, paired by path): pooled survival without
 * the unit that loses most (S191-90) and without both it and the unit that gains most (S147-db, the reducer's own "without
 * its largest unit"); on the twelve units the review's pilot ran (results-pilot.txt on review/external-2026-10-21 at
 * f1f44727: HOUSE less K2 +1.72 there) and on the sixteen it did not; by group; and how each arm's lost paths fail (the
 * minimum pot at the plan's end with no year's spending short, or a year's spending short), pooled and on the units the
 * read names to place, with each one's end pot on the paths that end below the minimum pot.
 *   node research/solver/household-beside.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, cells, ARMS, spendOn } from './reduce-household.mjs';
import { survivalChange } from './stats.mjs';
import { UNITS } from './audit-household.mjs';
import { biasesNil } from './reduce-household.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'household-7002');
const PILOT = ['S205', 'S023-db', 'S061-dbpart', 'S191-dbpart', 'S271-db', 'S147-db', 'S149', 'S327F', 'S337F', 'S023-90', 'S109-90', 'S227-90'];
const PLACE = ['S333F', 'S335F', 'S191-90'], TOL = 1;   // the engine's FAIL_TOLERANCE: a year short by more than £1 fails
/* the household's minimum pot, as each unit's log printed the household table's settings */
const floorOf = id => { for (const f of readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x))) { const t = readFileSync(join(DIR, f), 'utf8'); if (t.includes(`: ${id} (`)) { const m = t.match(/\| household: .*? minPot (\d+)/); return m ? Number(m[1]) : NaN; } } return NaN; };
const ids = UNITS.map(u => u.id);
const units = readdirSync(DIR).filter(f => /\.json\.gz$/.test(f)).map(f => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); for (const a of ARMS) U.arms[a] = armOf(U.arms[a]); return U; }).sort((p, q) => ids.indexOf(p.id) - ids.indexOf(q.id));
if (units.length !== 28) { console.error(`household-beside: ${units.length} units, not 28`); process.exit(2); }
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;
const pooled = (list, base = 'K2', arm = 'HS5') => { let lost = 0, saved = 0, n = 0; for (const U of list) { const c = cells(U.arms[base], U.arms[arm]); lost += c.lost; saved += c.saved; n += c.N; } const r = survivalChange(lost, saved, n); return `${f3(r.d)} (${f3(r.lo)} to ${f3(r.hi)}) on ${list.length} units (${saved} saved, ${lost} lost)`; };
const not = (...out) => units.filter(U => !out.includes(U.id));
console.log(`BESIDE THE LEAD TEST'S READ (EXPLORATORY, after the read, deciding nothing): 28 units, seed ${units[0].seed}, ${units[0].N} paths; code ${units[0].stamp.code}, audit ${units[0].stamp.audit}; HS5 less K2 in survival points, paired by path (stats.mjs survivalChange)`);
console.log('\nA. pooled survival, with and without the units at either end');
console.log(`  all 28: ${pooled(units)}`);
console.log(`  without S147-db (the most saved, the reducer's "without its largest unit"): ${pooled(not('S147-db'))}`);
console.log(`  without S191-90 (the most lost): ${pooled(not('S191-90'))}`);
console.log(`  without both: ${pooled(not('S147-db', 'S191-90'))}`);
console.log(`  without the three units to place (${PLACE.join(', ')}): ${pooled(not(...PLACE))}`);
console.log('\nB. against the review\'s pilot (other seeds, 1,500 paths, HOUSE less K2: +1.72 on its twelve units)');
console.log(`  the pilot's twelve units: ${pooled(units.filter(U => PILOT.includes(U.id)))}; HOUSE less K2 on them here ${pooled(units.filter(U => PILOT.includes(U.id)), 'K2', 'HOUSE')}`);
console.log(`  the pilot's twelve without S147-db (the pilot's own "about +1.0 without S147-db"): ${pooled(units.filter(U => PILOT.includes(U.id) && U.id !== 'S147-db'))}`);
console.log(`  the sixteen it did not run: ${pooled(units.filter(U => !PILOT.includes(U.id)))}; without S191-90 ${pooled(units.filter(U => !PILOT.includes(U.id) && U.id !== 'S191-90'))}`);
console.log('\nC. by group');
const largestOf = L => { const by = L.map(U => { const c = cells(U.arms.K2, U.arms.HS5); return Math.abs(c.saved - c.lost); }); return L[by.indexOf(Math.max(...by))]; };
for (const g of ['younger', 'library', '90/10', 'feature']) { const L = units.filter(U => U.group === g), big = largestOf(L); console.log(`  ${g.padEnd(8)} ${pooled(L)}; without ${big.id} (its largest unit) ${pooled(L.filter(U => U !== big))}`); }
console.log('\nD. how the lost paths fail: at the minimum pot at the plan\'s end (failing in its last year with no year short), or a year\'s spending short');
const kind = (U, x, i) => (x.failYear[i] === x.T && x.unmet[i] <= TOL ? 'floor' : 'short');
const kinds = (a, L) => { let floor = 0, short = 0; for (const U of L) { const x = U.arms[a]; for (let i = 0; i < U.N; i++) if (!x.survived[i]) { if (kind(U, x, i) === 'floor') floor++; else short++; } } return `${floor} at the minimum pot, ${short} short`; };
for (const a of ARMS) console.log(`  ${a.padEnd(5)} over the 28 units: ${kinds(a, units)}; without S191-90: ${kinds(a, not('S191-90'))}`);
for (const id of PLACE) {
  const U = units.find(V => V.id === id), k = U.arms.K2, h = U.arms.HS5;
  let floor = 0, short = 0; const end = [];
  for (let i = 0; i < U.N; i++) if (k.survived[i] && !h.survived[i]) { if (kind(U, h, i) === 'floor') { floor++; end.push(h.pot[i]); } else short++; }
  end.sort((p, q) => p - q);
  const q = p => gbp(end[Math.min(end.length - 1, Math.floor(p * end.length))]);
  const kk = ['K2', 'HS5'].map(a => { let fl = 0, sh = 0; const x = U.arms[a]; for (let i = 0; i < U.N; i++) if (!x.survived[i]) { if (kind(U, x, i) === 'floor') fl++; else sh++; } return `${a} ${fl} at the minimum pot and ${sh} short`; }).join(', ');
  console.log(`  ${id}: the plan's last year ${h.T}, the household's minimum pot ${gbp(floorOf(id))}; of all its lost paths: ${kk}; of the ${floor + short} HS5 loses and K2 keeps: ${floor} at the minimum pot, ${short} short; the end pot on those at the minimum pot: the median ${end.length ? q(0.5) : '-'}, from ${end.length ? gbp(end[0]) : '-'} to ${end.length ? gbp(end[end.length - 1]) : '-'}`);
}
console.log('\nE. the pot counted up to the cap, HS5 against K2 by unit (the pilot: lower by 1.5% to 13% on about two units in three)');
{
  const pc = U => { let b = 0, x = 0; for (let i = 0; i < U.N; i++) { b += Math.min(U.arms.K2.pot[i], U.cap); x += Math.min(U.arms.HS5.pot[i], U.cap); } return 100 * (x / b - 1); };
  const P = units.map(U => ({ id: U.id, p: pc(U) })), lower = P.filter(q => q.p < 0), big = P.filter(q => q.p <= -1.5).sort((a, b) => a.p - b.p);
  console.log(`  lower on ${lower.length} of ${P.length} units, by 1.5% or more on ${big.length} (from ${(-big[big.length - 1].p).toFixed(3)}% to ${(-big[0].p).toFixed(3)}%: ${big.map(q => q.id).join(', ')}); higher on ${P.filter(q => q.p > 0).length}`);
}
console.log('\nF. every other pooled figure the read prints, with and without the unit that contributes most to it (by the size of its part of the pooled difference)');
{
  const sum = a => { let t = 0; for (const v of a) t += v; return t; };
  const surv = (b, x, L) => { let lost = 0, saved = 0, n = 0; const by = L.map(U => { const c = cells(U.arms[b], U.arms[x]); lost += c.lost; saved += c.saved; n += c.N; return c.saved - c.lost; }); return { r: survivalChange(lost, saved, n), by }; };
  const survLine = (b, x) => { const all = surv(b, x, units), i = all.by.map(Math.abs).indexOf(Math.max(...all.by.map(Math.abs))), w = surv(b, x, units.filter((U, j) => j !== i)).r, f = r => `${f3(r.d)} (${f3(r.lo)} to ${f3(r.hi)})`; return `${f(all.r)}; without ${units[i].id} ${f(w)}`; };
  const spendLine = (b, x, kept) => { const sp = spendOn(units.map(U => [U.arms[b], U.arms[x]]), kept), i = sp.by.map(q => Math.abs(q.D)).indexOf(Math.max(...sp.by.map(q => Math.abs(q.D)))); const w = spendOn(units.filter((U, j) => j !== i).map(U => [U.arms[b], U.arms[x]]), kept).pooled, f = r => `${(r.d >= 0 ? '+' : '') + r.d.toFixed(4)}% (${(r.lo >= 0 ? '+' : '') + r.lo.toFixed(4)} to ${(r.hi >= 0 ? '+' : '') + r.hi.toFixed(4)})`; return `${f(sp.pooled)}; without ${units[i].id} ${f(w)}`; };
  const sumLine = (b, x, key, pct) => { const d = units.map(U => sum(U.arms[x][key]) - sum(U.arms[b][key])), B = units.map(U => sum(U.arms[b][key])), n = units.map(U => U.N), i = d.map(Math.abs).indexOf(Math.max(...d.map(Math.abs)));
    const v = (I) => (pct ? 100 * sum(I.map(j => d[j])) / sum(I.map(j => B[j])) : sum(I.map(j => d[j])) / sum(I.map(j => n[j]))), all = units.map((U, j) => j), rest = all.filter(j => j !== i), f = y => (pct ? `${f3(y)}%` : `${y < 0 ? '-' : '+'}${gbp(Math.abs(y))} a path`); return `${f(v(all))}; without ${units[i].id} ${f(v(rest))}`; };
  const capLine = (b, x) => { const c = units.map(U => { let sb = 0, sx = 0; for (let i = 0; i < U.N; i++) { sb += Math.min(U.arms[b].pot[i], U.cap); sx += Math.min(U.arms[x].pot[i], U.cap); } return { sb, sx, n: U.N }; }), i = c.map(q => Math.abs(q.sx - q.sb)).indexOf(Math.max(...c.map(q => Math.abs(q.sx - q.sb))));
    const v = I => { const sb = sum(I.map(j => c[j].sb)), sx = sum(I.map(j => c[j].sx)), n = sum(I.map(j => c[j].n)); return `${f3(100 * (sx / sb - 1))}% (${sx < sb ? '-' : '+'}${gbp(Math.abs(sx - sb) / n)} a path)`; }; const all = c.map((q, j) => j); return `${v(all)}; without ${units[i].id} ${v(all.filter(j => j !== i))}`; };
  console.log(`  part 4's spending beside the pot, HS5 less K2, over every path: ${sumLine('K2', 'HS5', 'delivered', false)}`);
  console.log(`  part 5, lifetime tax, HS5 against HOUSE: ${sumLine('HOUSE', 'HS5', 'tax', true)}`);
  console.log(`  spending delivered over every path, HS5 against K2: ${spendLine('K2', 'HS5', false)}`);
  console.log(`  the split's search, HS1 less HS5: survival ${survLine('HS5', 'HS1')}; spending on the paths both keep ${spendLine('HS5', 'HS1', true)}; lifetime tax ${sumLine('HS5', 'HS1', 'tax', true)}`);
  console.log(`  HOUSE less K2: survival ${survLine('K2', 'HOUSE')}; spending on the paths both keep ${spendLine('K2', 'HOUSE', true)}; the capped pot ${capLine('K2', 'HOUSE')}`);
  console.log(`  HS5 against K2, lifetime tax over every path: ${sumLine('K2', 'HS5', 'tax', true)}`);
}
console.log('\nG. lifetime tax and the pot left, HS5 against K2, the mean a path: above the cap (both end above it) and at or below it (both at or below it, both kept), each with and without the unit that contributes most to the pooled difference in tax');
{
  const sets = (U, w) => { const b = U.arms.K2, x = U.arms.HS5, I = []; for (let i = 0; i < U.N; i++) { if (w === 'above' ? (b.pot[i] > U.cap && x.pot[i] > U.cap) : (b.pot[i] <= U.cap && x.pot[i] <= U.cap && b.survived[i] && x.survived[i])) I.push(i); } return I; };
  for (const w of ['above', 'at or below']) {
    const per = units.map(U => { const I = sets(U, w), b = U.arms.K2, x = U.arms.HS5; let tb = 0, tx = 0, pb = 0, px = 0; for (const i of I) { tb += b.tax[i]; tx += x.tax[i]; pb += b.pot[i]; px += x.pot[i]; } return { id: U.id, n: I.length, tb, tx, pb, px }; });
    const agg = L => { const n = L.reduce((t, q) => t + q.n, 0), f = k => L.reduce((t, q) => t + q[k], 0) / n; return `on ${n} paths, tax ${gbp(f('tx'))} against K2's ${gbp(f('tb'))}, the pot ${gbp(f('px'))} against ${gbp(f('pb'))}`; };
    const d = per.map(q => q.tx - q.tb), tot = d.reduce((t, v) => t + v, 0), i = d.map(Math.abs).indexOf(Math.max(...d.map(Math.abs)));
    console.log(`  ${w} the cap: ${agg(per)}; ${per[i].id} holds ${(100 * d[i] / tot).toFixed(1)}% of the pooled difference in tax; without it ${agg(per.filter((q, j) => j !== i))}`);
  }
}
console.log('\nH. the units whose biases are nil (reduce-household.mjs biasesNil): part 2 reads NO LEAD only on a unit of these');
{ const nil = units.filter(U => biasesNil(U.bias)); console.log(`  ${nil.map(U => U.id).join(', ') || 'none'} (${nil.length} of ${units.length})`); }
