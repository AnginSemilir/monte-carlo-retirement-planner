/*
 * THE RE-TIME'S READ (the speed review's instruction 5; STATE.md D24), printed from retime-port.sh's output (CHECKLIST 6).
 * For each pair (BASE, then PORT, side by side): the solve's and the engine's times and their ratios, PORT's engine with
 * its sharing off and on, and whether every hash two versions must share is the same (tableHash, layerHash, runHash; and
 * runHashShareOff against BASE's runHash). The pass mark (the review's "How to port"): every hash identical, and on S224
 * and S362 at 30 points under both arms the solve and the engine each at least twice as fast as BASE. A ratio short of it
 * is reported, with a profile to follow, not tuned until it passes.
 *   node research/solver/retime-port.mjs research/solver/results-retime-port.txt
 */
import { readFileSync } from 'node:fs';

const lines = readFileSync(process.argv[2] || new URL('./results-retime-port.txt', import.meta.url), 'utf8').split('\n');
const pairs = [];
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].startsWith('$ ')) continue;
  const b = JSON.parse(lines[i + 1]), p = JSON.parse(lines[i + 2]);
  pairs.push({ cmd: lines[i], b, p });
}
if (!pairs.length) { console.error('retime-port: no pairs'); process.exit(2); }
let pass = true;
for (const { b, p } of pairs) {
  if (b.id !== p.id || b.arm !== p.arm || b.points !== p.points) throw new Error(`retime-port: a pair of different runs (${b.id} ${b.arm}, ${p.id} ${p.arm})`);
  const solve = b.solveS / p.solveS, eng = b.engineMsPerPath / p.engineMsPerPath;
  const same = b.tableHash === p.tableHash && b.layerHash === p.layerHash && b.runHash === p.runHash && (!p.runHashShareOff || p.runHashShareOff === b.runHash);
  const ok = same && solve >= 2 && eng >= 2;
  if (!ok) pass = false;
  console.log(`${p.id} ${p.arm}, ${p.points} points: the solve ${b.solveS.toFixed(1)} s to ${p.solveS.toFixed(1)} s, ${solve.toFixed(2)} times; the engine ${b.engineMsPerPath.toFixed(1)} to ${p.engineMsPerPath.toFixed(1)} ms a path, ${eng.toFixed(2)} times (PORT with the sharing off ${p.engineMsPerPathShareOff !== undefined ? p.engineMsPerPathShareOff.toFixed(1) : '-'} ms); hashes ${same ? 'all the same' : `DIFFER (table ${b.tableHash} / ${p.tableHash}, layer ${b.layerHash} / ${p.layerHash}, run ${b.runHash} / ${p.runHash}${p.runHashShareOff ? `, run with the sharing off ${p.runHashShareOff}` : ''})`}${p.memoStats ? `; S1's memo answered ${(100 * p.memoStats.hits / (p.memoStats.hits + p.memoStats.miss)).toFixed(1)}%` : ''}${p.arefMemo ? `, S3 took ${p.arefMemo.hits} of ${p.arefMemo.hits + p.arefMemo.miss} moves from duplicates` : ''}: ${ok ? 'PASS' : 'SHORT'}`);
}
console.log(`VERDICT: ${pass ? 'PASS' : 'SHORT'} (the pass mark: every hash identical, the solve and the engine each at least twice as fast as BASE, ${pairs.length} pairs)`);
