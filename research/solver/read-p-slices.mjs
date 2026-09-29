/*
 * P'S SLICES (the deep review after P, deep-review-log.md 29 Sep 23:31 UK; its figures from results/diagP's case logs by a
 * read-only script, recomputed here by a committed one - checklist item 4). Reads results/diagP/case*.txt (gated by
 * reduce-P.mjs, results-P.txt) and prints:
 *   1. item 7 by unit and setting: OPEN0's decision log at world 0's node, years 1 to 7 pooled and by year - held
 *      path-years, the forward holding where the cell leaves (one-way), the reverse, and the net in points;
 *   2. world 0's survival price and the mixture's prices of the year-0 de-risk at each grid run (30x5 from the core or
 *      opening job, 30x15 and 60x5 from the grid jobs), each world's part, and world 2's share of the whole price;
 *   3. the pooled price-to-realised ratio under P and at margin 0 with the realised interval's ends (results-P.txt's
 *      REPORTED line), as ratios.
 * Planted: a built log with known counts must read back its one-way, reverse and net shares.
 *   node research/solver/read-p-slices.mjs > research/solver/results-P-slices.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diagP');
const LOG = /^\s+log (\S+) (\S+) year (\d+): held (\d+) fwdLeave (\d+) cellLeave (\d+) fwdHoldCellLeave (\d+) fwdLeaveCellHold (\d+)/;
const PRICE = /^\s+price (\S+): mixture (\S+) like-for-like whole (\S+) survival (\S+)$/;
const WORLD = /^\s+world (\S+) (\d) z \S+ weight (\S+): whole (\S+) survival (\S+)$/;
export function logsOf(text, rule = 'OPEN0') {
  const out = [];
  for (const l of text.split('\n')) { const m = LOG.exec(l); if (m && m[2] === rule) out.push({ year: +m[3], held: +m[4], oneWay: +m[7], reverse: +m[8] }); }
  return out;
}
export const pooled = (rows, y0 = 1, y1 = 7) => { const r = rows.filter(x => x.year >= y0 && x.year <= y1); const h = r.reduce((t, x) => t + x.held, 0), a = r.reduce((t, x) => t + x.oneWay, 0), b = r.reduce((t, x) => t + x.reverse, 0); return { held: h, oneWay: h ? 100 * a / h : 0, reverse: h ? 100 * b / h : 0, net: h ? 100 * (a - b) / h : 0 }; };
// planted
{ const t = '  log X OPEN0 year 1: held 100 fwdLeave 0 cellLeave 0 fwdHoldCellLeave 30 fwdLeaveCellHold 10 marginHold 0\n  log X OPEN0 year 2: held 100 fwdLeave 0 cellLeave 0 fwdHoldCellLeave 10 fwdLeaveCellHold 0 marginHold 0\n  log X TS+J year 1: held 5 fwdLeave 0 cellLeave 0 fwdHoldCellLeave 5 fwdLeaveCellHold 0 marginHold 0\n';
  const p = pooled(logsOf(t)); if (!(p.held === 200 && p.oneWay === 20 && p.reverse === 5 && p.net === 15)) { console.log(`PLANTED CHECK FAILED: ${JSON.stringify(p)}`); process.exit(1); } }
const files = readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(DIR, f), 'utf8'));
const jobOf = t => { const m = /^(\S.*?)\s+case \| job (\S+) (\S+)/m.exec(t); return m ? { id: m[1].trim(), job: m[2], arm: m[3] } : null; };
console.log("P'S SLICES (results/diagP, gated by reduce-P.mjs; the deep review after P, 29 Sep 23:31 UK)");
console.log('\n1. ITEM 7 BY UNIT: OPEN0 at world 0\'s node, the forward run holding where the cell leaves (one-way) against the reverse, of held path-years');
for (const id of ['bridge 4', 'S194', 'S126']) for (const job of ['core:P', 'core:1e-3']) {
  const t = files.find(x => { const j = jobOf(x); return j && j.id === id && j.job === job; });
  if (!t) { console.log(`CHECK FAILED: no ${id} ${job} log`); process.exit(1); }
  const rows = logsOf(t), p = pooled(rows);
  console.log(`  ${id.padEnd(9)} ${job.padEnd(10)} years 1-7: held ${p.held}, one-way ${p.oneWay.toFixed(2)}%, reverse ${p.reverse.toFixed(2)}%, net ${p.net.toFixed(1)} points`);
  console.log(`  ${''.padEnd(20)} by year (held one-way/reverse): ${rows.filter(r => r.year <= 7).map(r => `${r.year}: ${r.held} ${r.oneWay}/${r.reverse}`).join('; ')}`);
}
console.log("\n2. THE YEAR-0 DE-RISK'S PRICE BY GRID (points of survival and of the whole score; each world's part, weight x its price)");
for (const id of ['bridge 4', 'S194', 'share 0.95']) {
  const runs = files.map(x => ({ x, j: jobOf(x) })).filter(({ j }) => j && j.id === id && (j.job === 'core:P' || j.job === 'grid' || (j.job === 'open' && id === 'share 0.95')));
  for (const { x, j } of runs.sort((a, b) => a.j.arm.localeCompare(b.j.arm))) {
    const pl = x.split('\n').map(l => PRICE.exec(l)).find(Boolean), ws = x.split('\n').map(l => WORLD.exec(l)).filter(Boolean);
    if (!pl || ws.length !== 3) { console.log(`  ${id} ${j.job} ${j.arm}: no price or world lines`); continue; }
    const whole = +pl[3], surv = +pl[4], w2 = (+ws[2][3]) * (+ws[2][4]);
    console.log(`  ${id.padEnd(10)} ${`${j.job} ${j.arm}`.padEnd(28)} whole ${whole.toFixed(3)} survival ${surv.toFixed(3)} | world 0 survival ${(+ws[0][5]).toFixed(3)} | world 2 whole ${(+ws[2][4]).toFixed(3)} survival ${(+ws[2][5]).toFixed(3)}, ${(100 * w2 / whole).toFixed(0)}% of the whole price`);
  }
}
const R = readFileSync(join(HERE, 'results-P.txt'), 'utf8'), m = /margin 0 (\S+) \/ \+(\S+) \((\S+) to (\S+)\) = (\S+); P (\S+) \/ \+(\S+) \((\S+) to (\S+)\) = (\S+)/.exec(R);
if (!m) { console.log('CHECK FAILED: no ratio line in results-P.txt'); process.exit(1); }
console.log(`\n3. THE POOLED PRICE TO REALISED (results-P.txt): margin 0 ${m[5]} (${(+m[1] / +m[4]).toFixed(2)} to ${(+m[1] / +m[3]).toFixed(2)} over the realised interval), P ${m[10]} (${(+m[6] / +m[9]).toFixed(2)} to ${(+m[6] / +m[8]).toFixed(2)})`);
console.log('planted: a built log reads back one-way 20%, reverse 5%, net 15 points');
