/*
 * THE REVIEW'S PILOT, READ (17 Nov; EXPLORATORY, deciding nothing). Reads pilot.mjs's unit files and prints, for each unit
 * and pooled: each arm's survival and the paired difference from K2 with its 95% interval (saved less lost over the paths,
 * the paired standard error, 1.96 of it either way); where the failures fall (running short, or ending below the minimum
 * pot); spending delivered and the pot left against K2's on the paths both keep; the forecasts beside the survival they
 * forecast; the solve's seconds and CPU a path.
 * The arms: K2 today's default; HOUSE design A as the lead test runs it; H1, H6 its top one and top six moves; HS9 nine
 * splits; H0 its top one move at the even split; HT0, HT5 the move from the single solver's own chooser with the tie-break
 * above the cap on, at the even split and at the best of five; HOUSEC design A with the capital gains band put right; CEIL
 * (CEILC) the household table on its own single plan.
 *   node research/reviews/2026-11-17/scripts/pilot-read.mjs [directory]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, '..', 'units', 'pilot-99003-45');
const ORDER = ['S205', 'S223', 'S109-sppart', 'S227-sppart', 'S023-db', 'S061-dbpart', 'S191-dbpart', 'S271-db', 'S147-db', 'S377-dbpart', 'S149', 'S167', 'S327F', 'S329F', 'S331F', 'S333F', 'S335F', 'S337F', 'S341F', 'S343F', 'S023-90', 'S061-90', 'S109-90', 'S147-90', 'S191-90', 'S227-90', 'S271-90', 'S377-90'];
const CAPS = existsSync(join(DIR, '..', 'caps.json')) ? JSON.parse(readFileSync(join(DIR, '..', 'caps.json'))) : {};
const rank = id => ORDER.indexOf(String(id).split('@')[0]) + (String(id).includes('@') ? 0.5 : 0);
const units = readdirSync(DIR).filter(f => f.endsWith('.json') || f.endsWith('.json.gz')).map(f => JSON.parse(f.endsWith('.gz') ? gunzipSync(readFileSync(join(DIR, f))).toString() : readFileSync(join(DIR, f)))).sort((a, b) => rank(a.id) - rank(b.id) || String(a.id).localeCompare(String(b.id)));
// the estate cap (the two tables' together; the household table's is the same figure): the unit's own where pilot-extra.mjs
// stored it, else caps.mjs's; where both are there they must agree
for (const u of units) {
  const own = u.cap || u.houseCap || null, c = CAPS[u.id] ? CAPS[u.id].cap : null;
  if (own && c && Math.abs(own - c) > 1) throw new Error(`pilot-read: ${u.id}: the cap stored at 45 points (${own}) is not caps.mjs's (${c})`);
  u.capUsed = own || c || null;
}
const sum = xs => xs.reduce((a, b) => a + b, 0), mean = xs => sum(xs) / xs.length;
const med = xs => { const s = [...xs].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (x, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
/* the paired difference in survival, arm less base, in points, with its interval */
function paired(a, b) {
  const n = a.length; let saved = 0, lost = 0;
  for (let i = 0; i < n; i++) { if (a[i] && !b[i]) saved++; else if (!a[i] && b[i]) lost++; }
  const d = (saved - lost) / n, se = Math.sqrt(Math.max(0, (saved + lost) / n - d * d) / n);
  return { saved, lost, n, d: 100 * d, lo: 100 * (d - 1.96 * se), hi: 100 * (d + 1.96 * se) };
}
const armsSeen = [...new Set(units.flatMap(u => Object.keys(u.arms)))];
const seed = units[0].seed, n = units[0].n, pts = units[0].pts;
console.log(`THE REVIEW'S PILOT (17 Nov; EXPLORATORY, deciding nothing; not the lead test of HOUSEHOLD.md section 5): ${units.length} units of the lead test's panel${units.some(u => String(u.id).includes('@')) ? ' (a unit named id@variant is the panel\'s changed in one way: gap8 the partner eight years younger, penB90 the partner holding 90% of the pensions, even the two the same age)' : ''}, seed ${seed}, ${n} paths a unit, ${pts} points; the arms ${armsSeen.join(', ')}`);

