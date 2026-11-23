// EXPLORATORY, post hoc, deciding nothing: the dress rehearsal's stored arrays (seed 7002, 4,000 paths, already read) for S025,
// and its addendum's; the same tables as a1-a3 (k, failure kinds, the level by market tenth, the end pot)
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const E = await import(R + '../engine.mjs');
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readOpenPanel } = await import(R + 'couples-open-panel.mjs');
const panel = Object.fromEntries(readOpenPanel().map(u => [u.id, u]));
const dir = process.argv[2], pre = process.argv[3] || 'S025';
const units = loadDir(R + 'results/' + dir).filter(u => u.id.startsWith(pre)).sort((a, b) => a.k - b.k);
const med = a => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
for (const u of units) {
  const P = panel[u.id].plan, d = P.demographics, ctx = E.buildContext(E.resolveMpaa({ ...P })), T = ctx.totalYears, A = u.arms.APP, X = u.arms.ROUTE, n = u.N;
  const sp = E.num(d.statePensionSelf, 0) + E.num(d.statePensionPart, 0), inc = (P.otherIncomes || []).reduce((t, i) => t + E.num(i.amount, 0), 0);
  let fa = 0, ea = 0; for (let i = 0; i < n; i++) if (!A.survived[i]) { fa++; if (!(A.unmet[i] > 1)) ea++; }
  const idx = Array.from({ length: n }, (_, i) => i).sort((p, q) => A.pot[p] - A.pot[q] || p - q), row = [];
  for (const dd of [0, 1, 4, 9]) {
    const lo = Math.floor(dd * n / 10), hi = Math.floor((dd + 1) * n / 10); let sa = 0, sx = 0, ka = 0, kx = 0, kn = 0; const pa = [], px = [];
    for (let j = lo; j < hi; j++) { const i = idx[j]; sa += A.delivered[i]; sx += X.delivered[i]; pa.push(A.pot[i]); px.push(X.pot[i]); if (A.survived[i] && X.survived[i]) { kn++; ka += A.delivered[i]; kx += X.delivered[i]; } }
    const m = hi - lo, y = u.target * (T + 1);
    row.push(`t${dd + 1} ${(sa / m / y).toFixed(3)}/${(sx / m / y).toFixed(3)} ${Math.round(med(pa) / 1e3)}/${Math.round(med(px) / 1e3)}k kept ${kn ? (100 * (kx / ka - 1)).toFixed(2) : '-'}%`);
  }
  console.log(`${u.id.padEnd(11)} ${u.route} k${u.split && u.split.k ? u.split.k.toFixed(3) : '-'} target ${u.target} scale ${u.caps[0] / 4} minpot ${P.config.solvencyFloor} cover ${((sp + inc) / u.target).toFixed(2)} APPfail ${fa} (end ${ea}) | ${row.join(' | ')}`);
}
