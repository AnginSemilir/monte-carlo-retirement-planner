/* K1: read every K1 record and fail on any breach of the rules its arm was given (see batch-k1.sh). */
import { readRecord } from './record.mjs';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RES = join(dirname(fileURLToPath(import.meta.url)), 'results');
// per arm: allowed spending level range (percent of target) and whether the plan tier is required
const ARMS = {
  'k1-rules': { lo: 100, hi: 100, planTier: true },
  'k1-cap':   { lo: 0,   hi: 110, planTier: false },
  'k1-block': { lo: 100, hi: 255, planTier: false }
};
let breaches = 0, files = 0;
for (const [arm, rule] of Object.entries(ARMS)) {
  const DIR = join(RES, arm);
  if (!existsSync(DIR)) { console.log(`${arm}: no records`); continue; }
  for (const f of readdirSync(DIR).filter(f => f.endsWith('.solver.record.json.gz'))) {
    files++;
    const r = readRecord(join(DIR, f)), { N, Y } = r, spend = r.meta.spendYears, P = 3 * r.meta.target;
    let lvlBad = 0, tierBad = 0, potBad = 0;
    for (let i = 0; i < N; i++) {
      const fy = r.trace.failYear[i];
      for (let t = 0; t < Y; t++) {
        if (fy >= 0 && t >= fy) break;
        const k = i * Y + t, lv = r.trace.level[k];
        if (spend[t] && (lv < rule.lo || lv > rule.hi)) lvlBad++;
        if (rule.planTier && r.trace.tier[k] !== 0) tierBad++;
      }
      if (r.paths.survived[i] && r.trace.wealth[i * Y + Y - 1] < P - 1) potBad++;
    }
    const bad = lvlBad + tierBad + potBad; breaches += bad;
    console.log(`${arm.padEnd(9)} ${r.meta.id.padEnd(6)} spending years outside ${rule.lo}-${rule.hi}: ${lvlBad}   years off plan tier: ${rule.planTier ? tierBad : '-'}   survivors below the minimum pot: ${potBad}   ${bad ? 'BREACH' : 'ok'}`);
  }
}
console.log(files ? (breaches ? `K1 FAILED: ${breaches} breaches - a bug, fixed before anything else` : `K1 PASSED on ${files} records: every rule held on every path-year`) : 'K1: no records found');
process.exit(files && !breaches ? 0 : 1);
