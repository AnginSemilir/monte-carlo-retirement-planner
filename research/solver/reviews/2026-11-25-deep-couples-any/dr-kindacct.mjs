// POST HOC, a lead not a result: per kind, each arm's 25/75 less 60/40 on the same markets: spending, tax a year, the end
// pot; and ROUTE's by tenth of the 60/40 APP's end pot (tax a year, spending a year). Stored arrays only.
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder (as run, the main tree's)
process.env.REG = process.env.REG || '1';
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readAnyPanel } = await import(R + 'couples-any-panel.mjs');
const DIR = process.env.DIR || new URL('../../results/couples-any-run', import.meta.url).pathname; // as run, the launch worktree's results/couples-any-run (raw results stay outside git)
const c = process.argv[2] || 'S041';
const panel = Object.fromEntries(readAnyPanel().map(u => [u.id, u]));
const U = Object.fromEntries(loadDir(DIR, new Set(Object.keys(panel).filter(id => id.startsWith(c + '-')))).map(u => [u.id, u]));
const f0 = x => (x >= 0 ? '+' : '') + Math.round(x).toLocaleString('en-GB');
const kinds = [...new Set(Object.values(U).map(u => u.kind))].sort();
const tenT = new Array(10).fill(0), tenS = new Array(10).fill(0); let nk = 0;
for (const k of kinds) {
  const o = U[`${c}-${k}-own`], y = U[`${c}-${k}-Y75`]; if (!o || !y) continue;
  const d = panel[o.id].plan.demographics, T = Number(d.terminalAge) - Number(d.currentAgeSelf), n = o.N;
  const tR = Math.max(0, Math.min(Number(d.retireAgeSelf) - Number(d.currentAgeSelf), Number(d.retireAgePart) - Number(d.currentAgePart))), yrs = T + 1 - tR;
  const line = arm => { const a = o.arms[arm], b = y.arms[arm]; let s = 0, t = 0, p = 0; for (let i = 0; i < n; i++) { s += b.delivered[i] - a.delivered[i]; t += b.tax[i] - a.tax[i]; p += b.pot[i] - a.pot[i]; } return `${arm} spending ${f0(s / n / yrs)} tax ${f0(t / n / yrs)} pot ${f0(p / n)}`; };
  const same = panel[o.id].label === panel[y.id].label;
  console.log(`${k.padEnd(5)} ${line('APP')} | ${line('ROUTE')} | APP's pick ${same ? 'the same' : `${panel[o.id].label} -> ${panel[y.id].label}`}`);
  const ord = Array.from({ length: n }, (_, i) => i).sort((i, j) => o.arms.APP.pot[i] - o.arms.APP.pot[j] || i - j);
  for (let j = 0; j < 10; j++) { const sl = ord.slice(Math.floor(j * n / 10), Math.floor((j + 1) * n / 10)); let t = 0, s = 0; for (const i of sl) { t += y.arms.ROUTE.tax[i] - o.arms.ROUTE.tax[i]; s += y.arms.ROUTE.delivered[i] - o.arms.ROUTE.delivered[i]; } tenT[j] += t / sl.length / yrs; tenS[j] += s / sl.length / yrs; }
  nk++;
}
console.log(`ROUTE 25/75 less 60/40, mean over ${nk} kinds, by tenth of the 60/40 APP's end pot (worst first): tax a year ${tenT.map(x => f0(x / nk)).join(' ')}`);
console.log(`   spending a year (all paths) ${tenS.map(x => f0(x / nk)).join(' ')}`);
