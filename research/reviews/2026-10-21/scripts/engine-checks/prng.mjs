// RANDOM NUMBERS (external review, 21 Oct 2026; Part A, Question 1). Maps every path stream of the registry's seeds onto
// mulberry32's single 2^32 cycle to find the closest pair, then checks correlations and moments of the normal draws.
// usage (from the repository root): node research/reviews/2026-10-21/scripts/engine-checks/prng.mjs
import { resolve } from 'path';
import { pathToFileURL } from 'url';
const root = process.cwd();
const imp = (p) => import(pathToFileURL(resolve(root, p)).href);
const E = await imp('research/engine.mjs');
// mulberry32's state is a counter a_k = seed + k*G (mod 2^32); two streams overlap iff their start difference is k*G with small |k|
const G = 0x6D2B79F5 >>> 0;
let Ginv = 1; for (let i = 0; i < 40; i++) Ginv = Math.imul(Ginv, (2 - Math.imul(G, Ginv)) | 0) >>> 0; // Newton inverse mod 2^32
console.log('G*Ginv mod 2^32 =', Math.imul(G, Ginv) >>> 0);
const kDist = (d) => { const k = Math.imul(d | 0, Ginv | 0) >>> 0; return Math.min(k, 4294967296 - k); };
const seeds = [7001,7002,7003,7004,7005,7006,7007,7008,7009,7010,7011,7012,7013,7014,7101,9102,12345];
const N = 16000; let worst = { k: Infinity };
for (let a = 0; a < seeds.length; a++) for (let b = a; b < seeds.length; b++) for (let dj = -(N - 1); dj <= N - 1; dj++) {
  if (a === b && dj === 0) continue;
  const d = (seeds[b] - seeds[a]) + 7919 * dj; const k = kDist(d);
  if (k < worst.k) worst = { k, sa: seeds[a], sb: seeds[b], dj };
}
console.log('closest pair of path streams (in draws apart on the shared 2^32 cycle):', worst, ' draws per 60-year path ~', 2 * 62);
// empirical: adjacent paths, and the same path index in seeds 7001 and 7002
// the draws themselves are generated only for seeds outside the held-out set (the overlap check above uses seed numbers alone)
const Y = 40, n = 16000, A = E.pathsForSeed(7001, n, Y), B = E.pathsForSeed(7002, n, Y);
const corr = (xs, ys) => { let sx=0,sy=0,sxx=0,syy=0,sxy=0; const m=xs.length; for (let i=0;i<m;i++){sx+=xs[i];sy+=ys[i];sxx+=xs[i]*xs[i];syy+=ys[i]*ys[i];sxy+=xs[i]*ys[i];} const cx=sxx/m-(sx/m)**2, cy=syy/m-(sy/m)**2; return (sxy/m-(sx/m)*(sy/m))/Math.sqrt(cx*cy); };
const adj = [[],[]], cross = [[],[]], lag = [[],[]], zp = [];
for (let i = 0; i < n; i++) { for (let t = 0; t <= Y; t++) { cross[0].push(A[i][t]); cross[1].push(B[i][t]); if (i + 1 < n) { adj[0].push(A[i][t]); adj[1].push(A[i + 1][t]); } if (t < Y) { lag[0].push(A[i][t]); lag[1].push(A[i][t + 1]); } } zp.push(A[i][Y + 1]); }
console.log('corr(path i, path i+1), seed 7001:', corr(adj[0], adj[1]).toFixed(5), ' n =', adj[0].length, ' 1/sqrt(n) =', (1/Math.sqrt(adj[0].length)).toFixed(5));
console.log('corr(seed 7001 path i, seed 7002 path i):', corr(cross[0], cross[1]).toFixed(5));
console.log('lag-1 within path:', corr(lag[0], lag[1]).toFixed(5));
const all = cross[0]; const mu = all.reduce((s,x)=>s+x,0)/all.length; const v = all.reduce((s,x)=>s+(x-mu)**2,0)/all.length; const k4 = all.reduce((s,x)=>s+(x-mu)**4,0)/all.length/v/v;
console.log('annual z: mean', mu.toFixed(5), 'var', v.toFixed(5), 'kurtosis', k4.toFixed(4), ' max|z|', all.reduce((m, x) => Math.max(m, Math.abs(x)), 0).toFixed(3));
const zm = zp.reduce((s,x)=>s+x,0)/n, zv = zp.reduce((s,x)=>s+(x-zm)**2,0)/n; console.log('zPath (held shift): mean', zm.toFixed(4), 'var', zv.toFixed(4), 'n', n);
// survival SEs at the path counts used
for (const p of [0.80, 0.90, 0.95, 0.99]) console.log('p', p, [1000,3000,5400,8000,16000].map(N => `${N}:${(100*Math.sqrt(p*(1-p)/N)).toFixed(2)}`).join('  '));
