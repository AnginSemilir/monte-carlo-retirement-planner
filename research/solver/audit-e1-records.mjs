/*
 * E1 RE-READ FROM SAVED STORED MOVES (PLAN.md predictions register, "E1 re-run from stored moves"). No solve.
 *
 * The first E1 probe read its persistence figures from the byte-wide policy table, which wrapped every move
 * above 255, so its verdict (98.68% coverage, not built) was never trusted. Step 2 saved every arm's stored
 * moves at full width. This reads the EXHAUSTIVE arm (`s2-newex`: six levels, 432 moves, the full scan, so a
 * tie always goes to the same move and persistence is not blurred by the ternary search's tie order) and
 * measures, over every cell-year in retired years, how often this year's best move is already in a set built
 * from next year's best move at the same cell - the four candidate sets of audit-e1-persistence.mjs.
 *
 * PREDICTION (written in the predictions register before this ran): coverage near 98-99%; the verdict (not
 * built) stands. FALSIFIED IF coverage exceeds 99.5% with a small set.
 *
 *   node research/solver/audit-e1-records.mjs [arm=newex]
 */
import { readRecord } from './record.mjs';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), 'results');
const ARM = process.argv[2] || 'newex';
const dir = join(R, `s2-${ARM}`);
const files = readdirSync(dir).filter(f => f.endsWith('.solver.record.json.gz')).sort();
const names = ['next year\'s winner alone', '+ same level and tier', '+ same draw order and harvest', 'the union of both'];
const tot = [0, 0, 0, 0]; let totN = 0, sizesAll = null, nAall = 0;
console.log(`E1 coverage from the stored moves of s2-${ARM}, retired years only\n`);
for (const f of files) {
  const r = readRecord(join(dir, f));
  if (!r.pol || !r.actions) { console.log(`${f}: no stored moves`); continue; }
  const A = r.actions, nA = A.length;
  // a label is "<draw order core>[, spend N%][, pension n tier(s) down][, ISA n tier(s) down]"
  const lvl = A.map(l => { const m = l.match(/spend (\d+)%/); return m ? Number(m[1]) : 100; });
  const tier = A.map(l => `${(l.match(/pension (\d) tier/) || [0, 0])[1]}/${(l.match(/ISA (\d) tier/) || [0, 0])[1]}`);
  const core = A.map(l => l.replace(/, spend \d+%/, '').replace(/, pension \d tiers? down/, '').replace(/, ISA \d tiers? down/, ''));
  const sameLT = A.map((_, i) => new Set(A.map((_, j) => j).filter(j => lvl[j] === lvl[i] && tier[j] === tier[i])));
  const sameC = A.map((_, i) => new Set(A.map((_, j) => j).filter(j => core[j] === core[i])));
  const sizes = [1, sameLT[0].size, sameC[0].size, new Set([...sameLT[0], ...sameC[0]]).size];
  sizesAll = sizes; nAall = nA;
  const spend = r.meta.spendYears;
  const hit = [0, 0, 0, 0]; let n = 0;
  for (let t = 0; t + 1 < r.pol.length; t++) {
    if (!spend[t]) continue;             // working years: no spending, every level ties - not a real decision
    const a = r.pol[t], b = r.pol[t + 1];
    for (let i = 0; i < a.length; i++) {
      const want = a[i], seed = b[i]; n++;
      if (want === seed) { hit[0]++; hit[1]++; hit[2]++; hit[3]++; continue; }
      const s2 = sameLT[seed].has(want), s3 = sameC[seed].has(want);
      if (s2) hit[1]++; if (s3) hit[2]++; if (s2 || s3) hit[3]++;
    }
  }
  for (let k = 0; k < 4; k++) tot[k] += hit[k];
  totN += n;
  console.log(`${r.meta.id.padEnd(6)} ${nA} moves  ` + hit.map((h, k) => `${names[k].split(' ')[0] === 'next' ? 'alone' : k === 1 ? 'level+tier' : k === 2 ? 'core' : 'union'} ${(100 * h / n).toFixed(2)}%`).join('   '));
}
console.log(`\nALL HOUSEHOLDS, ${totN.toLocaleString()} cell-years`);
console.log('  candidate set                      size    coverage    work saved');
for (let k = 0; k < 4; k++) console.log('  ' + names[k].padEnd(33) + String(sizesAll[k]).padStart(4) + '   ' + (100 * tot[k] / totN).toFixed(2).padStart(8) + '%   ' + (100 * (1 - sizesAll[k] / nAall)).toFixed(1).padStart(9) + '%');
const best = tot.map((h, k) => ({ k, cov: h / totN, save: 1 - sizesAll[k] / nAall })).filter(x => x.cov > 0.995).sort((a, b) => b.save - a.save)[0];
console.log(best ? `\nFALSIFIED: "${names[best.k]}" covers ${(100 * best.cov).toFixed(2)}% and skips ${(100 * best.save).toFixed(0)}% of the move work - E1 would be worth building.`
  : `\nPREDICTION HOLDS: no candidate set reaches 99.5% coverage; E1 stays not built.`);
