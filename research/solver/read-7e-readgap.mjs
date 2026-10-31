/*
 * HOW MUCH OF THE BRIDGE MISREAD EACH FIX CLOSED, FROM 7E'S OWN FIGURES (for the Road to Phase 4 doc; a reading of
 * results-7e.txt, not a new test). 7e ran the four bridge reads side by side on the same 24 cases, 1,000 paths of seed
 * 7002 (predictions/bridge-reader.md): OFF (the product's table read, the misread), V1 (F1 v1), V2 (F1 v2) and READER
 * (the bridge reader). Its "REPORTED, NOT PREDICTED" rows give each arm's gap: the table's survival read at year 0 minus
 * the simulated survival, in points. This script takes those rows as printed and reports, per arm:
 *   the cases the misread touched: OFF's gap at least 1 point in size (the rest read right before any fix; they are
 *   listed so nothing is left out silently)
 *   the sum and the mean of the absolute gap over those cases, and the share of OFF's total each fix closed
 *   per case, the four gaps side by side
 * The gate: every one of the 24 cases must be found once, with all four arms, or the script refuses.
 *   node research/solver/read-7e-readgap.mjs > research/solver/results-7e-readgap.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = 'results-7e.txt', text = readFileSync(join(HERE, SRC), 'utf8');
const ARMS = ['OFF', 'V1', 'V2', 'READER'], CASES = 24, TOUCHED = 1;
const rows = [];
let inReported = false;
for (const l of text.split('\n')) {
  if (l.startsWith('REPORTED, NOT PREDICTED')) { inReported = true; continue; }
  if (!inReported) continue;
  const m = /^\s{3}(\S.*?)\s+OFF gap\s+(-?[\d.]+) sim\s+([\d.]+) .*\| V1 gap\s+(-?[\d.]+) sim\s+([\d.]+) .*\| V2 gap\s+(-?[\d.]+) sim\s+([\d.]+) .*\| READER gap\s+(-?[\d.]+) sim\s+([\d.]+) /.exec(l);
  if (m) rows.push({ id: m[1], gap: [m[2], m[4], m[6], m[8]].map(Number), sim: [m[3], m[5], m[7], m[9]].map(Number) });
}
const ids = rows.map(r => r.id);
if (rows.length !== CASES || new Set(ids).size !== CASES) { console.log(`REFUSED: ${rows.length} rows, ${new Set(ids).size} distinct cases in ${SRC}; 7e reported ${CASES}`); process.exit(1); }

const touched = rows.filter(r => Math.abs(r.gap[0]) >= TOUCHED), clean = rows.filter(r => Math.abs(r.gap[0]) < TOUCHED);
const sum = i => touched.reduce((s, r) => s + Math.abs(r.gap[i]), 0);
const f1 = x => x.toFixed(1), sg = x => (x > 0 ? '+' : '') + x.toFixed(1);
console.log(`source: ${SRC} sha256 ${createHash('sha256').update(text).digest('hex').slice(0, 16)}, its "REPORTED, NOT PREDICTED" rows (1,000 paths of seed 7002 per arm)`);
console.log(`gap = the table's year-0 survival read minus the simulated survival, in points; negative = the table reads too low\n`);
console.log(`cases the misread touched (OFF's gap at least ${TOUCHED} point in size): ${touched.length} of ${CASES}`);
console.log(`cases read right before any fix (left out of the totals): ${clean.map(r => `${r.id} ${sg(r.gap[0])}`).join(', ')}\n`);
console.log('TOTALS over the touched cases:');
const off = sum(0);
for (const [i, a] of ARMS.entries()) {
  const s = sum(i);
  console.log(`   ${a.padEnd(7)} sum |gap| ${f1(s).padStart(7)}  mean ${f1(s / touched.length).padStart(5)}  closed ${i === 0 ? '   -' : `${f1(100 * (1 - s / off)).padStart(5)}%`}`);
}
console.log('\nPER CASE (gap in points; OFF sim = the simulated survival under the misread, READER sim with the reader):');
console.log(`   ${'case'.padEnd(15)}${ARMS.map(a => a.padStart(8)).join('')}   OFF sim  READER sim`);
for (const r of touched) console.log(`   ${r.id.padEnd(15)}${r.gap.map(g => sg(g).padStart(8)).join('')}   ${f1(r.sim[0]).padStart(7)}  ${f1(r.sim[3]).padStart(10)}`);
