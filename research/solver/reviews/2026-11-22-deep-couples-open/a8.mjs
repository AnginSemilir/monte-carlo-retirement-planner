// EXPLORATORY, post hoc, deciding nothing: the read's stored arrays. (1) the share of the mean pot's change lying above the
// estate cap (4x opening wealth), each unit; (2) lifetime tax, ROUTE less APP, the share of it in the better half of markets
// (paths ranked by APP's end pot), and each arm's tax in the worst and best tenths; (3) APP's paths over the cap
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const units = loadDir(R + 'results/couples-open-run').sort((a, b) => a.k - b.k);
const byC = {};
for (const u of units) {
  const A = u.arms.APP, X = u.arms.ROUTE, n = u.N, cap = u.caps[0];
  let pa = 0, px = 0, oa = 0, ox = 0, ta = 0, tx = 0, overA = 0;
  for (let i = 0; i < n; i++) { pa += A.pot[i]; px += X.pot[i]; oa += Math.max(0, A.pot[i] - cap); ox += Math.max(0, X.pot[i] - cap); ta += A.tax[i]; tx += X.tax[i]; if (A.pot[i] > cap) overA++; }
  const idx = Array.from({ length: n }, (_, i) => i).sort((p, q) => A.pot[p] - A.pot[q] || p - q);
  let hiGap = 0, wA = 0, wX = 0, bA = 0, bX = 0;
  for (let j = 0; j < n; j++) { const i = idx[j]; if (j >= n / 2) hiGap += X.tax[i] - A.tax[i]; if (j < n / 10) { wA += A.tax[i]; wX += X.tax[i]; } if (j >= 9 * n / 10) { bA += A.tax[i]; bX += X.tax[i]; } }
  const c = u.couple; (byC[c] = byC[c] || []).push({ id: u.id, above: (ox - oa) / (px - pa), meanPct: 100 * (px / pa - 1), taxGap: (tx - ta) / n, hiShare: hiGap / (tx - ta), wA: wA / (n / 10), wX: wX / (n / 10), bA: bA / (n / 10), bX: bX / (n / 10), overA: overA / n });
}
for (const [c, rs] of Object.entries(byC)) {
  const r = (k, f = x => x.toFixed(2)) => `${f(Math.min(...rs.map(x => x[k])))} to ${f(Math.max(...rs.map(x => x[k])))}`;
  console.log(`${c}: mean pot change ${r('meanPct', x => x.toFixed(1) + '%')}, of it above the cap ${r('above', x => (100 * x).toFixed(0) + '%')}; APP over the cap on ${r('overA', x => (100 * x).toFixed(0) + '%')} of paths; tax gap a path ${r('taxGap', x => '£' + Math.round(x / 1e3) + 'k')}, its share in the better half ${r('hiShare', x => (100 * x).toFixed(0) + '%')}; tax worst tenth APP ${r('wA', x => '£' + Math.round(x / 1e3) + 'k')} ROUTE ${r('wX', x => '£' + Math.round(x / 1e3) + 'k')}; best tenth APP ${r('bA', x => '£' + Math.round(x / 1e3) + 'k')} ROUTE ${r('bX', x => '£' + Math.round(x / 1e3) + 'k')}`);
}
