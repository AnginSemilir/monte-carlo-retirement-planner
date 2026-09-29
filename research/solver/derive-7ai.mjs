/*
 * 7AI'S DERIVATION (predictions/diag-7ai.md; PLAN.md 7ai; O60). What the records say before any blend solve:
 *   1. On each of the 14 pairs (the seven households, CAND and SHIP), the recorded year-0 gap (7af's or 7ag's gap line,
 *      read through reduce-7aa.mjs parse) and the relative move of that gap that would flip the opening at the product's
 *      margin 0.001 (the opening leaves the plan's tiers there when the gap is above 0.001): 0.001 / gap - 1. A pair whose
 *      gap is within 10% of the margin moves its opening on a 10% move of the gap.
 *   2. O60's size (results-o60.txt): the pension's de-risk (High Risk to Medium Risk) costs 1.10 points a year with the
 *      linear tiers and 0.79 with the blend medians - the linear figures overcharge it by 0.31, about 28% of its cost - and
 *      every tier's return rises by 0.17 to 0.49 points a year.
 * No solve. Output hashed on the prediction's derive: line.
 *   node research/solver/derive-7ai.mjs > research/solver/results-derive-7ai.txt
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as A from './reduce-7aa.mjs';
import { HOUSEHOLDS, FROM_AF, readO60 } from './reduce-7ai.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const units = d => (existsSync(d) ? readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).sort().flatMap(f => A.parse(readFileSync(join(d, f), 'utf8'))) : []);
const F = units(join(HERE, 'results', 'diag7af')), G = units(join(HERE, 'results', 'diag7ag'));
if (!F.length || !G.length) { console.log('DERIVATION FAILED: no 7af or 7ag records'); process.exit(1); }
const ARMS = [['READER', 'TS+J/W0.02', 'CAND'], ['OFF', 'PRODUCT/W0.02', 'SHIP']];
console.log("7AI'S DERIVATION: the recorded year-0 gaps against the product's margin 0.001 (7af's and 7ag's gap lines)");
console.log('  household     arm   gap          opening (0.001, 0)  the gap move that flips the 0.001 opening');
let near = 0, n = 0; const moves = [];
for (const [a, l, name] of ARMS) for (const id of HOUSEHOLDS) {
  const u = (FROM_AF.includes(id) ? F : G).find(x => x.id === id && x.arm === a && x.label === l && x.done);
  if (!u || !u.gap) { console.log(`DERIVATION FAILED: no record for ${id} ${a}/${l}`); process.exit(1); }
  const g = Number(u.gap.gap), mv = 0.001 / g - 1; n++; moves.push(Math.abs(mv));
  if (Math.abs(mv) <= 0.1) near++;
  console.log(`  ${id.padEnd(12)}  ${name}  ${u.gap.gap.padEnd(11)}  ${`${u.gap.open1e3}, ${u.gap.open0}`.padEnd(18)}  ${mv >= 0 ? '+' : ''}${(100 * mv).toFixed(1)}%`);
}
moves.sort((x, y) => x - y);
console.log(`\n${near} of ${n} pairs flip their 0.001 opening on a gap move of 10% or less; the smallest move needed ${(100 * moves[0]).toFixed(1)}%, the median ${(100 * (moves[6] + moves[7]) / 2).toFixed(1)}%`);
const o = readO60(readFileSync(join(HERE, 'results-o60.txt'), 'utf8'));
const lin = o['High Risk'].linear - o['Medium Risk'].linear, bl = o['High Risk'].blend - o['Medium Risk'].blend;
console.log(`O60 (results-o60.txt): the de-risk High to Medium costs ${lin.toFixed(2)} points a year linear, ${bl.toFixed(2)} with the blend medians - overcharged by ${(lin - bl).toFixed(2)}, ${(100 * (lin - bl) / lin).toFixed(0)}% of its cost; the tiers rise by ${Math.min(...Object.values(o).map(x => x.blend - x.linear)).toFixed(2)} to ${Math.max(...Object.values(o).map(x => x.blend - x.linear)).toFixed(2)} points a year`);
