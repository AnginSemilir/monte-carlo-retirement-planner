const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const E = await import(R + '../engine.mjs');
const { readOpenPanel } = await import(R + 'couples-open-panel.mjs');
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const panel = readOpenPanel().filter(u => u.couple === 'S025' && u.route === 'household');
const recs = Object.fromEntries([...loadDir(R + 'results/couples-open-7002'), ...loadDir(R + 'results/couples-open-7002-add')].map(u => [u.id, u]));
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
for (const u of panel) {
  const p = u.plan, d = p.demographics, r = recs[u.id], ctx = E.buildContext(E.resolveMpaa({ ...p })), T = ctx.totalYears;
  const ya = sum(r.arms.APP.delivered) / r.N / (T + 1), yx = sum(r.arms.ROUTE.delivered) / r.N / (T + 1);
  console.log(`${u.id} ages ${d.currentAgeSelf}/${d.currentAgePart} SP ${d.statePensionSelf}/${d.statePensionPart} SPA ${d.statePensionAge} target ${u.target} minpot ${p.config.solvencyFloor} k ${r.split && r.split.k} pots ${Math.round(p.accounts.reduce((t, a) => t + a.balance, 0))} | a year APP £${Math.round(ya)} ROUTE £${Math.round(yx)} (ROUTE less APP £${Math.round(yx - ya)}); tax APP £${Math.round(sum(r.arms.APP.tax) / r.N)} ROUTE £${Math.round(sum(r.arms.ROUTE.tax) / r.N)}`);
}
