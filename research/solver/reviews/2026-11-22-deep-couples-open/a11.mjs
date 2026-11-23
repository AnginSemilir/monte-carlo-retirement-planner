// EXPLORATORY, post hoc, deciding nothing: the read's stored arrays. The best tenth (paths ranked by APP's end pot): ROUTE's
// spending level less APP's (points of the target a year) and the mean end pot ROUTE less APP, on S119, S199 and S279
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const E = await import(R + '../engine.mjs');
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readOpenPanel } = await import(R + 'couples-open-panel.mjs');
const panel = Object.fromEntries(readOpenPanel().map(u => [u.id, u]));
const units = loadDir(R + 'results/couples-open-run').filter(u => u.couple !== 'S037');
const rows = [];
for (const u of units) {
  const P = panel[u.id].plan, ctx = E.buildContext(E.resolveMpaa({ ...P })), T = ctx.totalYears, A = u.arms.APP, X = u.arms.ROUTE, n = u.N;
  // the retired years: the spending level over the years with a target, from the first retirement
  const tR = Math.max(0, Math.min(ctx.owners.find(o => o.key === 'self').retireAge - ctx.ageSelf0, ctx.owners.find(o => o.key === 'part').retireAge - ctx.agePart0));
  const idx = Array.from({ length: n }, (_, i) => i).sort((p, q) => A.pot[p] - A.pot[q] || p - q);
  let sa = 0, sx = 0, pa = 0, px = 0; const m = n / 10;
  for (let j = n - m; j < n; j++) { const i = idx[j]; sa += A.delivered[i]; sx += X.delivered[i]; pa += A.pot[i]; px += X.pot[i]; }
  const yrs = T + 1 - tR, y = u.target * yrs * m;
  rows.push({ id: u.id, d: 100 * (sx - sa) / y, dp: (px - pa) / m });
}
const mn = k => Math.min(...rows.map(r => r[k])), mx = k => Math.max(...rows.map(r => r[k]));
console.log(`best tenth, 33 units: ROUTE less APP spending ${mn('d').toFixed(2)} to ${mx('d').toFixed(2)} points of the target a retired year; the mean end pot ${Math.round(mn('dp') / 1e6)}m to ${Math.round(mx('dp') / 1e6)}m`);
