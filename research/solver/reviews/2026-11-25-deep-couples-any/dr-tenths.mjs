// POST HOC, a lead not a result: the registered run's stored arrays (seed 7027, already read), decoded with the reducer's own
// loadDir; the plans as readAnyPanel builds them (read only, for each unit's years). No solve, no path, no context.
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder (as run, the main tree's)
process.env.REG = process.env.REG || '1';
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readAnyPanel } = await import(R + 'couples-any-panel.mjs');
const DIR = process.env.DIR || new URL('../../results/couples-any-run', import.meta.url).pathname; // as run, the launch worktree's results/couples-any-run (raw results stay outside git)
const prefix = process.argv[2] || 'S041';
const panel = Object.fromEntries(readAnyPanel().map(u => [u.id, u]));
const ids = new Set(Object.keys(panel).filter(id => id.startsWith(prefix)));
const units = loadDir(DIR, ids).sort((a, b) => a.id.localeCompare(b.id));
const f0 = x => (x >= 0 ? '+' : '') + Math.round(x).toLocaleString('en-GB');
for (const u of units) {
  const P = panel[u.id].plan, d = P.demographics, T = Number(d.terminalAge) - Number(d.currentAgeSelf);
  const tR = Math.max(0, Math.min(Number(d.retireAgeSelf) - Number(d.currentAgeSelf), Number(d.retireAgePart) - Number(d.currentAgePart)));
  const yrs = T + 1 - tR, A = u.arms.APP, B = u.arms.ROUTE, n = u.N;
  const ord = Array.from({ length: n }, (_, i) => i).sort((i, j) => A.pot[i] - A.pot[j] || i - j);
  const cap = (u.caps || [0])[0];
  let kept = 0, kA = 0, kB = 0, tA = 0, tB = 0, dA = 0, dB = 0, pA = 0, pB = 0, cA = 0, cB = 0;
  for (let i = 0; i < n; i++) { tA += A.tax[i]; tB += B.tax[i]; dA += A.delivered[i]; dB += B.delivered[i]; pA += A.pot[i]; pB += B.pot[i]; cA += Math.min(A.pot[i], cap); cB += Math.min(B.pot[i], cap); if (A.survived[i] && B.survived[i]) { kept++; kA += A.delivered[i]; kB += B.delivered[i]; } }
  const tenth = [];
  for (let j = 0; j < 10; j++) {
    const sl = ord.slice(Math.floor(j * n / 10), Math.floor((j + 1) * n / 10));
    let s = 0, l = 0, dd = 0, kk = 0, kd = 0, dp = 0, dt = 0;
    for (const i of sl) { if (!A.survived[i] && B.survived[i]) s++; if (A.survived[i] && !B.survived[i]) l++; dd += B.delivered[i] - A.delivered[i]; dp += B.pot[i] - A.pot[i]; dt += B.tax[i] - A.tax[i]; if (A.survived[i] && B.survived[i]) { kk++; kd += B.delivered[i] - A.delivered[i]; } }
    tenth.push({ s, l, all: dd / sl.length / yrs, kept: kk ? kd / kk / yrs : NaN, pot: dp / sl.length, tax: dt / sl.length / yrs });
  }
  console.log(`${u.id.padEnd(14)} ${String(u.target).padEnd(6)} ${String(panel[u.id].label).padEnd(30)} yrs ${yrs} | APP ${(100 * A.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)} ROUTE ${(100 * B.survived.reduce((t, v) => t + v, 0) / n).toFixed(2)} | kept £/yr ${f0((kB - kA) / kept / yrs)} (APP ${f0(kA / kept / yrs)}) all £/yr ${f0((dB - dA) / n / yrs)} | tax £/yr ${f0((tB - tA) / n / yrs)} (APP ${f0(tA / n / yrs)}) | pot ${f0((pB - pA) / n)} capped ${f0((cB - cA) / n)}`);
  console.log(`   kept £/yr by tenth of APP's end pot: ${tenth.map(t => (Number.isNaN(t.kept) ? 'na' : f0(t.kept))).join(' ')}`);
  console.log(`   tax £/yr by tenth: ${tenth.map(t => f0(t.tax)).join(' ')}; saved/lost: ${tenth.map(t => `${t.s}/${t.l}`).join(' ')}`);
}
