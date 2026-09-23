/* K1: read every k1-rules record and fail on any breach of the rules the run was given. */
import { readRecord } from './record.mjs';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'results', 'k1-rules');
let breaches = 0, files = 0;
for (const f of readdirSync(DIR).filter(f => f.endsWith('.solver.record.json.gz'))) {
  files++;
  const r = readRecord(join(DIR, f)), { N, Y } = r, spend = r.meta.spendYears, P = 3 * r.meta.target;
  let lvlBad = 0, tierBad = 0, potBad = 0;
  for (let i = 0; i < N; i++) {
    const fy = r.trace.failYear[i];
    for (let t = 0; t < Y; t++) {
      if (fy >= 0 && t >= fy) break;
      const k = i * Y + t;
      if (spend[t] && r.trace.level[k] !== 100) lvlBad++;
      if (r.trace.tier[k] !== 0) tierBad++;
    }
    if (r.paths.survived[i] && r.trace.wealth[i * Y + Y - 1] < P - 1) potBad++;
  }
  const bad = lvlBad + tierBad + potBad; breaches += bad;
  console.log(`${r.meta.id.padEnd(6)} spending years off 100%: ${lvlBad}   years off plan tier: ${tierBad}   survivors below the minimum pot: ${potBad}   ${bad ? 'BREACH' : 'ok'}`);
}
console.log(files ? (breaches ? `K1 FAILED: ${breaches} breaches - a bug, fixed before anything else` : `K1 PASSED on ${files} households: every rule held on every path-year`) : 'K1: no records found');
process.exit(files && !breaches ? 0 : 1);
