process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const P = loadDir(R + 'results/couples-open-pilot');
const s = new Set(P.map(u => `${u.routeCtx} ${u.arms.APP.config} ${u.arms.ROUTE.config} ${JSON.stringify(u.mpaa)}`));
console.log([...s].slice(0, 5).join('\n'), '\n', s.size, 'distinct');
const G = Object.fromEntries(loadDir(R + 'results/couples-open-run').map(u => [u.id, u]));
let inp = 0; for (const u of P) if (G[u.id] && u.arms.APP.inputs === G[u.id].arms.APP.inputs && u.arms.ROUTE.inputs === G[u.id].arms.ROUTE.inputs) inp++;
console.log('engine inputs equal to the registered run on both arms:', inp, 'of', P.length);
