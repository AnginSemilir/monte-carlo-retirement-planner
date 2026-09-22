/*
 * PHASE E4'S MEASUREMENT, BEFORE ANY CODE.  (PLAN.md Phases E2 to E4)
 *
 *   node research/solver/e4-measure.mjs
 *
 * The proposal: `readValues` accumulates from four separate arrays - survival, bequest, resilience,
 * shortfall - at the same index. Four arrays, four places in memory, eight corners, so up to 32 cache
 * lines a call. At 30 points each array is 78 KB and the four together are 311 KB, which misses L1
 * (32-48 KB) on every read. Store the four values for a cell adjacently, value v at 4i+v, and one
 * corner becomes four consecutive doubles - 32 bytes, ONE line. Eight lines a call instead of 32.
 *
 * The plan's own instruction, and the reason this file exists: "cache guesses are exactly the guesses
 * that come out wrong. Time a loop reading four separate arrays against one interleaved array, at this
 * size, on this machine, before touching grid.js. A morning's work if the number is good; nothing if
 * it is not."
 *
 * RUN IT ON A QUIET MACHINE. A microbenchmark measuring cache behaviour is worthless while four solver
 * jobs are saturating the cores - it would be timing contention, not layout. The script refuses if it
 * sees the experiment lock held.
 */
import { existsSync, readFileSync } from 'node:fs';

const LOCK = '/tmp/solver-experiment.lock';
if (existsSync(LOCK)) {
  console.error('REFUSED: an experiment holds the lock, so the cores are busy and a cache benchmark');
  console.error('would measure contention rather than memory layout. Held by:');
  try { console.error('  ' + readFileSync(LOCK + '/what', 'utf8').trim()); } catch { /* no note */ }
  process.exit(1);
}

/* the real shape: 30 points x 6 x 6 shares x 3 gain x 3 pcls */
const N1 = 30, N2 = 6, N3 = 6, NG = 3, NC = 3;
const N = N1 * N2 * N3 * NG * NC;
const strideIsa = N1, strideTax = N1 * N2, strideGain = N1 * N2 * N3, stridePcls = strideGain * NG;
console.log(`cells ${N.toLocaleString()}, one array ${(N * 8 / 1024).toFixed(0)} KB, four ${(4 * N * 8 / 1024).toFixed(0)} KB`);
console.log(`(L1 is typically 32-48 KB and L2 512 KB-2 MB, so four separate arrays miss L1 on every read)\n`);

const sep = [0, 1, 2, 3].map(() => { const a = new Float64Array(N); for (let i = 0; i < N; i++) a[i] = Math.random(); return a; });
const inter = new Float64Array(4 * N);
for (let i = 0; i < N; i++) for (let v = 0; v < 4; v++) inter[4 * i + v] = sep[v][i];

/* readValues' own corner pattern: trilinear over three axes at fixed gain and pcls buckets */
const corners = (i0) => [i0, i0 + 1, i0 + strideIsa, i0 + strideIsa + 1,
  i0 + strideTax, i0 + strideTax + 1, i0 + strideTax + strideIsa, i0 + strideTax + strideIsa + 1];

const ITER = 400000;
/* the cells a landing actually touches wander, so the starting corner is drawn fresh each call */
const starts = new Int32Array(ITER);
for (let k = 0; k < ITER; k++) {
  const p = (Math.random() * (N1 - 1)) | 0, i = (Math.random() * (N2 - 1)) | 0, t = (Math.random() * (N3 - 1)) | 0;
  const g = (Math.random() * NG) | 0, c = (Math.random() * NC) | 0;
  starts[k] = p + i * strideIsa + t * strideTax + g * strideGain + c * stridePcls;
}
const W = new Float64Array(8);
for (let k = 0; k < 8; k++) W[k] = 0.125;

const runSeparate = () => {
  let a = 0, b = 0, c = 0, d = 0;
  for (let k = 0; k < ITER; k++) {
    const idx = corners(starts[k]);
    for (let j = 0; j < 8; j++) { const w = W[j], i = idx[j]; a += w * sep[0][i]; b += w * sep[1][i]; c += w * sep[2][i]; d += w * sep[3][i]; }
  }
  return a + b + c + d;
};
const runInterleaved = () => {
  let a = 0, b = 0, c = 0, d = 0;
  for (let k = 0; k < ITER; k++) {
    const idx = corners(starts[k]);
    for (let j = 0; j < 8; j++) { const w = W[j], i = 4 * idx[j]; a += w * inter[i]; b += w * inter[i + 1]; c += w * inter[i + 2]; d += w * inter[i + 3]; }
  }
  return a + b + c + d;
};

/* both are run several times, alternating, and the BEST of each is reported: a benchmark's slow runs
 * are noise from something else on the box, its fast runs are the machine doing the work */
const time = (f) => { const t = process.hrtime.bigint(); const v = f(); return { ms: Number(process.hrtime.bigint() - t) / 1e6, v }; };
runSeparate(); runInterleaved();            // warm up, let the JIT settle
let bs = Infinity, bi = Infinity, sumS = 0, sumI = 0;
const ROUNDS = 7;
for (let r = 0; r < ROUNDS; r++) {
  const s = time(runSeparate), i = time(runInterleaved);
  bs = Math.min(bs, s.ms); bi = Math.min(bi, i.ms); sumS += s.v; sumI += i.v;
}
const agree = Math.abs(sumS - sumI) / Math.max(1, Math.abs(sumS)) < 1e-12;
console.log(`  ${'layout'.padEnd(30)}${'best ms'.padStart(10)}${'ns/call'.padStart(10)}`);
console.log(`  ${'four separate arrays'.padEnd(30)}${bs.toFixed(1).padStart(10)}${(1e6 * bs / ITER).toFixed(1).padStart(10)}`);
console.log(`  ${'one interleaved array'.padEnd(30)}${bi.toFixed(1).padStart(10)}${(1e6 * bi / ITER).toFixed(1).padStart(10)}`);
console.log(`\n  speedup ${(bs / bi).toFixed(3)}x over ${ROUNDS} rounds, ${ITER.toLocaleString()} reads each`);
console.log(`  arithmetic identical: ${agree ? 'yes, both totals agree' : 'NO - the benchmark is wrong, not the layout'}`);
const gain = 100 * (1 - bi / bs);
console.log(`\n  VERDICT: ${gain > 8 ? `interleaving is worth ${gain.toFixed(1)}% on this access pattern - BUILD IT`
  : gain > 3 ? `${gain.toFixed(1)}%: real but small. Weigh it against half a day and a second index scheme to keep in step`
  : `${gain.toFixed(1)}%: not worth half a day. E4 is DEAD, for twenty minutes rather than a morning`}`);
console.log(`  (this is the read path only; a solve also writes these arrays, which interleaving affects the same way)`);
