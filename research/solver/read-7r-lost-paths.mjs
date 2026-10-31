/*
 * WHERE 7R'S LOST PATHS SIT, AND WHAT THEY DO LATE (the first deep review's scratch reads, 26 Sep 17:12 UK, saved as a script
 * at the seventy-seventh review's MINOR 5; reported, not a test). 7r's reader lost 15 paths on S126 and 12 on bridge 4
 * against off, none saved (results-7r.txt). For each lost path: its long-run shift (pathsForSeed's last draw, the value the
 * tables' worlds stand for at -sqrt 3, 0, +sqrt 3) and whether it re-risks late - by reduce-7t.mjs's own definitions
 * (binOf, reRisksLate: the plan's tier or riskier in the last 8 RECORDED years after 10 or more below; runPolicy records no
 * year for the year a path fails in), so these are the figures 7t's items 15 and 16 will read on its own 8,000 paths.
 * The files go through two of reduce-7r.mjs's gates, as read-7r-failures.mjs does: requireFairLogs over the logs' stamps
 * and each trace's count, seed, arm and stamp against the logs' (checklist item 3: old files, a new question).
 *   node research/solver/read-7r-lost-paths.mjs > research/solver/results-7r-lost-paths.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { pathsForSeed } from '../engine.mjs';
import { decode, reRisksLate, binOf, lostAgainst, Z_BINS } from './reduce-7t.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'diag7r');
const PRED = 'research/solver/predictions/diag-7r.md', N = 3000, SEED = '7002';
const logs = Object.fromEntries(readdirSync(DIR).filter(f => /^part\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
requireFairLogs(logs, PRED);
const stampOf = t => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(t); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
const ST = stampOf(Object.values(logs)[0]);
if (!ST || Object.values(logs).some(t => JSON.stringify(stampOf(t)) !== JSON.stringify(ST))) { console.log('FAIR-TEST GATE: FAILED\n  the logs\' stamp lines are missing or differ'); process.exit(1); }
const load = (cs, arm) => {
  const f = join(DIR, `${cs}-${arm.toLowerCase()}.json.gz`), j = JSON.parse(gunzipSync(readFileSync(f)).toString());
  if (j.N !== N || String(j.seed) !== SEED || j.arm !== arm || !['code', 'audit', 'prediction', 'sha'].every(k => j.stamp && j.stamp[k] === ST[k])) { console.log(`FAIR-TEST GATE: FAILED\n  ${f}: count, seed, arm or stamp is not the logs'`); process.exit(1); }
  return decode(j);
};
console.log(`7R'S LOST PATHS: WHERE THEY SIT AND WHAT THEY DO LATE (reported, not a test; the logs' stamp gate and every trace's stamp checked; ${N} paths of seed ${SEED})`);
console.log(`shift bins: ${Z_BINS.map(([n]) => n).join(' / ')}\n`);
for (const cs of ['S126', 'bridge_4']) {
  const off = load(cs, 'OFF'), rd = load(cs, 'READER'), z = pathsForSeed(Number(SEED), N, off.Y - 1).map(p => p[off.Y]);
  const L = lostAgainst(rd, off), S = lostAgainst(off, rd), bins = ix => Z_BINS.map((_, k) => ix.filter(i => binOf(z[i]) === k).length).join('/');
  const all = z.map((_, i) => i), share = Z_BINS.map((_, k) => (100 * all.filter(i => binOf(z[i]) === k).length / N).toFixed(1));
  const sv = (T, k) => { let n = 0, ok = 0; for (let i = 0; i < N; i++) if (binOf(z[i]) === k) { n++; ok += T.survived[i]; } return (100 * ok / n).toFixed(2); };
  const survBelow1 = all.filter(i => rd.survived[i] && z[i] < -1);
  console.log(`${cs}: all paths by bin ${share.join('% / ')}%`);
  console.log(`  the reader against off: lost ${L.length} (${bins(L)}), saved ${S.length} (${bins(S)})`);
  console.log(`  survival by bin: OFF ${Z_BINS.map((_, k) => sv(off, k)).join(' / ')}; READER ${Z_BINS.map((_, k) => sv(rd, k)).join(' / ')}`);
  console.log(`  lost paths that re-risk late (recorded years only): ${L.filter(i => reRisksLate(rd, i)).length} of ${L.length}; the reader's surviving paths with a shift below -1 that do: ${survBelow1.filter(i => reRisksLate(rd, i)).length} of ${survBelow1.length}`);
}
