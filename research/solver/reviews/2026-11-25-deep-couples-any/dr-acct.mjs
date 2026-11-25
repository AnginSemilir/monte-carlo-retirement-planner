// POST HOC, a lead not a result: each arm's money, Y75 less own, on the same markets (paired by path): spending delivered and
// lifetime tax a year (all paths), the end pot (mean, and capped at the unit's estate cap), survival; per couple, the mean
// over its kinds. Stored arrays only.
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder (as run, the main tree's)
process.env.REG = process.env.REG || '1';
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readAnyPanel } = await import(R + 'couples-any-panel.mjs');
const DIR = process.env.DIR || new URL('../../results/couples-any-run', import.meta.url).pathname; // as run, the launch worktree's results/couples-any-run (raw results stay outside git)
const panel = Object.fromEntries(readAnyPanel().map(u => [u.id, u]));
const couples = (process.argv[2] || 'S041,S123,S207,S281,S185,S197').split(',');
const f0 = x => (x >= 0 ? '+' : '') + Math.round(x).toLocaleString('en-GB');
for (const c of couples) {
  const ids = new Set(Object.keys(panel).filter(id => id.startsWith(c + '-')));
  const U = Object.fromEntries(loadDir(DIR, ids).map(u => [u.id, u]));
  const kinds = [...new Set(Object.values(U).map(u => u.kind))];
  const acc = { APP: [], ROUTE: [] };
  for (const k of kinds) {
    const o = U[`${c}-${k}-own`], y = U[`${c}-${k}-Y75`]; if (!o || !y) continue;
    const d = panel[o.id].plan.demographics, T = Number(d.terminalAge) - Number(d.currentAgeSelf), n = o.N;
    const tR = Math.max(0, Math.min(Number(d.retireAgeSelf) - Number(d.currentAgeSelf), Number(d.retireAgePart) - Number(d.currentAgePart))), yrs = T + 1 - tR;
    const cap = Math.min((o.caps || [0])[0], (y.caps || [0])[0]);
    for (const arm of ['APP', 'ROUTE']) {
      const a = o.arms[arm], b = y.arms[arm];
      let dd = 0, dt = 0, dp = 0, dc = 0, ds = 0;
      for (let i = 0; i < n; i++) { dd += b.delivered[i] - a.delivered[i]; dt += b.tax[i] - a.tax[i]; dp += b.pot[i] - a.pot[i]; dc += Math.min(b.pot[i], cap) - Math.min(a.pot[i], cap); ds += b.survived[i] - a.survived[i]; }
      acc[arm].push({ k, spend: dd / n / yrs, tax: dt / n / yrs, pot: dp / n, capped: dc / n, surv: 100 * ds / n, tgt: y.target - o.target });
    }
  }
  for (const arm of ['APP', 'ROUTE']) {
    const L = acc[arm], m = key => L.reduce((t, r) => t + r[key], 0) / L.length;
    console.log(`${c} ${arm.padEnd(5)} (${L.length} kinds), Y75 less own: spending ${f0(m('spend'))} a year, tax ${f0(m('tax'))} a year, end pot ${f0(m('pot'))}, capped ${f0(m('capped'))}, survival ${m('surv').toFixed(2)} points; target ${f0(m('tgt'))}`);
  }
}
