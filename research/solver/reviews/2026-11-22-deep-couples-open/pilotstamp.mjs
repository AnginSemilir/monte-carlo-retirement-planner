process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const P = loadDir(R + 'results/couples-open-pilot'), G = Object.fromEntries(loadDir(R + 'results/couples-open-run').map(u => [u.id, u]));
const stamps = new Set(P.map(u => `${u.stamp.code} ${u.stamp.audit} ${u.seed} ${u.N} ${u.pts}`));
let same = 0;
for (const u of P) if (G[u.id] && JSON.stringify(u.digests) === JSON.stringify(G[u.id].digests)) same++;
console.log(`pilot units ${P.length}; stamps ${[...stamps].join(' | ')}; table digests equal to the registered run's on ${same} of ${P.length}`);
