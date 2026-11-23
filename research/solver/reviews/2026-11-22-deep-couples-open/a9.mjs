// EXPLORATORY, post hoc, deciding nothing: the read's stored arrays. Per couple: APP's failures at the plan's end below the
// minimum pot (no unmet spending, failYear the last year) and running out; the worst tenth's spending level and median pot
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const E = await import(R + '../engine.mjs');
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readOpenPanel } = await import(R + 'couples-open-panel.mjs');
const panel = Object.fromEntries(readOpenPanel().map(u => [u.id, u]));
const units = loadDir(R + 'results/couples-open-run').sort((a, b) => a.k - b.k);
const med = a => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const out = {};
for (const u of units) {
  const P = panel[u.id].plan, ctx = E.buildContext(E.resolveMpaa({ ...P })), T = ctx.totalYears, A = u.arms.APP, X = u.arms.ROUTE, n = u.N;
  let end = 0, endT = 0, run = 0;
  for (let i = 0; i < n; i++) if (!A.survived[i]) { if (A.unmet[i] > 1) run++; else { end++; if (A.failYear[i] === T) endT++; } }
  const idx = Array.from({ length: n }, (_, i) => i).sort((p, q) => A.pot[p] - A.pot[q] || p - q);
  let sa = 0, sx = 0; const pa = [], px = [];
  for (let j = 0; j < n / 10; j++) { const i = idx[j]; sa += A.delivered[i]; sx += X.delivered[i]; pa.push(A.pot[i]); px.push(X.pot[i]); }
  const y = u.target * (T + 1) * (n / 10);
  (out[u.couple] = out[u.couple] || []).push({ id: u.id, end, endT, run, fail: end + run, lA: sa / y, lX: sx / y, mA: med(pa), mX: med(px), minPot: P.config.solvencyFloor });
}
for (const [c, rs] of Object.entries(out)) {
  for (const r of rs) console.log(`${r.id.padEnd(11)} APP fails ${r.fail}: at the end below the minimum pot ${r.end} (failYear the last ${r.endT}), running out ${r.run} | worst tenth level APP ${r.lA.toFixed(3)} ROUTE ${r.lX.toFixed(3)}; median pot APP £${Math.round(r.mA / 1e3)}k ROUTE £${Math.round(r.mX / 1e3)}k (minimum pot £${Math.round(r.minPot / 1e3)}k)`);
}
