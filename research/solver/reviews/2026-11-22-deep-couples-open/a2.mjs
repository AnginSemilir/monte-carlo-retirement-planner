// EXPLORATORY, post hoc, deciding nothing: the registered read's stored arrays (seed 7026, already read); no new path or solve.
// On the paths both keep: ROUTE less APP, spending delivered and the end pot, by tenth of the market ranked by APP's own end pot.
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;
const units = loadDir(R + 'results/couples-open-run', only).sort((a, b) => a.k - b.k);
for (const u of units) {
  const A = u.arms.APP, X = u.arms.ROUTE, n = u.N;
  // rank every path by APP's end pot (a fixed policy's outcome: the market's quality), then take tenths of all paths
  const idx = Array.from({ length: n }, (_, i) => i).sort((p, q) => A.pot[p] - A.pot[q] || p - q);
  const out = [];
  for (let d = 0; d < 10; d++) {
    const lo = Math.floor(d * n / 10), hi = Math.floor((d + 1) * n / 10);
    let k = 0, sa = 0, sx = 0, pa = 0, px = 0, lost = 0, saved = 0;
    for (let j = lo; j < hi; j++) { const i = idx[j]; if (A.survived[i] && X.survived[i]) { k++; sa += A.delivered[i]; sx += X.delivered[i]; pa += A.pot[i]; px += X.pot[i]; } if (A.survived[i] && !X.survived[i]) lost++; if (!A.survived[i] && X.survived[i]) saved++; }
    out.push(k ? `${(100 * (sx / sa - 1)).toFixed(2).padStart(6)}%/${String(Math.round((px - pa) / k / 1e3)).padStart(5)}k(${k},${saved}s)` : `   -   (0,${saved}s)`);
  }
  console.log(`${u.id.padEnd(11)} ${out.join(' ')}`);
}
