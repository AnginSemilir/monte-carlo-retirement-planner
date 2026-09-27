/*
 * 7X'S HELD-FOR-LIFE RUNS AGAINST THE PRODUCT (the plan-auditor's review of 7x's read, BLOCKING 3): each case's
 * simulated survival held at the plan's tier (H00/M3) and at 2/2 (H22/M3), from results-7x.txt, beside the product's
 * own arm at margin 1e-3 on the same 8,000 paths of seed 7002 (results-7v.txt; the reader for S126 and share 0.95,
 * off for S194 and S360, as in 7x). Both files passed their reducers' gates; the difference is descriptive (grade C:
 * no pairing is read here, the traces are not re-opened).
 *   node research/solver/read-7x-held.mjs > research/solver/results-7x-held.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const x = readFileSync(join(HERE, 'results-7x.txt'), 'utf8'), v = readFileSync(join(HERE, 'results-7v.txt'), 'utf8');
const CASES = [['S126', 'READER'], ['S194', 'OFF'], ['share 0.95', 'READER'], ['S360', 'OFF']];
const sim7x = (cs, arm, h) => { const blk = x.split(/\n(?=\S)/).find(b => b.startsWith(cs + ' (')); const m = blk && new RegExp(`^  ${arm}/${h}/M3\\s+table\\s+\\S+ sim\\s+(\\S+)`, 'm').exec(blk); return m ? Number(m[1]) : null; };
const prod7v = (cs, arm) => { const blk = v.split(/\n(?=\S)/).find(b => b.startsWith(cs + ' (margin')); const m = blk && new RegExp(`^  ${arm}/1e-3\\s+(\\S+)`, 'm').exec(blk); return m ? Number(m[1]) : null; };
console.log('7X\'S HELD-FOR-LIFE RUNS AGAINST THE PRODUCT (survival %, 8,000 paths of seed 7002; results-7x.txt and results-7v.txt)');
console.log('  case        arm     product 1e-3   held 0/0 (less product)   held 2/2 (less product)');
let n = 0;
for (const [cs, arm] of CASES) {
  const p = prod7v(cs, arm), h0 = sim7x(cs, arm, 'H00'), h2 = sim7x(cs, arm, 'H22');
  if ([p, h0, h2].some(z => z === null || !Number.isFinite(z))) { console.log(`ERROR: ${cs} ${arm} not found`); process.exit(1); }
  const f = z => (z >= 0 ? '+' : '') + z.toFixed(3);
  console.log(`  ${cs.padEnd(11)} ${arm.padEnd(7)} ${p.toFixed(3).padStart(8)}       ${h0.toFixed(2).padStart(6)} (${f(h0 - p)})         ${h2.toFixed(2).padStart(6)} (${f(h2 - p)})`); n++;
}
if (n !== 4) process.exit(1);
