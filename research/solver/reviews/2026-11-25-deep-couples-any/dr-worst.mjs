// POST HOC, a lead not a result: the worst fifth of markets by APP's end pot, ROUTE less APP a path (lifetime spending,
// lifetime tax, the end pot), and the paths saved and lost there; stored arrays only
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder (as run, the main tree's)
process.env.REG = process.env.REG || '1';
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const DIR = process.env.DIR || new URL('../../results/couples-any-run', import.meta.url).pathname; // as run, the launch worktree's results/couples-any-run (raw results stay outside git)
const pre = process.argv[2] || 'S041', W0 = Number(process.argv[3] || 450000);
const f0 = x => (x >= 0 ? '+' : '') + Math.round(x).toLocaleString('en-GB');
for (const u of loadDir(DIR).filter(u => u.id.startsWith(pre)).sort((a, b) => a.id.localeCompare(b.id))) {
  const A = u.arms.APP, B = u.arms.ROUTE, n = u.N, ord = Array.from({ length: n }, (_, i) => i).sort((i, j) => A.pot[i] - A.pot[j] || i - j).slice(0, Math.floor(n / 5));
  let s = 0, t = 0, p = 0, sv = 0, ls = 0;
  for (const i of ord) { s += B.delivered[i] - A.delivered[i]; t += B.tax[i] - A.tax[i]; p += B.pot[i] - A.pot[i]; if (!A.survived[i] && B.survived[i]) sv++; if (A.survived[i] && !B.survived[i]) ls++; }
  const m = ord.length;
  console.log(`${u.id.padEnd(14)} worst fifth: spending ${f0(s / m)}, tax ${f0(t / m)}, pot ${f0(p / m)} a path; pot plus spending ${(100 * (p + s) / m / W0).toFixed(1)}% of opening wealth; saved ${sv}, lost ${ls}`);
}
