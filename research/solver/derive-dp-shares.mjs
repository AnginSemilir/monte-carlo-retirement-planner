/*
 * THE DRAW-PAUSE MEASUREMENT'S SHARES (results-dp.txt, reduce-dp.mjs's output): per household the pausing paths as a share
 * of the paths that reach the wall band, the wall band's strict stall share, and the panel totals, beside the registered
 * description's point and interval (predictions/measure-dp.md: households with any pausing path 5 (2 to 10) of 25; the
 * pausing share of the reaching paths 5% (1% to 20%); the mean pausing dwell 4 years (2.5 to 7)). Arithmetic over the saved
 * table only; no solver code. Usage: node research/solver/derive-dp-shares.mjs > research/solver/results-dp-shares.txt
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const text = readFileSync(join(here, 'results-dp.txt'), 'utf8');
if (!/^GATE: passed/m.test(text)) { console.error('results-dp.txt: the gate line is missing'); process.exit(1); }
// a row: name, access, reach, cross, dwell | growth wall, pre-wall | pause (share) mean/median/max | stall of wall path-years
const ROW = /^  (.+?)\s{2,}(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+) \|\s+([\d.]+)\s+([\d.]+) \|\s+(\d+)\s+\(([\d.]+)%\)\s+([\d.]+)\/(\d+)\/(\d+) \| (\d+) of (\d+)$/;
const rows = [];
for (const line of text.split('\n')) {
  const m = line.match(ROW);
  if (m) rows.push({ name: m[1].trim(), reach: +m[3], cross: +m[4], pause: +m[8], mean: +m[10], stall: +m[13], wallpy: +m[14] });
}
if (rows.length !== 25) { console.error(`expected 25 household rows, parsed ${rows.length}`); process.exit(1); }
const f = (x, d = 3) => x.toFixed(d);
console.log('THE DRAW-PAUSE SHARES (derive-dp-shares.mjs over results-dp.txt)');
console.log('  household        reach  pause  pause/reach  stall/wall-py');
rows.slice().sort((a, b) => b.pause / Math.max(1, b.reach) - a.pause / Math.max(1, a.reach)).forEach(r =>
  console.log(`  ${r.name.padEnd(15)} ${String(r.reach).padStart(6)} ${String(r.pause).padStart(6)} ${f(r.reach ? r.pause / r.reach : 0).padStart(12)} ${f(r.wallpy ? r.stall / r.wallpy : 0).padStart(14)}`));
const R = rows.reduce((s, r) => s + r.reach, 0), P = rows.reduce((s, r) => s + r.pause, 0);
const dw = rows.reduce((s, r) => s + r.pause * r.mean, 0) / P;
const any = rows.filter(r => r.pause > 0).length, over = rows.filter(r => r.reach && r.pause / r.reach > 0.25).map(r => r.name);
console.log(`TOTALS: reaching paths ${R}, pausing ${P}, share of reaching ${f(P / R)}; mean pausing dwell ${f(dw, 2)} years; households with any pause ${any} of 25`);
console.log(`AGAINST THE DESCRIPTION: any pause ${any} (registered 5, 2 to 10) ${any > 10 ? 'ABOVE' : any < 2 ? 'BELOW' : 'INSIDE'}; share ${f(P / R)} (0.05, 0.01 to 0.20) ${P / R > 0.2 ? 'ABOVE' : P / R < 0.01 ? 'BELOW' : 'INSIDE'}; dwell ${f(dw, 2)} (4, 2.5 to 7) ${dw > 7 ? 'ABOVE' : dw < 2.5 ? 'BELOW' : 'INSIDE'}`);
console.log(`OVER A QUARTER OF THE REACHING PATHS (the registered line for the register): ${over.length ? over.join(', ') : 'none'}`);
