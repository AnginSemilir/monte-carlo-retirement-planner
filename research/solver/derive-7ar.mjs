/*
 * 7AR'S DERIVATION (predictions/diag-7ar.md; PLAN.md 7ar). What 7ap's records say before any 7ar solve, read through their
 * stamps (results/diag7ap, reduce-7ap.mjs's parse):
 *   1. S130 READER's bridge stage by world under the snapped (DEFAULT) and interpolated (PCLSI) axis - the rise r the items
 *      split - and the per-year residual at the plan years the prediction names (O69).
 *   2. The items' thresholds in points: r/3 and 2r/3.
 *   3. Power. 7ap printed each arm's per-path sd, not the paired one (the arms share their shocks, so the pairing is
 *      unknown until 7ar prints each path); the rise's z at 2,000 paired paths for a correlation of 0 to 0.9 between the
 *      arms' per-path stage residuals; item 1's z at a read share of 1 or 0 when d = share x R + noise of sd 0 or sd(R)/2.
 *   4. The time: 7ap's measured seconds on the two S130 READER units (the 1 Oct 2.80 GHz boot), times the current host's
 *      0.89 (results-host.txt, the 3 Oct line), and the PCLSF solve by the four-bucket axis's measured cost at 4 points
 *      (3 Oct: 205.8 s against 146.9 s, the session's dev solve; NOT a registered record - stated as such).
 * No solve. Output hashed on the prediction's derive: line.
 *   node research/solver/derive-7ar.mjs > research/solver/results-derive-7ar.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import * as AP from './reduce-7ap.mjs';
import { SPIKES, NPW, WORLD } from './reduce-7ar.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const logs = Object.fromEntries(readdirSync(join(HERE, 'results', 'diag7ap')).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(HERE, 'results', 'diag7ap', f), 'utf8')]));
requireFairLogs(logs, AP.PRED);
const us = Object.values(logs).flatMap(AP.parse);
const get = l => us.find(u => u.id === 'S130' && u.arm === 'READER' && u.label === l && u.done);
const D = get(AP.labelOf('TS+J', 'DEFAULT')), P = get(AP.labelOf('TS+J', 'PCLSI'));
const f2 = x => x.toFixed(2), f4 = x => x.toFixed(4);
console.log("7AR'S DERIVATION (7ap's S130 READER records through their stamps; no solve)");
console.log(`1. the bridge stage by world (per path, points; access at year ${D.access.year} of ${D.access.years})`);
const st = (u, k) => u.stage.find(x => x.k === k && x.stage === 'bridge');
for (let k = 0; k < 3; k++) console.log(`   world ${k}: DEFAULT mean ${f4(st(D, k).mean)} sd ${f4(st(D, k).sd)} through ${st(D, k).through}; PCLSI mean ${f4(st(P, k).mean)} sd ${f4(st(P, k).sd)} through ${st(P, k).through}; rise ${f4(st(P, k).mean - st(D, k).mean)}`);
const r = st(P, WORLD).mean - st(D, WORLD).mean, sD = st(D, WORLD).sd, sP = st(P, WORLD).sd;
console.log(`   the per-year residual (table - next) at the named plan years, world ${WORLD}:`);
for (const [nm, u] of [['DEFAULT', D], ['PCLSI', P]]) console.log(`     ${nm.padEnd(7)} ${SPIKES.map(t => { const x = u.resid.find(y => y.k === WORLD && y.t === t); return `y${t} ${f2(x.table - x.next)}`; }).join(' ')}`);
console.log(`2. the thresholds (world ${WORLD}): r ${f4(r)}; r/3 ${f4(r / 3)}; 2r/3 ${f4(2 * r / 3)} points a path`);
console.log(`3. power at ${NPW} paired paths (z = effect / (sd / sqrt(n)); one-sided at 0.05 after Holm over two needs z about 1.96 or more, power 0.8 at about 2.8)`);
for (const rho of [0, 0.5, 0.8, 0.9]) {
  const sR = Math.sqrt(sD * sD + sP * sP - 2 * rho * sD * sP), se = sR / Math.sqrt(NPW);
  // item 1 at share 1: d - 2R/3 = R/3 + noise; at share 0: R/3 - d = R/3 - noise; noise sd 0 or sd(R)/2
  const z1 = noise => (r / 3) / (Math.sqrt((sR / 3) ** 2 + noise * noise) / Math.sqrt(NPW));
  console.log(`   correlation ${rho.toFixed(1)}: sd(R) ${f2(sR)}, the rise's z ${f2(r / se)}; item 1 at a share of 1 or 0, z ${f2(z1(0))} (no noise) or ${f2(z1(sR / 2))} (noise sd(R)/2)`);
}
console.log(`4. the time (7ap's measured seconds, the 1 Oct 2.80 GHz boot, times 0.89 for the current host)`);
const secs = u => { const t = Object.values(logs).find(x => x.includes(`unit READER/${u.label} |`) && x.includes('S130')); const s = +/solve READER\/\S+: table \S+ secs (\d+)/.exec(t)[1]; const n = [...t.matchAll(/node READER\/\S+ world \d+ z \S+: sim \S+ paths \d+ secs (\d+)/g)].reduce((a, m) => a + +m[1], 0); return { s, n }; };
const a = secs(D), b = secs(P), H = 0.89, F4 = 205.8 / 146.9;
const unitsT = [['READER DEFAULT', a.s + a.n], ['READER PCLSI', b.s + b.n], ['READER PCLSF', b.s * F4 + b.n], ['OFF DEFAULT', a.s + a.n], ['OFF PCLSI', b.s + b.n]].map(([n, t]) => [n, t * H]);
for (const [n, t] of unitsT) console.log(`   ${n.padEnd(15)} ${Math.round(t)} s`);
const waves = xs => { const c = [0, 0, 0, 0]; for (const x of [...xs].sort((p, q) => q - p)) { c.sort((p, q) => p - q); c[0] += x; } return Math.max(...c); };
const tot = unitsT.reduce((t, [, x]) => t + x, 0);
console.log(`   5 units: ${(tot / 3600).toFixed(2)} core-hours; on four cores (longest first) ${(waves(unitsT.map(x => x[1])) / 3600).toFixed(2)} hours (the OFF units at READER's time: NOT CHECKED; the decomposition's extra reads not measured)`);
