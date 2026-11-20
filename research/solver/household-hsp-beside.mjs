/*
 * STEP 8, BESIDE THE READ (written after the registered read of 20 Nov, deciding nothing; registrations/household-hsp.md,
 * results-household-hsp.txt): figures the read does not print, from the run's stored arrays, by the read's own functions
 * (reduce-household-hsp.mjs loadDir, compare and keptSpend; reduce-phase4.mjs survivalItem, each interval by path):
 *   A. the pooled survival change, HSPA against K2, without its largest unit, and without each base couple in turn;
 *   B. by base couple and by shape (the unit's variant): the pooled survival change and spending on the paths both keep;
 *   C. the units whose change lies wholly below nought, or wholly above it, each with D34's net loss and its threshold;
 *   D. each arm's table forecast at the start against the survival the engine delivers on the unit's paths;
 *   E. lifetime tax, HSPA against K2, by unit;
 *   F. the pot capped at the two people's estate caps (as the read's cappedOf takes it), HSPA against K2, by unit;
 *   G. the units where HSPA keeps fewer paths at its point: survival, the capped pot and lifetime tax together, and
 *      whether the interval reaches past a quarter point (the loss D34 calls harm at most 5% of the time);
 *   H. the pot left uncapped, the mean and the median a path, HSPA against K2, by unit (the reviewer at the read, MINOR 3).
 * K2's forecast is the product of the two people's own tables at the start, each table planning its own part (the audit's
 * forecast.K2), so it is no forecast of the household; HSPA's is its one table's.
 *   node research/solver/household-hsp-beside.mjs [dir] > research/solver/results-household-hsp-beside.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { loadDir, compare, keptSpend } from './reduce-household-hsp.mjs';
import { survivalItem } from './reduce-phase4.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'household-hsp-run');
if (!existsSync(DIR)) { console.error(`household-hsp-beside: no ${DIR}`); process.exit(2); }
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const mean = a => sum(a) / a.length;
const gbp = x => `${x < 0 ? '-' : ''}£${Math.abs(Math.round(x)).toLocaleString('en-GB')}`;

const units = loadDir(DIR).sort((a, b) => (a.id < b.id ? -1 : 1));
const n = units[0].N;
if (units.some(u => u.N !== n)) throw new Error('household-hsp-beside: the units run more than one count of paths');
const pairs = us => us.map(u => [u.arms.HSPA, u.arms.K2]);
const C = compare(units, 'K2'), rowOf = id => C.rows.find(r => r.id === id);
const surv = A => 100 * sum(A.survived) / A.survived.length;
const out = [];
const log = s => out.push(s);

log(`STEP 8, BESIDE THE READ (written after the read, deciding nothing): ${units.length} units of ${n} paths from ${DIR}`);
log(`  the read's pooled survival change, HSPA against K2, recomputed here: ${iv(C.pooled)}; spending on the paths both keep ${iv(C.kept.pooled, f4)}%`);

// A. without its largest unit, and without each base couple in turn
const top = [...C.rows].sort((a, b) => b.ch.d - a.ch.d)[0];
log('');
log('A. THE POOLED SURVIVAL CHANGE WITHOUT PART OF THE PANEL (HSPA against K2, by path)');
log(`  without its largest unit (${top.id}, ${f3(top.ch.d)}): ${iv(survivalItem(pairs(units.filter(u => u.id !== top.id)), n))} over ${units.length - 1} units`);
const bases = [...new Set(units.map(u => u.base))];
for (const b of bases) {
  const rest = units.filter(u => u.base !== b);
  log(`  without ${b}'s ${units.length - rest.length} units: ${iv(survivalItem(pairs(rest), n))}`);
}

// B. by base couple and by shape
const groupLine = (label, us) => `  ${label.padEnd(10)} ${String(us.length).padStart(2)} units: survival ${iv(survivalItem(pairs(us), n))}; spending on the paths both keep ${iv(keptSpend(us, 'K2', 'HSPA', n), f4)}%; units below nought ${us.filter(u => rowOf(u.id).ch.d < 0).length}`;
log('');
log('B. BY BASE COUPLE AND BY SHAPE (HSPA against K2, each group pooled by path)');
for (const b of bases) log(groupLine(b, units.filter(u => u.base === b)));
const variants = [...new Set(units.map(u => u.variant))];
for (const v of variants) log(groupLine(`shape ${v}`, units.filter(u => u.variant === v)));

// C. the units wholly below nought or wholly above it
const below = C.rows.filter(r => r.ch.hi < 0), above = C.rows.filter(r => r.ch.lo > 0), across = C.rows.filter(r => r.ch.lo <= 0 && r.ch.hi >= 0);
log('');
log('C. THE UNITS BY THEIR CHANGE\'S INTERVAL (HSPA against K2)');
log(`  wholly above nought ${above.length}, across nought ${across.length}, wholly below nought ${below.length}`);
for (const r of below) log(`  wholly below: ${r.id.padEnd(13)} ${iv(r.ch)} (${r.cells.saved} saved, ${r.cells.lost} lost); D34: net loss ${r.lost - r.saved} paths against its threshold ${r.j}${r.flag ? ' FLAGGED' : ', not flagged'}`);
for (const r of across.filter(x => x.ch.d < 0)) log(`  across, below nought at its point: ${r.id.padEnd(13)} ${iv(r.ch)} (${r.cells.saved} saved, ${r.cells.lost} lost); D34: net loss ${r.lost - r.saved} against ${r.j}`);

// D. each table's forecast at the start against the survival the engine delivers
log('');
log('D. EACH TABLE\'S FORECAST AT THE START LESS THE SURVIVAL THE ENGINE DELIVERS, IN POINTS');
for (const a of ['K2', 'HSPA']) {
  const g = units.map(u => ({ id: u.id, gap: 100 * u.arms[a].forecast - surv(u.arms[a]) })), abs = g.map(x => Math.abs(x.gap));
  const lo = g.reduce((p, q) => (q.gap < p.gap ? q : p)), hi = g.reduce((p, q) => (q.gap > p.gap ? q : p));
  log(`  ${a.padEnd(4)}: the mean ${f3(mean(g.map(x => x.gap)))}, the mean size ${mean(abs).toFixed(3)}; within one point on ${abs.filter(x => x <= 1).length} of ${units.length} units; from ${f3(lo.gap)} (${lo.id}) to ${f3(hi.gap)} (${hi.id})`);
}

// E. lifetime tax by unit
log('');
log('E. LIFETIME TAX, HSPA AGAINST K2, THE MEAN A PATH');
const tx = units.map(u => ({ id: u.id, k2: mean(u.arms.K2.tax), h: mean(u.arms.HSPA.tax) })).map(x => ({ ...x, pct: x.k2 > 0 ? 100 * (x.h / x.k2 - 1) : 0 }));
log(`  lower under HSPA on ${tx.filter(x => x.h < x.k2).length} of ${units.length} units; the units' mean change ${f3(mean(tx.map(x => x.pct)))}%, from ${f3(Math.min(...tx.map(x => x.pct)))}% to ${f3(Math.max(...tx.map(x => x.pct)))}%`);
for (const x of tx.filter(y => y.h > y.k2)) log(`  higher under HSPA: ${x.id.padEnd(13)} K2 ${gbp(x.k2)}, HSPA ${gbp(x.h)} (${f3(x.pct)}%)`);

// F. the pot capped at the two people's estate caps, by unit
log('');
log('F. THE POT CAPPED AT THE TWO PEOPLE\'S ESTATE CAPS, HSPA AGAINST K2 (the mean a path; the read\'s cappedOf)');
const capped = (cap, A) => { let t = 0; for (let i = 0; i < A.pot.length; i++) t += Math.min(A.pot[i], cap); return t / A.pot.length; };
const cp = units.map(u => { const cap = u.caps[0] + u.caps[1], b = capped(cap, u.arms.K2), x = capped(cap, u.arms.HSPA); return { id: u.id, pct: b > 0 ? 100 * (x / b - 1) : 0, gbp: x - b }; });
log(`  lower under HSPA on ${cp.filter(x => x.pct < 0).length} of ${units.length} units; the units' mean ${f3(mean(cp.map(x => x.pct)))}% (${gbp(mean(cp.map(x => x.gbp)))} a path)`);
for (const x of cp.filter(y => y.pct >= 0)) log(`  not lower under HSPA: ${x.id.padEnd(13)} ${f3(x.pct)}% (${gbp(x.gbp)} a path)`);

// G. the units below nought at their point: survival, the capped pot and lifetime tax together
log('');
log('G. THE UNITS WHERE HSPA KEEPS FEWER PATHS AT ITS POINT: SURVIVAL, THE CAPPED POT AND LIFETIME TAX (HSPA against K2)');
const capOf = id => cp.find(x => x.id === id), taxOf = id => tx.find(x => x.id === id);
{ const below0 = C.rows.filter(x => x.ch.d < 0);
  log(`  below nought at its point: ${below0.length} units; the capped pot lower on ${below0.filter(r => capOf(r.id).pct < 0).length}, lifetime tax higher on ${below0.filter(r => taxOf(r.id).pct > 0).length}`); }
for (const r of C.rows.filter(x => x.ch.d < 0)) {
  const c = capOf(r.id), t = taxOf(r.id);
  log(`  ${r.id.padEnd(13)} survival ${iv(r.ch)}${r.ch.hi < 0 ? ' (wholly below nought)' : ''}${r.ch.lo < -0.25 ? ', its interval reaching past -0.25' : ''}${r.ch.d < -0.25 ? ', its point past -0.25' : ''}; the capped pot ${f3(c.pct)}%; lifetime tax ${f3(t.pct)}%`);
}

// H. the pot left uncapped, the mean and the median a path
log('');
log('H. THE POT LEFT UNCAPPED, HSPA AGAINST K2, BY UNIT (the mean a path, and the median a path)');
const med = A => { const a = Float64Array.from(A).sort(), n = a.length; return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2; };
const up = units.map(u => { const mk = mean(u.arms.K2.pot), mh = mean(u.arms.HSPA.pot), dk = med(u.arms.K2.pot), dh = med(u.arms.HSPA.pot); return { id: u.id, meanPct: mk > 0 ? 100 * (mh / mk - 1) : 0, medPct: dk > 0 ? 100 * (dh / dk - 1) : 0, mk, mh, dk, dh }; });
log(`  the mean a path higher under HSPA on ${up.filter(x => x.mh > x.mk).length} of ${units.length} units; the median a path lower under HSPA on ${up.filter(x => x.dh < x.dk).length} of ${units.length}`);
log(`  the units' mean of the mean a path: K2 ${gbp(mean(up.map(x => x.mk)))}, HSPA ${gbp(mean(up.map(x => x.mh)))}; the units' mean of the median a path: K2 ${gbp(mean(up.map(x => x.dk)))}, HSPA ${gbp(mean(up.map(x => x.dh)))}`);
for (const id of ['S273-90']) { const x = up.find(y => y.id === id); if (x) log(`  ${id}: the mean a path ${f3(x.meanPct)}% (K2 ${gbp(x.mk)}, HSPA ${gbp(x.mh)}); the median a path ${f3(x.medPct)}% (K2 ${gbp(x.dk)}, HSPA ${gbp(x.dh)}); the capped pot ${f3(capOf(id).pct)}%`); }

console.log(out.join('\n'));
