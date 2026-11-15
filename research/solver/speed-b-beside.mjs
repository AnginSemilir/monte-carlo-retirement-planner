/*
 * BESIDE THE SPEED MODE'S WIDER READ (SPEED-B.md; D97 (3); EXPLORATORY, seed 7002), written after the read and deciding
 * nothing. It reads the same units the reducer read (results/speed-b-7002) through the reducer's own functions and prints the
 * items the rule names beside it, and what bears on reading part 2 and part 3:
 *   A. each unit's survival change with its 95% interval (part 2's bar is the interval's upper end against -0.3);
 *   B. each group's cohorts apart (survival pooled, spending pooled, the pot and the capped pot, the time);
 *   C. each unit's lifetime tax in pounds, both arms, and the engine's milliseconds a path, both arms;
 *   D. for the couples, part 3 without each one couple in turn (which couples carry the pooled spending change).
 *   node research/solver/speed-b-beside.mjs [dir]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, rule, GROUPS } from './reduce-speed-b.mjs';
import { pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'speed-b-7002');
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
const byKind = k => units.filter(U => U.kind === k).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
console.log(`BESIDE THE SPEED MODE'S WIDER READ (EXPLORATORY, written after the read, deciding nothing): ${units.length} units of ${DIR.split('/').slice(-1)[0]}, ${units[0].N} paths each`);

console.log(`\nA. Each unit's survival change, SPEED less WHOLE, with its 95% interval (part 2: no interval wholly below -0.3):`);
for (const k of GROUPS) {
  const R = rule(byKind(k)), near = [...R.H].sort((a, b) => a.ch.hi - b.ch.hi).slice(0, 3);
  console.log(`  ${k}s: ${R.H.map(h => `${h.id} ${f(h.ch.d)} (${f(h.ch.lo)} to ${f(h.ch.hi)})`).join('; ')}`);
  console.log(`    the three intervals whose upper end is lowest: ${near.map(h => `${h.id} ${f(h.ch.hi)}`).join(', ')}`);
}

console.log(`\nB. Each group's cohorts apart (SPEED against WHOLE):`);
for (const k of GROUPS) {
  for (const cohort of [...new Set(byKind(k).map(U => U.cohort))]) {
    const us = byKind(k).filter(U => U.cohort === cohort), R = rule(us);
    console.log(`  ${k}s, ${cohort} (${us.length}: ${us.map(U => U.id).join(', ')}): survival ${f(R.pooled.d)} (${f(R.pooled.lo)} to ${f(R.pooled.hi)}), spending ${f(R.spend, 4)}%, the pot ${f(R.potP)}%, the capped pot ${f(R.cappedP)}%, a path's time the median x${R.time[R.time.length >> 1].toFixed(2)}`);
  }
}

console.log(`\nC. Each unit's lifetime tax (the mean a path) and the engine's milliseconds a path, WHOLE and SPEED (the units ran four at a time: the times are a guide):`);
for (const k of GROUPS) console.log(`  ${k}s: ${byKind(k).map(U => `${U.id} ${gbp(mean(U.arms.WHOLE.tax))} to ${gbp(mean(U.arms.SPEED.tax))}, ${U.arms.WHOLE.ms.toFixed(1)} to ${U.arms.SPEED.ms.toFixed(1)} ms`).join('; ')}`);

console.log(`\nD. The couples' part 3 (pooled spending delivered within 0.05%) without each couple in turn:`);
{
  const cs = byKind('couple'), spend = us => 100 * (sum(us.map(U => sum(U.arms.SPEED.delivered))) / sum(us.map(U => sum(U.arms.WHOLE.delivered))) - 1);
  console.log(`  all ${cs.length}: ${f(spend(cs), 4)}%`);
  console.log(`  without one: ${cs.map(U => `${U.id} ${f(spend(cs.filter(x => x !== U)), 4)}%`).join(', ')}`);
  const within = cs.filter(U => Math.abs(spend(cs.filter(x => x !== U))) <= 0.05).map(U => U.id);
  console.log(`  the couples without whom part 3 would hold: ${within.join(', ') || 'none'}`);
  const pooled = pooledSummed(cs.map(U => { const R = rule([U]); return R.H[0].cells; }));
  console.log(`  pooled survival again, from the couples' cells: ${f(pooled.d)} (${f(pooled.lo)} to ${f(pooled.hi)})`);
}
