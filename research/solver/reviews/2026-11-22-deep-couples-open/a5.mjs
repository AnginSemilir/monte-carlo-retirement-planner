// EXPLORATORY, post hoc, deciding nothing: the read's stored arrays (seed 7026, already read). In the market's worst fifth
// (paths ranked by APP's end pot, all paths), ROUTE less APP: the mean end pot, the mean lifetime spending delivered and the
// mean lifetime tax, in pounds a path and in opening wealth; the pot gained less the spending given up
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const units = loadDir(R + 'results/couples-open-run').sort((a, b) => a.k - b.k);
const f = x => (x >= 0 ? '+' : '') + Math.round(x / 1e3) + 'k';
console.log('unit        scale   | worst fifth: dPot dSpend dTax (pot - spending given up)/scale | saved there | all paths: dPot(capped) dSpend dTax');
for (const u of units) {
  const A = u.arms.APP, X = u.arms.ROUTE, n = u.N, scale = u.caps[0] / 4, cap = u.caps[0];
  const idx = Array.from({ length: n }, (_, i) => i).sort((p, q) => A.pot[p] - A.pot[q] || p - q);
  const m = Math.floor(n / 5); let dp = 0, ds = 0, dt = 0, sv = 0;
  for (let j = 0; j < m; j++) { const i = idx[j]; dp += X.pot[i] - A.pot[i]; ds += X.delivered[i] - A.delivered[i]; dt += X.tax[i] - A.tax[i]; if (!A.survived[i] && X.survived[i]) sv++; }
  dp /= m; ds /= m; dt /= m;
  let cp = 0, as = 0, at = 0; for (let i = 0; i < n; i++) { cp += Math.min(X.pot[i], cap) - Math.min(A.pot[i], cap); as += X.delivered[i] - A.delivered[i]; at += X.tax[i] - A.tax[i]; }
  console.log(`${u.id.padEnd(11)} ${String(Math.round(scale / 1e3)).padStart(5)}k | ${f(dp).padStart(7)} ${f(ds).padStart(6)} ${f(dt).padStart(6)} ${((dp + ds) / scale).toFixed(3).padStart(7)} | ${String(sv).padStart(4)} | ${f(cp / n).padStart(6)} ${f(as / n).padStart(6)} ${f(at / n).padStart(6)}`);
}