console.log('\n1. SURVIVAL: each arm, and its paired difference from K2 (points; saved / lost paths; the 95% interval)');
for (const u of units) {
  const k2 = u.arms.K2;
  const parts = Object.entries(u.arms).map(([arm, A]) => {
    const s = 100 * sum(A.survived) / u.n, late = A.failYear.filter((y, i) => !A.survived[i] && y === u.T).length, fails = u.n - sum(A.survived);
    if (arm === 'K2' || !k2) return `${arm} ${s.toFixed(2)}% (${fails} fail, ${late} at the minimum pot)`;
    if (arm === 'CEIL' || arm === 'CEILC') return `${arm} ${s.toFixed(2)}%`;
    const p = paired(A.survived, k2.survived);
    return `${arm} ${s.toFixed(2)}% ${pct(p.d)} (${p.saved}/${p.lost}; ${pct(p.lo)} to ${pct(p.hi)}; ${fails} fail, ${late} at the minimum pot)`;
  });
  console.log(`  ${u.id.padEnd(12)} ${u.group.padEnd(8)} locked ${u.bias.lockedYears}, pensions ${u.bias.penShareSelf.toFixed(2)}, share ${u.share} | ${parts.join(' | ')}`);
}
const pool = (arm, pick = () => true) => {
  const us = units.filter(u => u.arms[arm] && u.arms.K2 && pick(u));
  if (!us.length) return null;
  const a = us.flatMap(u => u.arms[arm].survived), b = us.flatMap(u => u.arms.K2.survived);
  return { ...paired(a, b), units: us.length };
};
console.log('  pooled over the units an arm ran on (every path equal):');
for (const arm of armsSeen.filter(x => x !== 'K2' && x !== 'CEIL' && x !== 'CEILC')) {
  const all = pool(arm); if (!all) continue;
  const groups = [...new Set(units.map(u => u.group))].map(g => [g, pool(arm, u => u.group === g)]).filter(([, p]) => p);
  console.log(`    ${arm.padEnd(5)} less K2: ${pct(all.d)} points (${pct(all.lo)} to ${pct(all.hi)}) on ${all.units} units, ${all.saved} saved and ${all.lost} lost of ${all.n}; by group: ${groups.map(([g, p]) => `${g} ${pct(p.d)} (${pct(p.lo)} to ${pct(p.hi)}; ${p.units})`).join(', ')}`);
}
{
  // the width of the household's move, against design A as the lead test runs it
  for (const arm of ['H1', 'H6', 'HS9', 'H0', 'HT0', 'HT5', 'HOUSEC']) {
    const us = units.filter(u => u.arms[arm] && u.arms.HOUSE);
    if (!us.length) continue;
    const p = paired(us.flatMap(u => u.arms[arm].survived), us.flatMap(u => u.arms.HOUSE.survived));
    console.log(`    ${arm.padEnd(6)} less HOUSE: ${pct(p.d)} points (${pct(p.lo)} to ${pct(p.hi)}) on ${us.length} units (${us.map(u => u.id).join(', ')}), ${p.saved} saved and ${p.lost} lost of ${p.n}`);
  }
}

{
  const us = units.filter(u => u.arms.HT5 && u.arms.HT0);
  if (us.length) { const p = paired(us.flatMap(u => u.arms.HT5.survived), us.flatMap(u => u.arms.HT0.survived)); console.log(`    HT5    less HT0: ${pct(p.d)} points (${pct(p.lo)} to ${pct(p.hi)}) on ${us.length} units (${us.map(u => u.id).join(', ')}), ${p.saved} saved and ${p.lost} lost of ${p.n}`); }
}

