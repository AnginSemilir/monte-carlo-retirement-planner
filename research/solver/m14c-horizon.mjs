/*
 * M14c BY YEARS LEFT - EXPLORATORY, NOT PREDICTED (predictions/m14c-bets.md did not split by horizon). Reads the same
 * results/m14c/<id>.bets.json files reduce-m14c.mjs read behind its fair-test gate (results-m14c.txt) and splits each
 * household's positions by the years left in its plan at the bet (the result file's `years` minus the position's `year`),
 * pooled as the reducer pools (mean of bet - stay; se the root sum of squares over the count). Planted: a position with
 * year = years - 1 must fall in the 1-5 band.
 *
 *   node research/solver/m14c-horizon.mjs > research/solver/results-m14c-horizon.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results', 'm14c');
const band = left => (left <= 5 ? '1-5' : left <= 10 ? '6-10' : left <= 20 ? '11-20' : '21+');
if (band(1) !== '1-5') { console.log('PLANTED CHECK FAILED'); process.exit(1); }
console.log('# M14c by years left at the bet - EXPLORATORY, not predicted; the same files as results-m14c.txt');
for (const id of ['S194', 'S162', 'S252', 'S330']) {
  const o = JSON.parse(readFileSync(join(R, `${id}.bets.json`), 'utf8'));
  const Y = JSON.parse(readFileSync(join(R, `${id}.json`), 'utf8')).years;
  const by = {};
  for (const x of o.rows) (by[band(Y - x.year)] = by[band(Y - x.year)] || []).push(x);
  const left = o.rows.map(x => Y - x.year).sort((a, b) => a - b);
  const cells = ['1-5', '6-10', '11-20', '21+'].filter(b => by[b]).map(b => {
    const xs = by[b], n = xs.length, d = xs.reduce((a, x) => a + (x.survBet - x.survStay), 0) / n, se = Math.sqrt(xs.reduce((a, x) => a + x.se * x.se, 0)) / n;
    return `${b} yrs left: ${n} positions, bet - stay ${d >= 0 ? '+' : ''}${d.toFixed(2)} +/- ${se.toFixed(2)}`;
  });
  console.log(`${id} (plan ${Y} years; median ${left[left.length >> 1]} years left at the bet)\n    ${cells.join(' | ')}`);
}
