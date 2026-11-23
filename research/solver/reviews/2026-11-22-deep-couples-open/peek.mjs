process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const units = loadDir(R + 'results/couples-open-run', new Set(['S037-Y75', 'S119-Y75']));
for (const u of units) {
  const { arms, ...rest } = u;
  console.log(u.id, JSON.stringify(rest).slice(0, 1500));
  for (const a of ['APP', 'ROUTE']) { const A = arms[a]; console.log(a, Object.keys(A).join(','), A.solveSecs, A.place); }
}