console.log('\n2. SPENDING DELIVERED AND THE POT LEFT, each arm against K2: spending, the median pot and lifetime tax on the paths both keep (so a failure\'s lost spending is not in it); the capped pot as JOINT-WIDE\'s rule takes it (every path, the pot counted up to the estate cap; its bar there a unit 0.5% lower)');
for (const u of units) {
  const baseArm = u.arms.K2 ? 'K2' : 'HOUSE', k2 = u.arms[baseArm]; if (!k2) continue;
  const parts = Object.entries(u.arms).filter(([arm]) => arm !== baseArm).map(([arm, A]) => {
    const both = A.survived.map((s, i) => (s && k2.survived[i] ? i : -1)).filter(i => i >= 0);
    const dS = 100 * (sum(both.map(i => A.delivered[i])) / sum(both.map(i => k2.delivered[i])) - 1);
    const mP = 100 * (med(both.map(i => A.wealth[i])) / med(both.map(i => k2.wealth[i])) - 1), tx = 100 * (sum(both.map(i => A.tax[i])) / Math.max(1, sum(both.map(i => k2.tax[i]))) - 1);
    const all = 100 * (sum(A.delivered) / sum(k2.delivered) - 1);
    // JOINT-WIDE's capped pot (reduce-joint-wide.mjs): the mean over every path of the pot left, counted up to the cap
    const cp = u.capUsed ? 100 * (mean(A.wealth.map(v => Math.min(v, u.capUsed))) / mean(k2.wealth.map(v => Math.min(v, u.capUsed))) - 1) : NaN;
    const above = u.capUsed ? `${(100 * k2.wealth.filter(v => v > u.capUsed).length / u.n).toFixed(0)}% and ${(100 * A.wealth.filter(v => v > u.capUsed).length / u.n).toFixed(0)}%` : '-';
    // the trade in pounds a path, over every path: the spending delivered over the plan, and the pot left counted up to the cap
    const gbp = x => `${x < 0 ? '-' : '+'}£${Math.round(Math.abs(x)).toLocaleString('en-GB')}`;
    const dSp = mean(A.delivered) - mean(k2.delivered), dCp = u.capUsed ? mean(A.wealth.map(v => Math.min(v, u.capUsed))) - mean(k2.wealth.map(v => Math.min(v, u.capUsed))) : NaN;
    return `${arm}: spending ${pct(dS, 3)}% (every path ${pct(all, 3)}%), the median pot ${pct(mP, 1)}%, the capped pot ${pct(cp, 1)}% (paths ending above the cap, ${baseArm} and ${arm}: ${above}), lifetime tax ${pct(tx, 1)}%; in pounds a path: spending ${gbp(dSp)} over the plan, the capped pot ${gbp(dCp)}`;
  });
  console.log(`  ${u.id.padEnd(12)} against ${baseArm}: ${parts.join(' | ')}`);
}

console.log('\n3. THE FORECASTS AT THE START beside the survival they forecast (the household table read where the household opens; the two tables\' product)');
for (const u of units) {
  const s = arm => (u.arms[arm] ? `${(100 * sum(u.arms[arm].survived) / u.n).toFixed(2)}%` : '-');
  console.log(`  ${u.id.padEnd(12)} the household table ${(100 * u.forecast.HOUSE).toFixed(2)}%, HOUSE on the couple ${s('HOUSE')}, the same table on its own single plan (CEIL) ${s('CEIL')}${u.forecast.HOUSEC !== undefined ? `; with the capital gains band put right ${(100 * u.forecast.HOUSEC).toFixed(2)}%, HOUSEC ${s('HOUSEC')}` : ''} | the two tables ${u.forecast.K2 !== undefined ? (100 * u.forecast.K2).toFixed(2) + '%' : '-'} (${u.forecast.K2self !== undefined ? u.forecast.K2self.toFixed(3) + ' x ' + u.forecast.K2part.toFixed(3) : '-'}), K2 ${s('K2')}`);
}
{
  const gH = units.filter(u => u.arms.HOUSE).map(u => Math.abs(100 * u.forecast.HOUSE - 100 * sum(u.arms.HOUSE.survived) / u.n));
  const gK = units.filter(u => u.arms.K2 && u.forecast.K2 !== undefined).map(u => Math.abs(100 * u.forecast.K2 - 100 * sum(u.arms.K2.survived) / u.n));
  console.log(`  the forecast's distance from its own arm's survival: the household table a mean ${mean(gH).toFixed(2)} points (the largest ${Math.max(...gH).toFixed(2)}); the two tables' product a mean ${mean(gK).toFixed(2)} (the largest ${Math.max(...gK).toFixed(2)})`);
}

