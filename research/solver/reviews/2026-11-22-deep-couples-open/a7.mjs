// the read's own timings (CPU a path, the solve), for sizing a replay; and each arm's mean spending a year in pounds
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const E = await import(R + '../engine.mjs');
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readOpenPanel } = await import(R + 'couples-open-panel.mjs');
const panel = Object.fromEntries(readOpenPanel().map(u => [u.id, u]));
const units = loadDir(R + 'results/couples-open-run').sort((a, b) => a.k - b.k);
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
for (const u of units) {
  const P = panel[u.id].plan, ctx = E.buildContext(E.resolveMpaa({ ...P })), T = ctx.totalYears;
  const A = u.arms.APP, X = u.arms.ROUTE, n = u.N;
  const ya = sum(A.delivered) / n / (T + 1), yx = sum(X.delivered) / n / (T + 1);
  console.log(`${u.id.padEnd(11)} k ${u.split.k.toFixed(3)} CPU a path APP ${(A.cpuUs / n / 1e3).toFixed(1)} ms ROUTE ${(X.cpuUs / n / 1e3).toFixed(1)} ms; solve ${X.solveSecs.toFixed(0)} s | spending a year, all paths: APP £${Math.round(ya)} ROUTE £${Math.round(yx)} (ROUTE less APP £${Math.round(yx - ya)})`);
}
