// POST HOC, a lead not a result: each kind's two holdings on the same market paths (a couple's units share one seed and one
// horizon, so path i is one market in every unit of that couple), each arm's spending as a share of its own unit's target,
// on the paths all four arm-holdings keep; by tenth of the 'own' APP's end pot. Stored arrays only (loadDir), no run.
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder (as run, the main tree's)
process.env.REG = process.env.REG || '1';
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readAnyPanel } = await import(R + 'couples-any-panel.mjs');
const DIR = process.env.DIR || new URL('../../results/couples-any-run', import.meta.url).pathname; // as run, the launch worktree's results/couples-any-run (raw results stay outside git)
const couple = process.argv[2] || 'S041';
const panel = Object.fromEntries(readAnyPanel().map(u => [u.id, u]));
const ids = new Set(Object.keys(panel).filter(id => id.startsWith(couple + '-')));
const units = Object.fromEntries(loadDir(DIR, ids).map(u => [u.id, u]));
const kinds = [...new Set(Object.values(units).map(u => u.kind))].sort();
const f1 = x => (x >= 0 ? '+' : '') + x.toFixed(2);
const rows = [];
for (const k of kinds) {
  const o = units[`${couple}-${k}-own`], y = units[`${couple}-${k}-Y75`];
  if (!o || !y) continue;
  const Po = panel[o.id].plan.demographics, T = Number(Po.terminalAge) - Number(Po.currentAgeSelf);
  const tR = Math.max(0, Math.min(Number(Po.retireAgeSelf) - Number(Po.currentAgeSelf), Number(Po.retireAgePart) - Number(Po.currentAgePart)));
  const yrs = T + 1 - tR, n = o.N;
  if (y.N !== n) throw new Error('paths differ');
  const sh = (u, arm, i) => 100 * u.arms[arm].delivered[i] / (u.target * yrs);
  const ord = Array.from({ length: n }, (_, i) => i).sort((i, j) => o.arms.APP.pot[i] - o.arms.APP.pot[j] || i - j);
  const all4 = i => o.arms.APP.survived[i] && o.arms.ROUTE.survived[i] && y.arms.APP.survived[i] && y.arms.ROUTE.survived[i];
  const tenths = [];
  let N4 = 0, dR = 0, dA = 0, gO = 0, gY = 0;
  for (let j = 0; j < 10; j++) {
    const sl = ord.slice(Math.floor(j * n / 10), Math.floor((j + 1) * n / 10)).filter(all4);
    let a = 0, b = 0;
    for (const i of sl) { a += sh(y, 'ROUTE', i) - sh(o, 'ROUTE', i); b += sh(y, 'APP', i) - sh(o, 'APP', i); }
    tenths.push(sl.length ? [a / sl.length, b / sl.length, sl.length] : [NaN, NaN, 0]);
  }
  for (let i = 0; i < n; i++) if (all4(i)) { N4++; dR += sh(y, 'ROUTE', i) - sh(o, 'ROUTE', i); dA += sh(y, 'APP', i) - sh(o, 'APP', i); gO += sh(o, 'ROUTE', i) - sh(o, 'APP', i); gY += sh(y, 'ROUTE', i) - sh(y, 'APP', i); }
  rows.push({ k, N4, dR: dR / N4, dA: dA / N4, gO: gO / N4, gY: gY / N4, tenths, kO: o.split.k, kY: y.split.k, lab: `${panel[o.id].label} | ${panel[y.id].label}` });
}
console.log(`${couple}: each kind's spending as a share of its unit's target, in points, on the paths its own and Y75 units keep under both arms; ROUTE less APP at each holding, and Y75 less own for each arm (post hoc)`);
for (const r of rows) {
  console.log(`${r.k.padEnd(5)} k ${r.kO.toFixed(3)}/${r.kY.toFixed(3)} paths ${r.N4}: ROUTE-APP own ${f1(r.gO)} Y75 ${f1(r.gY)} | Y75-own ROUTE ${f1(r.dR)} APP ${f1(r.dA)} | ${r.lab}`);
  console.log(`      Y75-own by tenth, ROUTE: ${r.tenths.map(t => f1(t[0])).join(' ')}`);
  console.log(`      Y75-own by tenth, APP:   ${r.tenths.map(t => f1(t[1])).join(' ')}`);
}
const m = key => rows.reduce((t, r) => t + r[key], 0) / rows.length;
console.log(`mean over ${rows.length} kinds: ROUTE-APP own ${f1(m('gO'))} Y75 ${f1(m('gY'))}; Y75-own ROUTE ${f1(m('dR'))} APP ${f1(m('dA'))}`);