console.log('\n4. THE TIME (this machine, four units at a time, so each figure is rough; CPU a path is the process\'s own)');
for (const u of units) {
  const c = arm => (u.arms[arm] ? u.arms[arm].cpuMs : NaN), k = u.arms.K2 ? c('K2') : c('HOUSE'), kn = u.arms.K2 ? 'K2' : 'HOUSE';
  console.log(`  ${u.id.padEnd(12)} T ${u.T}: solved ${u.arms.K2 ? `K2 ${u.solveSecs.K2.toFixed(0)} s, ` : ''}HOUSE ${u.solveSecs.HOUSE.toFixed(0)} s${u.arms.K2 ? ` (x${(u.solveSecs.HOUSE / u.solveSecs.K2).toFixed(2)})` : ''}; CPU a path ${Object.keys(u.arms).map(arm => `${arm} ${c(arm).toFixed(0)} ms${arm !== kn && k ? ` (x${(c(arm) / k).toFixed(2)} of ${kn}'s)` : ''}`).join(', ')}`);
}
{
  const us = units.filter(u => u.arms.K2 && u.arms.HOUSE);
  if (us.length) console.log(`  over ${us.length} units: the household's solve x${mean(us.map(u => u.solveSecs.HOUSE / u.solveSecs.K2)).toFixed(2)} of the two tables' (from x${Math.min(...us.map(u => u.solveSecs.HOUSE / u.solveSecs.K2)).toFixed(2)} to x${Math.max(...us.map(u => u.solveSecs.HOUSE / u.solveSecs.K2)).toFixed(2)}); the prototype's path x${mean(us.map(u => u.arms.HOUSE.cpuMs / u.arms.K2.cpuMs)).toFixed(2)} of K2's (from x${Math.min(...us.map(u => u.arms.HOUSE.cpuMs / u.arms.K2.cpuMs)).toFixed(2)} to x${Math.max(...us.map(u => u.arms.HOUSE.cpuMs / u.arms.K2.cpuMs)).toFixed(2)})`);
  const w = units.filter(u => u.arms.H1 && u.arms.HOUSE && u.arms.H6);
  if (w.length) console.log(`  the prototype's cost of a candidate, from its widths (H1 tries 5 a decision, HOUSE 15, H6 30): ${w.map(u => `${u.id} ${((u.arms.HOUSE.cpuMs - u.arms.H1.cpuMs) / 10).toFixed(1)} and ${((u.arms.H6.cpuMs - u.arms.HOUSE.cpuMs) / 15).toFixed(1)} ms a path, the rest ${(u.arms.H1.cpuMs - 5 * (u.arms.HOUSE.cpuMs - u.arms.H1.cpuMs) / 10).toFixed(0)} ms`).join('; ')}`);
}

console.log('\n5. THE SAME AS A TABLE (for ANSWERS.md; every figure above)');
console.log('| unit | group | K2 | HOUSE | HOUSE less K2, points (95%) | spending | the capped pot | the household table\'s forecast, and HOUSE | the two tables\' forecast, and K2 |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const u of units) {
  const k2 = u.arms.K2, h = u.arms.HOUSE; if (!k2 || !h) continue;
  const sv = A => 100 * sum(A.survived) / u.n, p = paired(h.survived, k2.survived);
  const both = h.survived.map((x, i) => (x && k2.survived[i] ? i : -1)).filter(i => i >= 0);
  const dS = 100 * (sum(both.map(i => h.delivered[i])) / sum(both.map(i => k2.delivered[i])) - 1);
  const cp = u.capUsed ? 100 * (mean(h.wealth.map(v => Math.min(v, u.capUsed))) / mean(k2.wealth.map(v => Math.min(v, u.capUsed))) - 1) : NaN;
  console.log(`| ${u.id} | ${u.group} | ${sv(k2).toFixed(2)}% | ${sv(h).toFixed(2)}% | \`${pct(p.d)}\` (${pct(p.lo)} to ${pct(p.hi)}) | \`${pct(dS, 2)}%\` | \`${pct(cp, 1)}%\` | ${(100 * u.forecast.HOUSE).toFixed(1)}%, ${sv(h).toFixed(1)}% | ${(100 * u.forecast.K2).toFixed(1)}%, ${sv(k2).toFixed(1)}% |`);
}
