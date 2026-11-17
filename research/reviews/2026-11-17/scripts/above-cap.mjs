/*
 * LIFETIME TAX ABOVE AND BELOW THE ESTATE CAP (the review, 17 Nov; EXPLORATORY, deciding nothing). For each unit that both
 * pilot.mjs and pilot-extra.mjs ran (the same seed and paths), each arm's mean lifetime tax and mean pot left on the paths
 * that end above the unit's estate cap under K2 and under the arm, and on those that end at or below it under both and are
 * kept by both. Above the cap the objective puts no value on a pound, so only a tie rule decides what is paid there.
 * First, the identity: HOUSE as pilot-extra.mjs ran it must be HOUSE as pilot.mjs ran it, path for path.
 *   node research/reviews/2026-11-17/scripts/above-cap.mjs [the pilot's directory] [the pilot-extra directory]
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const A = process.argv[2] || join(HERE, '..', 'units', 'pilot-99003-45'), B = process.argv[3] || join(HERE, '..', 'units', 'pilot-extra-99003-45');
const load = dir => Object.fromEntries(readdirSync(dir).filter(f => f.endsWith('.json') || f.endsWith('.json.gz')).map(f => { const u = JSON.parse(f.endsWith('.gz') ? gunzipSync(readFileSync(join(dir, f))).toString() : readFileSync(join(dir, f))); return [u.id, u]; }));
const CAPS = JSON.parse(readFileSync(join(A, '..', 'caps.json'))), P = load(A), X = load(B);
const mean = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN), gbp = x => (Number.isFinite(x) ? `£${Math.round(x).toLocaleString('en-GB')}` : '-');
console.log('LIFETIME TAX ABOVE AND BELOW THE ESTATE CAP (the review, 17 Nov; EXPLORATORY, deciding nothing): each arm against K2 on the same paths of seed 99003');
for (const id of Object.keys(X).filter(k => P[k] && !k.includes('@')).sort()) {
  const p = P[id], x = X[id], cap = CAPS[id].cap, k = p.arms.K2;
  const same = ['survived', 'wealth', 'tax', 'delivered'].every(key => x.arms.HOUSE[key].every((v, i) => v === p.arms.HOUSE[key][i]));
  console.log(`${id} (the cap ${gbp(cap)}; HOUSE in the two runs ${same ? 'the same on every path' : 'DIFFERS'}):`);
  const arms = { HOUSE: p.arms.HOUSE, ...Object.fromEntries(Object.entries(x.arms).filter(([a]) => a !== 'HOUSE')) };
  for (const [arm, R] of Object.entries(arms)) {
    const hi = k.wealth.map((w, i) => i).filter(i => k.wealth[i] > cap && R.wealth[i] > cap), lo = k.wealth.map((w, i) => i).filter(i => k.wealth[i] <= cap && R.wealth[i] <= cap && k.survived[i] && R.survived[i]);
    const t = (I, S) => gbp(mean(I.map(i => S.tax[i]))), w = (I, S) => gbp(mean(I.map(i => S.wealth[i])));
    console.log(`  ${arm.padEnd(6)} both above the cap on ${String(hi.length).padStart(4)} paths: tax K2 ${t(hi, k)}, ${arm} ${t(hi, R)}; the pot left K2 ${w(hi, k)}, ${arm} ${w(hi, R)} | both below it and kept on ${String(lo.length).padStart(4)}: tax K2 ${t(lo, k)}, ${arm} ${t(lo, R)}; the pot left K2 ${w(lo, k)}, ${arm} ${w(lo, R)}`);
  }
}
