// EXPLORATORY, post hoc, deciding nothing: the read's stored arrays; each arm's mean spending level (delivered over the target
// times the years) by tenth of the market (ranked by APP's end pot), all paths in the tenth, and the end pot's median there
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const E = await import(R + '../engine.mjs');
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readOpenPanel } = await import(R + 'couples-open-panel.mjs');
const panel = Object.fromEntries(readOpenPanel().map(u => [u.id, u]));
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;
const units = loadDir(R + 'results/couples-open-run', only).sort((a, b) => a.k - b.k);
const med = a => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
for (const u of units) {
  const P = panel[u.id].plan, ctx = E.buildContext(E.resolveMpaa({ ...P })), T = ctx.totalYears, A = u.arms.APP, X = u.arms.ROUTE, n = u.N;
  // the years with a spending target: retired years (the first retirement on); count from the context
  const idx = Array.from({ length: n }, (_, i) => i).sort((p, q) => A.pot[p] - A.pot[q] || p - q);
  const row = [];
  for (let d = 0; d < 10; d++) {
    const lo = Math.floor(d * n / 10), hi = Math.floor((d + 1) * n / 10); let sa = 0, sx = 0; const pa = [], px = [];
    for (let j = lo; j < hi; j++) { const i = idx[j]; sa += A.delivered[i]; sx += X.delivered[i]; pa.push(A.pot[i]); px.push(X.pot[i]); }
    const m = hi - lo, y = u.target * (T + 1);
    row.push(`${(sa / m / y).toFixed(3)}/${(sx / m / y).toFixed(3)} ${Math.round(med(pa) / 1e3)}/${Math.round(med(px) / 1e3)}k`);
  }
  console.log(`${u.id.padEnd(11)} T${T} k${u.split.k.toFixed(3)} | ${row.join(' | ')}`);
}
