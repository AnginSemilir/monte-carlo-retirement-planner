// EXPLORATORY, post hoc, deciding nothing: the read's stored arrays. Lifetime tax and the end pot by tenth of the market
// (ranked by APP's end pot): APP's and ROUTE's mean tax a path, and each arm's mean pot over the estate cap (4x opening wealth)
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;
const units = loadDir(R + 'results/couples-open-run', only).sort((a, b) => a.k - b.k);
for (const u of units) {
  const A = u.arms.APP, X = u.arms.ROUTE, n = u.N, cap = u.caps[0];
  const idx = Array.from({ length: n }, (_, i) => i).sort((p, q) => A.pot[p] - A.pot[q] || p - q);
  const row = []; let ta = 0, tx = 0, oa = 0, ox = 0, pa = 0, px = 0;
  for (let d = 0; d < 10; d++) {
    const lo = Math.floor(d * n / 10), hi = Math.floor((d + 1) * n / 10); let a = 0, x = 0;
    for (let j = lo; j < hi; j++) { const i = idx[j]; a += A.tax[i]; x += X.tax[i]; }
    row.push(`${Math.round(a / (hi - lo) / 1e3)}/${Math.round(x / (hi - lo) / 1e3)}`);
  }
  for (let i = 0; i < n; i++) { ta += A.tax[i]; tx += X.tax[i]; oa += Math.max(0, A.pot[i] - cap); ox += Math.max(0, X.pot[i] - cap); pa += A.pot[i]; px += X.pot[i]; }
  // the share of the mean pot's change that lies above the cap
  const dAll = (px - pa) / n, dOver = (ox - oa) / n;
  console.log(`${u.id.padEnd(11)} tax by tenth APP/ROUTE (k): ${row.join(' ')} | mean pot change ${Math.round(dAll / 1e3)}k, of it above the cap ${Math.round(dOver / 1e3)}k (${(100 * dOver / dAll).toFixed(0)}%)`);
}
