/*
 * M14c BY YEARS LEFT - EXPLORATORY, NOT PREDICTED (predictions/m14c-bets.md did not split by horizon). Reads the same
 * results/m14c/<id>.bets.json files reduce-m14c.mjs read behind its fair-test gate (results-m14c.txt) and splits each
 * household's positions by the years left in its plan at the bet (the result file's `years` minus the position's `year`),
 * pooled as the reducer pools (mean of bet - stay; se the root sum of squares over the count), and, within each band, the
 * positions AT RISK (either choice below 100% simulated survival) apart - a position where both survive for certain adds a
 * zero that dilutes its band (the twenty-sixth review: 17 of S194's 19 last-5 positions). Planted: made-up positions run
 * through the same split must land in the right bands with the right means, or the script stops.
 *
 *   node research/solver/m14c-horizon.mjs > research/solver/results-m14c-horizon.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results', 'm14c');
const band = left => (left <= 5 ? '1-5' : left <= 10 ? '6-10' : left <= 20 ? '11-20' : '21+');
const pool = xs => ({ n: xs.length, d: xs.reduce((a, x) => a + (x.survBet - x.survStay), 0) / xs.length, se: Math.sqrt(xs.reduce((a, x) => a + x.se * x.se, 0)) / xs.length });
const split = (rows, Y) => { const by = {}; for (const x of rows) (by[band(Y - x.year)] = by[band(Y - x.year)] || []).push(x); return by; };
const atRisk = x => x.survBet < 100 || x.survStay < 100;
{ // planted: two positions 2 years from the end (one certain, one at risk) and one 30 years out
  const P = split([{ year: 39, survBet: 100, survStay: 100, se: 0 }, { year: 39, survBet: 90, survStay: 92, se: 1 }, { year: 11, survBet: 50, survStay: 49, se: 1 }], 41);
  const ok = P['1-5'] && P['1-5'].length === 2 && pool(P['1-5']).d === -1 && pool(P['1-5'].filter(atRisk)).d === -2 && P['21+'] && pool(P['21+']).d === 1 && !P['6-10'];
  if (!ok) { console.log('PLANTED CHECK FAILED: the split does not place or pool made-up positions correctly'); process.exit(1); }
}
console.log('# M14c by years left at the bet - EXPLORATORY, not predicted; the same files as results-m14c.txt');
for (const id of ['S194', 'S162', 'S252', 'S330']) {
  const o = JSON.parse(readFileSync(join(R, `${id}.bets.json`), 'utf8'));
  const Y = JSON.parse(readFileSync(join(R, `${id}.json`), 'utf8')).years;
  const by = split(o.rows, Y);
  const left = o.rows.map(x => Y - x.year).sort((a, b) => a - b);
  const cells = ['1-5', '6-10', '11-20', '21+'].filter(b => by[b]).map(b => {
    const P = pool(by[b]), rk = by[b].filter(atRisk), Q = rk.length ? pool(rk) : null;
    return `${b} yrs left: ${P.n} positions, bet - stay ${P.d >= 0 ? '+' : ''}${P.d.toFixed(2)} +/- ${P.se.toFixed(2)} (at risk ${rk.length}${Q ? `: ${Q.d >= 0 ? '+' : ''}${Q.d.toFixed(2)} +/- ${Q.se.toFixed(2)}` : ''})`;
  });
  console.log(`${id} (plan ${Y} years; median ${left[left.length >> 1]} years left at the bet)\n    ${cells.join(' | ')}`);
}
