// The deep review after COV-B-STEP's figures, re-derived from COV-B-STEP's saved files (results/diagcovb; through
// reduce-covb.mjs's gate and stamp check first, rule 3; the plan-auditor's MINOR 4 of 5 Oct, carried):
//   1. O98: TAX's fixed reads against BASE's, by household - reads, how many differ, the largest difference, and the
//      years and worlds where any differs;
//   2. O99 (c): S126's (and the all-ISA control's) paths lost and saved under COV against BASE, by world, and the lost
//      paths' fail years.
//   node research/solver/derive-covb-review.mjs > research/solver/results-derive-covb-review.txt
// e3 off: no solve is run here
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { covbFiles } from './reduce-xas.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const C = covbFiles(join(HERE, 'results', 'diagcovb'));
if (C.bad.length) { console.log(`GATE: FAILED\n  ${C.bad.join('\n  ')}`); process.exit(1); }
console.log('GATE: passed (reduce-covb.mjs\'s gate and the fair-gate stamp check over results/diagcovb)');

console.log('\n1. TAX\'S FIXED READS AGAINST BASE\'S (O98)');
for (const id of ['S130', 'S370', 'bridge 4', 'S126']) {
  const F = C.files[id].fixed, n = F.t.length; let diff = 0, mx = 0; const where = new Set();
  for (let j = 0; j < n; j++) { const d = Math.abs(F.arms.TAX.read[j] - F.arms.BASE.read[j]); if (d > 0) { diff++; where.add(`y${F.t[j]}w${F.k[j]}`); } mx = Math.max(mx, d); }
  console.log(`  ${id.padEnd(9)} reads ${n}: TAX differs from BASE on ${diff}, largest ${mx.toExponential(2)}${where.size ? ` (at ${[...where].sort().join(',')})` : ''}`);
}

console.log('\n2. PATHS LOST AND SAVED UNDER COV AGAINST BASE, BY WORLD (O99 c)');
for (const id of ['S126', 'S126 all-ISA']) {
  const A = C.files[id].arms, npw = C.files[id].npw, lost = [0, 0, 0], saved = [0, 0, 0], fy = [];
  for (let j = 0; j < A.BASE.survived.length; j++) {
    const k = Math.floor(j / npw);
    if (A.BASE.survived[j] && !A.COV.survived[j]) { lost[k]++; fy.push(A.COV.failYear[j]); }
    if (!A.BASE.survived[j] && A.COV.survived[j]) saved[k]++;
  }
  fy.sort((a, b) => a - b);
  console.log(`  ${id.padEnd(12)} lost ${lost.reduce((s, x) => s + x, 0)} (worlds ${lost.join('/')}), saved ${saved.reduce((s, x) => s + x, 0)} (worlds ${saved.join('/')}); the lost paths' fail years ${fy.join(',') || '-'}`);
}
