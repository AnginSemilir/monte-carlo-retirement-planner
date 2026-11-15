/*
 * BESIDE THE ALLOWANCE STEP'S READ (ALLOWANCE-BOTH.md; D98; EXPLORATORY, seed 7002), written after the read and deciding
 * nothing. It reads the same units the reducer read (results/allowance-both-7002) through the reducer's own functions and
 * prints where part 4's capped pot falls: each household's capped pot, BOTH against NOW, in pounds and percent, its share of
 * the summed change, and the pooled capped pot without each household in turn (part 4: not lower by more than 0.1%).
 *   node research/solver/allowance-both-beside.mjs [dir]
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, compare, RULE } from './reduce-allowance-both.mjs';
import { HOUSEHOLDS } from './audit-allowance-both.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = process.argv[2] || join(HERE, 'results', 'allowance-both-7002');
const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
const units = HOUSEHOLDS.map(id => raw.find(u => u.id === id)).map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
const gbp = v => `${v < 0 ? '-' : ''}£${Math.abs(Math.round(v)).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
const R = compare(units, 'NOW', 'BOTH'), sum = R.H.reduce((t, h) => t + (h.capB - h.capA), 0);
console.log(`BESIDE THE ALLOWANCE STEP'S READ (EXPLORATORY, written after the read, deciding nothing): ${units.length} households of ${DIR.split('/').slice(-1)[0]}; part 4's capped pot, BOTH against NOW, pooled ${f(R.capped)}% (the bar ${RULE.capped}%)`);
console.log(`\nEach household's capped pot (the pot held to its estate cap, the mean over its paths), BOTH against NOW:`);
for (const h of [...R.H].sort((a, b) => (a.capB - a.capA) - (b.capB - b.capA))) console.log(`  ${h.id.padEnd(6)} ${gbp(h.capA)} to ${gbp(h.capB)}, ${gbp(h.capB - h.capA)} (${f(100 * (h.capB / h.capA - 1))}%), ${(100 * (h.capB - h.capA) / sum).toFixed(1)}% of the summed change`);
console.log(`\nThe pooled capped pot without each household in turn (part 4 holds at ${RULE.capped}% or above):`);
console.log(`  ${HOUSEHOLDS.map(id => { const Q = compare(units.filter(u => u.id !== id), 'NOW', 'BOTH'); return `${id} ${f(Q.capped)}%`; }).join(', ')}`);
const holdWithout = HOUSEHOLDS.filter(id => compare(units.filter(u => u.id !== id), 'NOW', 'BOTH').capped >= RULE.capped);
console.log(`  the households without whom part 4 would hold: ${holdWithout.join(', ') || 'none'}`);
