// POST HOC, a lead not a result: where ROUTE's lost and saved paths lie (tenth of APP's end pot; each arm's failure year),
// stored arrays only
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder (as run, the main tree's)
process.env.REG = process.env.REG || '1';
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const DIR = process.env.DIR || new URL('../../results/couples-any-run', import.meta.url).pathname; // as run, the launch worktree's results/couples-any-run (raw results stay outside git)
const ids = new Set(process.argv.slice(2));
for (const u of loadDir(DIR, ids).sort((a, b) => a.id.localeCompare(b.id))) {
  const A = u.arms.APP, B = u.arms.ROUTE, n = u.N, rank = new Int32Array(n);
  Array.from({ length: n }, (_, i) => i).sort((i, j) => A.pot[i] - A.pot[j] || i - j).forEach((i, r) => { rank[i] = r; });
  const lostT = new Array(10).fill(0), savedT = new Array(10).fill(0), fy = [], fyS = [], fyAll = [];
  let lostEnd = 0, lostRun = 0;
  for (let i = 0; i < n; i++) {
    const t = Math.min(9, Math.floor(10 * rank[i] / n));
    if (A.survived[i] && !B.survived[i]) { lostT[t]++; fy.push(B.failYear[i]); if (B.unmet[i] > 1) lostRun++; else lostEnd++; }
    if (!A.survived[i] && B.survived[i]) { savedT[t]++; fyS.push(A.failYear[i]); }
    if (!B.survived[i]) fyAll.push(B.failYear[i]);
  }
  const med = a => { const s = [...a].sort((p, q) => p - q); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
  console.log(`${u.id}: lost ${fy.length} by APP tenth ${lostT.join(' ')}; ROUTE's failure year on them median ${med(fy)} (range ${Math.min(...fy)}-${Math.max(...fy)}); ${lostRun} with unmet spending, ${lostEnd} at the minimum pot alone | saved ${fyS.length} by tenth ${savedT.join(' ')}, APP's failure year median ${med(fyS)} | ROUTE's failures ${fyAll.length}, failure year median ${med(fyAll)}`);
}
